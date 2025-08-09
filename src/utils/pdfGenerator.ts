import jsPDF from 'jspdf';
import { InvoiceData, ServiceItem } from '@/components/InvoiceForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCompanyProfile } from '@/utils/companyProfile';
import { maskAccountNumber } from './mask';
import { computeTotals } from '@/utils/totals';

export const getNextInvoiceNumber = (): string => {
  const lastNumber = localStorage.getItem('last-invoice-number') || '0';
  const nextNumber = parseInt(lastNumber) + 1;
  localStorage.setItem('last-invoice-number', nextNumber.toString());
  
  // Obtener prefijo del perfil de empresa
  const companyProfile = JSON.parse(localStorage.getItem('company-profile') || '{}');
  const prefix = companyProfile.invoicePrefix || 'FAC';
  
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
};

export const generateInvoicePDF = async (invoiceData: InvoiceData, invoiceNumber: string) => {
  const pdf = new jsPDF();
  
  const company = getCompanyProfile();
  const companyName = (company.businessName || invoiceData.businessName || '').trim();
  const rnc = (company.businessRnc || '').trim();
  const address = (company.businessAddress || '').trim();
  const city = (company.businessCity || '').trim();
  const country = (company.businessCountry || 'República Dominicana').trim();
  const postal = (company.businessPostalCode || '').trim();
  const phone = (company.businessPhone || '').trim();
  const countryShort = country === 'República Dominicana' ? 'RD' : country;
  const cityLine = [city, countryShort].filter(Boolean).join(', ');
  
  // Configuración de colores siguiendo el diseño de Bootis
  const blueColor = [37, 99, 235]; // Blue-600
  const grayDark = [55, 65, 81]; // Gray-700
  const grayMedium = [107, 114, 128]; // Gray-500
  const grayLight = [243, 244, 246]; // Gray-100
  const darkTableHeader = [55, 65, 81]; // Dark gray for table header
  
  pdf.setFont('helvetica');
  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const totals = computeTotals(invoiceData);

  // Header Section - Logo y Company Info (lado izquierdo)
  if (invoiceData.logo) {
    try {
      pdf.addImage(invoiceData.logo, 'PNG', 20, yPosition, 25, 25);
    } catch (error) {
      console.warn('Error adding logo to PDF:', error);
    }
  }

  // Nombre de empresa y subtítulo
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  pdf.text(companyName, invoiceData.logo ? 50 : 20, yPosition + 10);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);

  // Título FACTURA (lado derecho)
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('FACTURA', 140, yPosition + 15);
  
  // Número de factura
  pdf.setFontSize(10);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text(`# ${invoiceNumber}`, 140, yPosition + 25);

  // Saldo adeudado (caja gris)
  const currencyFmt = new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP'
  });
  const totalFormatted = currencyFmt.format(totals.total);
  const balanceDue = invoiceData.paymentStatus === 'pagado' ? 0 : totals.total;
  const balanceFormatted = currencyFmt.format(balanceDue);
  
  pdf.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  pdf.rect(140, yPosition + 30, 50, 20, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Saldo adeudado', 145, yPosition + 38);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(balanceFormatted, 145, yPosition + 46);

  // Información de la empresa (debajo del logo)
  yPosition += 35;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  const line1 = `${companyName}${rnc ? ` | RNC ${rnc}` : ''}`;
  pdf.text(line1, 20, yPosition);
  yPosition += 6;
  if (address) {
    pdf.text(address, 20, yPosition);
    yPosition += 6;
  }
  if (cityLine || postal) {
    pdf.text(`${cityLine}${postal ? ` | ${postal}` : ''}`, 20, yPosition);
    yPosition += 6;
  }
  if (country) {
    pdf.text(country, 20, yPosition);
    yPosition += 6;
  }
  if (phone) {
    pdf.text(`Tel: ${phone}`, 20, yPosition);
  }

  // Sección de detalles de factura
  yPosition += 25;
  
  // Cliente (lado izquierdo)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Facturar a', 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoiceData.clientName, 20, yPosition);
  
  if (invoiceData.clientId) {
    yPosition += 8;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`RNC/Cédula: ${invoiceData.clientId}`, 20, yPosition);
  }
  
  if (invoiceData.clientPhone) {
    yPosition += 6;
    pdf.text(`Tel: ${invoiceData.clientPhone}`, 20, yPosition);
  }

  // Detalles de fecha (lado derecho)
  const dateFormatted = format(invoiceData.date, "dd MMM yyyy", { locale: es });
  
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Fecha de la factura :', 120, yPosition - 16);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(dateFormatted, 160, yPosition - 16);
  
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Términos :', 120, yPosition - 10);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Pagadera a la recepción', 160, yPosition - 10);
  
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Fecha de vencimiento :', 120, yPosition - 4);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(dateFormatted, 160, yPosition - 4);

  // Banda de información: Tipo de factura y NCF
  const invoiceTypeMap: Record<string, string> = {
    'fiscal': 'Factura con comprobante fiscal',
    'gubernamental': 'Comprobante Gubernamental',
    'consumidor-final': 'Factura de Consumidor Final',
    'sin-ncf': 'Factura sin comprobante fiscal',
    'nota-credito': 'Nota de crédito',
    'nota-debito': 'Nota de débito'
  };
  const tipoLabel = invoiceTypeMap[(invoiceData as any).invoiceType] || 'Factura';
  pdf.setFillColor(239, 246, 255);
  pdf.rect(20, yPosition, 170, 10, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 64, 175);
  pdf.text(`Tipo: ${tipoLabel}`, 22, yPosition + 6);
  pdf.text(`NCF: ${invoiceData.ncf || 'N/A'}`, 120, yPosition + 6);

  // Tabla de servicios
  yPosition += 15;
  pdf.setFillColor(darkTableHeader[0], darkTableHeader[1], darkTableHeader[2]);
  pdf.rect(20, yPosition, 170, 10, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Producto/Servicio', 22, yPosition + 6);
  pdf.text('Precio', 120, yPosition + 6);
  pdf.text('Cantidad', 145, yPosition + 6);
  pdf.text('ITBIS', 170, yPosition + 6);
  pdf.text('Total', 184, yPosition + 6);
  yPosition += 10;
  
  // Servicios
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };
  
  invoiceData.services.forEach((service, index) => {
    yPosition += 8;
    
    // Línea separadora
    if (index > 0) {
      pdf.setDrawColor(229, 231, 235);
      pdf.line(20, yPosition - 4, 190, yPosition - 4);
    }
    
    pdf.setFontSize(9);
    // Descripción
    const description = pdf.splitTextToSize(service.concept, 90);
    pdf.text(description[0], 22, yPosition);

    const qty = parseFloat(((service as any).quantity || '1'));
    const unit = parseFloat(((service as any).unitPrice || (service as any).amount || '0'));
    const disc = parseFloat(((service as any).lineDiscountAbs || '0')) || 0;
    const isExempt = (service as any).isExempt === true;
    const rateRaw = (service as any).itbisRate;
    const rate = isExempt ? 0 : (rateRaw != null && rateRaw !== '' ? Number(rateRaw) : 0.18);

    const gross = (isNaN(qty) || isNaN(unit)) ? 0 : qty * unit;
    const net = Math.max(0, gross - Math.max(0, disc));
    const tax = Math.max(0, net * (isFinite(rate) ? rate : 0.18));
    const lineTotal = net + tax;

    // Precio
    pdf.text(formatCurrency(unit), 120, yPosition);
    // Cantidad
    pdf.text((isNaN(qty) ? 0 : qty).toFixed(2), 145, yPosition);
    // ITBIS
    pdf.text(formatCurrency(tax), 170, yPosition);
    // Total línea
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(lineTotal), 184, yPosition);
    pdf.setFont('helvetica', 'normal');
  });

  // Totales (alineados a la derecha)
  yPosition += 20;
  
  const subtotalFormatted = formatCurrency(totals.subtotal);
  const grossNet = (totals as any).taxableNet + (totals as any).exemptNet;
  const discountAmount = Math.max(0, Number(((grossNet || 0) - (totals.subtotal || 0)).toFixed(2)));

  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Subtotal', 150, yPosition);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(subtotalFormatted, 170, yPosition);

  if (discountAmount > 0) {
    yPosition += 8;
    pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
    pdf.text('Descuento', 150, yPosition);
    pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
    pdf.text(formatCurrency(discountAmount), 170, yPosition);
  }

  if (totals.itbis && totals.itbis > 0) {
    yPosition += 8;
    pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
    pdf.text('ITBIS (18%)', 150, yPosition);
    pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
    pdf.text(formatCurrency(totals.itbis), 170, yPosition);
  }

  yPosition += 8;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(150, yPosition, 190, yPosition);

  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Total Neto', 150, yPosition);
  pdf.text(totalFormatted, 170, yPosition);

  yPosition += 8;
  pdf.line(150, yPosition, 190, yPosition);

  yPosition += 8;
  pdf.text('Saldo adeudado', 150, yPosition);
  pdf.text(balanceFormatted, 170, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Estado de pago', 150, yPosition);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(invoiceData.paymentStatus === 'pagado' ? 'Pagado' : 'A crédito', 170, yPosition);

  // Método de pago (debajo de totales)
  try {
    const methodKey = (localStorage.getItem('checkout:selected_method') || '').toLowerCase();
    const methodMap: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', transferencia: 'Transferencia', paypal: 'PayPal', otros: 'Otros' };
    const methodLabel = methodMap[methodKey];
    if (methodLabel) {
      yPosition += 8;
      pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
      pdf.text('Método de pago', 150, yPosition);
      pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
      pdf.text(methodLabel, 170, yPosition);

      if (false) {
        let acc: any = null;
        try {
          const selectedId = localStorage.getItem('checkout:selected_account_id');
          const raw = localStorage.getItem('payments:cuentas_bancarias');
          const accounts = raw ? JSON.parse(raw) as any[] : [];
          if (selectedId) acc = accounts.find(a => a.id === selectedId) || null;
          if (!acc) {
            const actives = accounts.filter(a => a.activa);
            acc = actives.find((a: any) => a.preferida) || actives[0] || null;
          }
        } catch {}
        if (acc && acc.numero) {
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
          const detail = `Banco: ${acc.banco_nombre} • Tipo: ${acc.tipo} • Cuenta: ${maskAccountNumber(acc.numero)} • Alias: ${acc.alias}`;
          pdf.text(detail, 20, yPosition);
        }
      }
    }
  } catch {}

  // Notas
  yPosition += 20;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Notas', 20, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  const notesText = (invoiceData.notas && invoiceData.notas.trim().length > 0) ? invoiceData.notas.trim() : 'Gracias por su confianza.';
  const notesLines = pdf.splitTextToSize(notesText, 170);
  notesLines.forEach((line, idx) => {
    pdf.text(line, 20, yPosition + idx * 5);
  });
  yPosition += Math.max(0, (notesLines.length - 1) * 5);

  // Opciones de pago
  yPosition += 15;
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Opciones de pago', 20, yPosition);
  
  // Logos de pago (texto estilizado)
  // VISA
  pdf.setFillColor(26, 31, 113);
  pdf.rect(80, yPosition - 4, 18, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7);
  pdf.text('VISA', 83, yPosition);
  
  // Mastercard
  pdf.setFillColor(235, 0, 27);
  pdf.rect(102, yPosition - 4, 30, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Mastercard', 104, yPosition);
  
  // Depósito / Transferencia
  pdf.setFillColor(229, 231, 235);
  pdf.rect(135, yPosition - 4, 45, 8, 'F');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Depósito/Transfer.', 137, yPosition);

  // NCF si existe
  if (invoiceData.ncf && !invoiceData.ncf.startsWith('FAC-')) {
    yPosition += 20;
    pdf.setFillColor(239, 246, 255); // Light blue background
    pdf.rect(20, yPosition - 5, 170, 15, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(`NCF: ${invoiceData.ncf}`, 22, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    pdf.text('Comprobante Fiscal válido para fines tributarios - DGII', 22, yPosition + 6);
  }

  // Guardar el PDF
  pdf.save(`Factura-${invoiceNumber}.pdf`);
};

// NUEVO: Generar PDF como Blob (sin descargar)
export const generateInvoicePDFBlob = async (invoiceData: InvoiceData, invoiceNumber: string): Promise<Blob> => {
  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF();

  const { getCompanyProfile } = await import('@/utils/companyProfile');
  const { format } = await import('date-fns');
  const { es } = await import('date-fns/locale');

  const company = getCompanyProfile();
  const companyName = (company.businessName || invoiceData.businessName || '').trim();
  const rnc = (company.businessRnc || '').trim();
  const address = (company.businessAddress || '').trim();
  const city = (company.businessCity || '').trim();
  const country = (company.businessCountry || 'República Dominicana').trim();
  const postal = (company.businessPostalCode || '').trim();
  const phone = (company.businessPhone || '').trim();
  const countryShort = country === 'República Dominicana' ? 'RD' : country;
  const cityLine = [city, countryShort].filter(Boolean).join(', ');

  const blueColor = [37, 99, 235];
  const grayDark = [55, 65, 81];
  const grayMedium = [107, 114, 128];
  const grayLight = [243, 244, 246];
  const darkTableHeader = [55, 65, 81];

  pdf.setFont('helvetica');
  let yPosition = 20;
  const totals = computeTotals(invoiceData);

  if (invoiceData.logo) {
    try {
      pdf.addImage(invoiceData.logo, 'PNG', 20, yPosition, 25, 25);
    } catch {}
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
  pdf.text(companyName, invoiceData.logo ? 50 : 20, yPosition + 10);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);

  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('FACTURA', 140, yPosition + 15);

  pdf.setFontSize(10);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text(`# ${invoiceNumber}`, 140, yPosition + 25);

  const currencyFmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
  const totalFormatted = currencyFmt.format(totals.total);
  const balanceDue = invoiceData.paymentStatus === 'pagado' ? 0 : totals.total;
  const balanceFormatted = currencyFmt.format(balanceDue);

  pdf.setFillColor(grayLight[0], grayLight[1], grayLight[2]);
  pdf.rect(140, yPosition + 30, 50, 20, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Saldo adeudado', 145, yPosition + 38);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(balanceFormatted, 145, yPosition + 46);

  yPosition += 35;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  const line1 = `${companyName}${rnc ? ` | RNC ${rnc}` : ''}`;
  pdf.text(line1, 20, yPosition);
  yPosition += 6;
  if (address) { pdf.text(address, 20, yPosition); yPosition += 6; }
  if (cityLine || postal) { pdf.text(`${cityLine}${postal ? ` | ${postal}` : ''}`, 20, yPosition); yPosition += 6; }
  if (country) { pdf.text(country, 20, yPosition); }

  yPosition += 25;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Facturar a', 20, yPosition);

  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoiceData.clientName, 20, yPosition);

  if (invoiceData.clientId) { yPosition += 8; pdf.setFontSize(9); pdf.setFont('helvetica', 'normal'); pdf.text(`RNC/Cédula: ${invoiceData.clientId}`, 20, yPosition); }
  if (invoiceData.clientPhone) { yPosition += 6; pdf.text(`Tel: ${invoiceData.clientPhone}`, 20, yPosition); }

  const dateFormatted = format(invoiceData.date, "dd MMM yyyy", { locale: es });
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Fecha de la factura :', 120, yPosition - 16);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(dateFormatted, 160, yPosition - 16);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Términos :', 120, yPosition - 10);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Pagadera a la recepción', 160, yPosition - 10);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Fecha de vencimiento :', 120, yPosition - 4);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(dateFormatted, 160, yPosition - 4);

  yPosition += 25;
  pdf.setFillColor(darkTableHeader[0], darkTableHeader[1], darkTableHeader[2]);
  pdf.rect(20, yPosition, 170, 10, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('#', 22, yPosition + 6);
  pdf.text('Artículo & Descripción', 30, yPosition + 6);
  pdf.text('Cant.', 130, yPosition + 6);
  pdf.text('Precio unit.', 150, yPosition + 6);
  pdf.text('Subtotal', 170, yPosition + 6);
  yPosition += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(num);
  };

  invoiceData.services.forEach((service, index) => {
    yPosition += 8;
    if (index > 0) { pdf.setDrawColor(229, 231, 235); pdf.line(20, yPosition - 4, 190, yPosition - 4); }
    pdf.setFontSize(9);
    pdf.text((index + 1).toString(), 22, yPosition);
    const description = pdf.splitTextToSize(service.concept, 90);
    pdf.text(description[0], 30, yPosition);
    const qty = parseFloat(((service as any).quantity || '1'));
    const unit = parseFloat(((service as any).unitPrice || (service as any).amount || '0'));
    const unitFormatted = formatCurrency(unit);
    const lineSubtotal = (isNaN(qty) || isNaN(unit)) ? 0 : qty * unit;
    pdf.text((isNaN(qty) ? 0 : qty).toFixed(2), 130, yPosition);
    pdf.text(unitFormatted, 150, yPosition);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(lineSubtotal), 170, yPosition);
    pdf.setFont('helvetica', 'normal');
  });

  yPosition += 20;
  const subtotalFormatted = formatCurrency(totals.subtotal);
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Subtotal', 150, yPosition);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(subtotalFormatted, 170, yPosition);

  if (totals.itbis && totals.itbis > 0) {
    yPosition += 8;
    pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
    pdf.text('ITBIS (18%)', 150, yPosition);
    pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
    pdf.text(formatCurrency(totals.itbis), 170, yPosition);
  }

  yPosition += 8;
  pdf.setDrawColor(229, 231, 235);
  pdf.line(150, yPosition, 190, yPosition);

  yPosition += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Total', 150, yPosition);
  pdf.text(totalFormatted, 170, yPosition);

  yPosition += 8;
  pdf.line(150, yPosition, 190, yPosition);

  yPosition += 8;
  pdf.text('Saldo adeudado', 150, yPosition);
  pdf.text(balanceFormatted, 170, yPosition);

  yPosition += 8;
  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Estado de pago', 150, yPosition);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(invoiceData.paymentStatus === 'pagado' ? 'Pagado' : 'A crédito', 170, yPosition);

  // Método de pago (debajo de totales)
  try {
    const methodKey = (localStorage.getItem('checkout:selected_method') || '').toLowerCase();
    const methodMap: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', transferencia: 'Transferencia', paypal: 'PayPal', otros: 'Otros' };
    const methodLabel = methodMap[methodKey];
    if (methodLabel) {
      yPosition += 8;
      pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
      pdf.text('Método de pago', 150, yPosition);
      pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
      pdf.text(methodLabel, 170, yPosition);

      if (false) {
        let acc: any = null;
        try {
          const selectedId = localStorage.getItem('checkout:selected_account_id');
          const raw = localStorage.getItem('payments:cuentas_bancarias');
          const accounts = raw ? JSON.parse(raw) as any[] : [];
          if (selectedId) acc = accounts.find(a => a.id === selectedId) || null;
          if (!acc) {
            const actives = accounts.filter(a => a.activa);
            acc = actives.find((a: any) => a.preferida) || actives[0] || null;
          }
        } catch {}
        if (acc && acc.numero) {
          const { maskAccountNumber } = await import('@/utils/mask');
          yPosition += 8;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
          const detail = `Banco: ${acc.banco_nombre} • Tipo: ${acc.tipo} • Cuenta: ${maskAccountNumber(acc.numero)} • Alias: ${acc.alias}`;
          pdf.text(detail, 20, yPosition);
        }
      }
    }
  } catch {}

  yPosition += 20;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Notas', 20, yPosition);
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  const notesText2 = (invoiceData.notas && invoiceData.notas.trim().length > 0) ? invoiceData.notas.trim() : 'Gracias por su confianza.';
  const notesLines2 = pdf.splitTextToSize(notesText2, 170);
  notesLines2.forEach((line, idx) => {
    pdf.text(line, 20, yPosition + idx * 5);
  });
  yPosition += Math.max(0, (notesLines2.length - 1) * 5);

  yPosition += 15;
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Opciones de pago', 20, yPosition);
  pdf.setFillColor(26, 31, 113); pdf.rect(80, yPosition - 4, 18, 8, 'F'); pdf.setTextColor(255, 255, 255); pdf.setFontSize(7); pdf.text('VISA', 83, yPosition);
  pdf.setFillColor(235, 0, 27); pdf.rect(102, yPosition - 4, 30, 8, 'F'); pdf.setTextColor(255, 255, 255); pdf.text('Mastercard', 104, yPosition);
  pdf.setFillColor(229, 231, 235); pdf.rect(135, yPosition - 4, 45, 8, 'F'); pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]); pdf.text('Depósito/Transfer.', 137, yPosition);

  if (invoiceData.ncf && !invoiceData.ncf.startsWith('FAC-')) {
    yPosition += 20;
    pdf.setFillColor(239, 246, 255);
    pdf.rect(20, yPosition - 5, 170, 15, 'F');
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(`NCF: ${invoiceData.ncf}`, 22, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    pdf.text('Comprobante Fiscal válido para fines tributarios - DGII', 22, yPosition + 6);
  }

  // Devolver blob sin descargar
  return pdf.output('blob');
};