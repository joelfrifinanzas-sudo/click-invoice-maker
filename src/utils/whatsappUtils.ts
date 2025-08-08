import { InvoiceData } from '@/components/InvoiceForm';
import { generateInvoicePDFBlob } from './pdfGenerator';
import { generateWhatsAppLink } from './shareUtils';
import { logError } from './logger';

// Genera PDF como Blob y realiza el flujo de compartir sin bloquear la SPA
export const shareInvoiceViaWhatsApp = async (invoiceData: InvoiceData, invoiceNumber: string) => {
  let objectUrl: string | null = null;
  try {
    // 1) Generar PDF como Blob (sin descargar ni navegar)
    const pdfBlob = await generateInvoicePDFBlob(invoiceData, invoiceNumber);

    // Crear object URL
    objectUrl = URL.createObjectURL(pdfBlob);

    // 2) Compartir (mobile/web)
    const file = new File([pdfBlob], `Factura-${invoiceNumber}.pdf`, { type: 'application/pdf' });
    const message = createShareMessage(invoiceData, invoiceNumber);

    // Web Share API con archivos
    const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator && (navigator as any).canShare?.({ files: [file] });
    if (canShareFiles && 'share' in navigator) {
      await (navigator as any).share({
        files: [file],
        text: message,
        title: `Factura ${invoiceNumber}`,
      });
      return;
    }

    // Fallback: abrir WhatsApp con link seguro (mobile/web)
    const waUrl = buildWhatsAppUrl(invoiceData, `${message}\n${objectUrl}`);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    // Log y fallback simple sin archivo adjunto
    logError('share_whatsapp_error', { invoiceNumber }, error);
    const message = createShareMessage(invoiceData, invoiceNumber);
    const waUrl = buildWhatsAppUrl(invoiceData, message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  } finally {
    // 3) Post-share: limpiar y restaurar
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};

const createShareMessage = (invoiceData: InvoiceData, invoiceNumber: string) => {
  // Mensaje corto para acompañar el archivo o el enlace
  const fmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
  const total = fmt.format(invoiceData.total);
  return `Factura #${invoiceNumber} por ${total} - ${invoiceData.businessName}`;
};

const buildWhatsAppUrl = (invoiceData: InvoiceData, text: string) => {
  const encoded = encodeURIComponent(text);
  const phone = (invoiceData.clientPhone || '').replace(/[\s\-\(\)]/g, '');
  // Mobile intent vs web universal link
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (phone) {
    return isMobile ? `whatsapp://send?phone=${phone}&text=${encoded}` : `https://wa.me/${phone}?text=${encoded}`;
  }
  return isMobile ? `whatsapp://send?text=${encoded}` : `https://wa.me/?text=${encoded}`;
};