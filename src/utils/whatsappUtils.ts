import { InvoiceData } from '@/components/InvoiceForm';
import { generateInvoicePDF } from './pdfGenerator';

// Función para generar PDF como blob y enviarlo por WhatsApp
export const shareInvoiceViaWhatsApp = async (invoiceData: InvoiceData, invoiceNumber: string) => {
  try {
    // Generar el PDF
    const pdfBlob = await generateInvoicePDFAsBlob(invoiceData, invoiceNumber);
    
    // Crear URL temporal para el archivo
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Crear mensaje de WhatsApp
    const message = createWhatsAppMessage(invoiceData, invoiceNumber);
    
    // Verificar si es móvil o desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && 'share' in navigator) {
      // Usar Web Share API en móviles que lo soporten
      try {
        await navigator.share({
          title: `Factura #${invoiceNumber}`,
          text: message,
          files: [new File([pdfBlob], `Factura-${invoiceNumber}.pdf`, { type: 'application/pdf' })]
        });
        return;
      } catch (shareError) {
        console.log('Web Share API not available, falling back to download');
      }
    }
    
    // Fallback: descargar el PDF y abrir WhatsApp con el mensaje
    downloadPDF(pdfBlob, `Factura-${invoiceNumber}-${invoiceData.clientName.replace(/\s+/g, '-')}.pdf`);
    
    // Abrir WhatsApp con el mensaje
    const whatsappUrl = createWhatsAppUrl(invoiceData, message);
    window.open(whatsappUrl, '_blank');
    
    // Limpiar URL temporal después de un tiempo
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    
  } catch (error) {
    console.error('Error sharing invoice via WhatsApp:', error);
    throw error;
  }
};

// Función para generar PDF como Blob
const generateInvoicePDFAsBlob = async (invoiceData: InvoiceData, invoiceNumber: string): Promise<Blob> => {
  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF();
  
  // Reutilizar la lógica del generador existente pero retornar blob
  // ... (implementar la misma lógica que generateInvoicePDF pero con output blob)
  
  // Por ahora, usar el método existente y convertir
  await generateInvoicePDF(invoiceData, invoiceNumber);
  
  // Convertir PDF a blob (temporal - necesitaríamos refactorizar generateInvoicePDF)
  const pdfBlob = pdf.output('blob');
  return pdfBlob;
};

// Función para crear el mensaje de WhatsApp
const createWhatsAppMessage = (invoiceData: InvoiceData, invoiceNumber: string): string => {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };

  const subtotal = invoiceData.subtotal;
  const total = invoiceData.total;

  return `🧾 *FACTURA #${invoiceNumber}*

📄 *PDF adjunto*

👤 *Cliente:* ${invoiceData.clientName}
💰 *Total:* ${formatCurrency(total.toString())}
${invoiceData.ncf ? `🔢 *NCF:* ${invoiceData.ncf}` : ''}

✅ ${invoiceData.businessName}

_Generado con Factura en 1 Click_`;
};

// Función para crear URL de WhatsApp
const createWhatsAppUrl = (invoiceData: InvoiceData, message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  
  if (invoiceData.clientPhone && invoiceData.clientPhone.trim()) {
    // Limpiar el número de teléfono
    const cleanPhone = invoiceData.clientPhone.replace(/[\s\-\(\)]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  
  return `https://wa.me/?text=${encodedMessage}`;
};

// Función para descargar PDF
const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};