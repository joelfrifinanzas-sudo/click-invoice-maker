import jsPDF from 'jspdf';
import { InvoiceData, ServiceItem } from '@/components/InvoiceForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCompanyProfile } from '@/utils/companyProfile';

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
  const totalFormatted = currencyFmt.format(invoiceData.total);
  const balanceDue = invoiceData.paymentStatus === 'pagado' ? 0 : invoiceData.total;
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

  // Tabla de servicios
  yPosition += 25;
  
  // Header de tabla (fondo gris oscuro)
  pdf.setFillColor(darkTableHeader[0], darkTableHeader[1], darkTableHeader[2]);
  pdf.rect(20, yPosition, 170, 10, 'F');
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255); // White text
  pdf.text('#', 22, yPosition + 6);
  pdf.text('Artículo & Descripción', 30, yPosition + 6);
  pdf.text('Cant.', 130, yPosition + 6);
  pdf.text('Precio unit.', 150, yPosition + 6);
  pdf.text('Subtotal', 170, yPosition + 6);
  
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
    pdf.text((index + 1).toString(), 22, yPosition);
    
    // Descripción (puede ser larga)
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

  // Totales (alineados a la derecha)
  yPosition += 20;
  
  const subtotalFormatted = formatCurrency(invoiceData.subtotal);

  pdf.setFontSize(9);
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Subtotal', 150, yPosition);
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text(subtotalFormatted, 170, yPosition);

  if (invoiceData.itbisAmount && invoiceData.itbisAmount > 0) {
    yPosition += 8;
    pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
    pdf.text('ITBIS (18%)', 150, yPosition);
    pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
    pdf.text(formatCurrency(invoiceData.itbisAmount), 170, yPosition);
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

  // Notas
  yPosition += 20;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(grayDark[0], grayDark[1], grayDark[2]);
  pdf.text('Notas', 20, yPosition);
  
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(grayMedium[0], grayMedium[1], grayMedium[2]);
  pdf.text('Gracias por su confianza.', 20, yPosition);

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