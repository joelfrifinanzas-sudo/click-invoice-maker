import jsPDF from 'jspdf';
import { InvoiceData } from '@/components/InvoiceForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const getNextInvoiceNumber = (): string => {
  const lastNumber = localStorage.getItem('last-invoice-number') || '0';
  const nextNumber = parseInt(lastNumber) + 1;
  localStorage.setItem('last-invoice-number', nextNumber.toString());
  return nextNumber.toString().padStart(4, '0');
};

export const generateInvoicePDF = async (invoiceData: InvoiceData, invoiceNumber: string) => {
  const pdf = new jsPDF();
  
  // Configuración de colores
  const primaryBlue = [34, 64, 170]; // RGB for hsl(220 90% 56%)
  const lightGray = [107, 114, 128]; // RGB for text-gray-500
  const darkText = [17, 24, 39]; // RGB for text-gray-900
  
  // Configuración de fuentes
  pdf.setFont('helvetica');
  
  let yPosition = 30;
  
  // Logo (si existe)
  if (invoiceData.logo) {
    try {
      // Convertir base64 a imagen
      const logoSize = 25;
      pdf.addImage(invoiceData.logo, 'JPEG', 20, yPosition - 5, logoSize, logoSize);
      yPosition += logoSize + 10;
    } catch (error) {
      console.log('Error adding logo:', error);
      yPosition += 10;
    }
  }
  
  // Título FACTURA
  pdf.setFontSize(28);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FACTURA', 20, yPosition);
  
  // Número de factura
  pdf.setFontSize(14);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`#${invoiceNumber}`, 20, yPosition + 10);
  
  // Fecha (alineada a la derecha)
  const pageWidth = pdf.internal.pageSize.getWidth();
  pdf.setFontSize(12);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('Fecha de emisión:', pageWidth - 80, yPosition);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.setFont('helvetica', 'bold');
  const formattedDate = format(invoiceData.date, "dd 'de' MMMM 'de' yyyy", { locale: es });
  pdf.text(formattedDate, pageWidth - 80, yPosition + 8);
  
  yPosition += 40;
  
  // Información del negocio
  pdf.setFontSize(14);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DE:', 20, yPosition);
  
  pdf.setFontSize(12);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoiceData.businessName, 20, yPosition + 10);
  
  yPosition += 30;
  
  // Información del cliente
  pdf.setFontSize(14);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FACTURAR A:', 20, yPosition);
  
  pdf.setFontSize(12);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text(invoiceData.clientName, 20, yPosition + 10);
  
  if (invoiceData.clientId) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.text(`Cédula/RNC: ${invoiceData.clientId}`, 20, yPosition + 20);
    yPosition += 10;
  }
  
  yPosition += 40;
  
  // Tabla de servicios - Encabezado
  pdf.setFontSize(12);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  
  // Fondo del encabezado
  pdf.setFillColor(220, 235, 255); // Light blue background
  pdf.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
  
  pdf.text('DESCRIPCIÓN', 25, yPosition + 5);
  pdf.text('CANT.', pageWidth - 120, yPosition + 5);
  pdf.text('MONTO', pageWidth - 60, yPosition + 5);
  
  yPosition += 20;
  
  // Contenido de la tabla
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.setFont('helvetica', 'normal');
  
  // Dividir el concepto en líneas si es muy largo
  const maxWidth = pageWidth - 140;
  const conceptLines = pdf.splitTextToSize(invoiceData.concept, maxWidth);
  
  conceptLines.forEach((line: string, index: number) => {
    pdf.text(line, 25, yPosition + (index * 6));
  });
  
  pdf.text('1', pageWidth - 120, yPosition);
  
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };
  
  pdf.text(formatCurrency(invoiceData.amount), pageWidth - 60, yPosition);
  
  yPosition += Math.max(conceptLines.length * 6, 15) + 20;
  
  // Línea separadora
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 15;
  
  // Cálculos
  const subtotal = parseFloat(invoiceData.amount);
  const itbis = subtotal * 0.18;
  const total = subtotal + itbis;
  
  // Subtotal
  pdf.setFontSize(11);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('Subtotal:', pageWidth - 100, yPosition);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.text(formatCurrency(subtotal.toString()), pageWidth - 60, yPosition);
  
  yPosition += 12;
  
  // ITBIS
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('ITBIS (18%):', pageWidth - 100, yPosition);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.text(formatCurrency(itbis.toString()), pageWidth - 60, yPosition);
  
  yPosition += 15;
  
  // Línea para total
  pdf.setLineWidth(1);
  pdf.line(pageWidth - 100, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 12;
  
  // Total
  pdf.setFontSize(14);
  pdf.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TOTAL:', pageWidth - 100, yPosition);
  pdf.text(formatCurrency(total.toString()), pageWidth - 60, yPosition);
  
  // Firma al pie
  const pageHeight = pdf.internal.pageSize.getHeight();
  const footerY = pageHeight - 60;
  
  // Línea para firma
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.line(20, footerY, 80, footerY);
  
  // Nombre de firma
  pdf.setFontSize(10);
  pdf.setTextColor(darkText[0], darkText[1], darkText[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.text(invoiceData.signatureName, 20, footerY + 8);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('Firma autorizada', 20, footerY + 16);
  
  // Pie de página
  pdf.setFontSize(9);
  pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  pdf.text('Gracias por su preferencia', 20, pageHeight - 25);
  pdf.text('Generado con Factura en 1 Click', 20, pageHeight - 15);
  
  // Descargar PDF
  pdf.save(`Factura-${invoiceNumber}-${invoiceData.clientName.replace(/\s+/g, '-')}.pdf`);
};