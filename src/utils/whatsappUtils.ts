import { InvoiceData } from '@/components/InvoiceForm';
import { generateInvoicePDFBlob } from './pdfGenerator';

import { logError } from './logger';

// Genera PDF como Blob y realiza el flujo de compartir sin bloquear la SPA
export const shareInvoiceViaWhatsApp = async (invoiceData: InvoiceData, invoiceNumber: string) => {
  let objectUrl: string | null = null;
  try {
    // Validaciones previas
    const phoneRaw = (invoiceData.clientPhone || '').trim();
    const phone = normalizePhone(phoneRaw);
    if (!isValidRDWhatsApp(phone)) {
      const err = new Error('Agrega un número de WhatsApp válido del cliente (+1 809/829/849).');
      logError('whatsapp_invalid_phone', { invoiceNumber, phoneRaw }, err);
      throw err;
    }
    if (!invoiceNumber?.trim() || !Number.isFinite(invoiceData.total) || invoiceData.total <= 0) {
      const err = new Error('Completa los datos de la factura antes de enviar');
      logError('whatsapp_invalid_invoice_data', { invoiceNumber, total: invoiceData.total }, err);
      throw err;
    }

    // 1) Generar PDF como Blob (sin descargar ni navegar)
    const pdfBlob = await generateInvoicePDFBlob(invoiceData, invoiceNumber);

    // Crear object URL para Web Share API (no se incluye en WA si no se adjunta)
    objectUrl = URL.createObjectURL(pdfBlob);

    // 2) Compartir (mobile/web)
    const file = new File([pdfBlob], `Factura-${invoiceNumber}.pdf`, { type: 'application/pdf' });
    const message = buildWhatsAppMessage(invoiceData, invoiceNumber);

    // Web Share API con archivos (adjunta el PDF cuando es compatible)
    const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator && (navigator as any).canShare?.({ files: [file] });
    if (canShareFiles && 'share' in navigator) {
      await (navigator as any).share({ files: [file], text: message, title: `Factura ${invoiceNumber}` });
      saveSendLog({ invoiceNumber, clientName: invoiceData.clientName, phone, status: 'enviado', pdfUrl: null });
      return;
    }

    // Fallback: abrir WhatsApp con link seguro (sin blob://)
    const waUrl = buildWhatsAppUrl(phone, message);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    saveSendLog({ invoiceNumber, clientName: invoiceData.clientName, phone, status: 'abierto', pdfUrl: null });
  } catch (error) {
    // Log y fallback simple sin archivo adjunto
    logError('share_whatsapp_error', { invoiceNumber }, error);
    throw error;
  } finally {
    // 3) Post-share: limpiar y restaurar
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
};

const buildWhatsAppMessage = (invoiceData: InvoiceData, invoiceNumber: string) => {
  const fmt = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', minimumFractionDigits: 2 });
  const totalFmt = fmt.format(invoiceData.total || 0).replace('RD$\u00A0', 'RD$').replace('RD$ ', 'RD$');
  const lines: string[] = [];
  lines.push(`*FACTURA #${invoiceNumber}*`);
  lines.push('');
  lines.push('📄 *PDF adjunto*');
  lines.push('');
  lines.push(`👤 *Cliente:* ${invoiceData.clientName || ''}`);
  lines.push(`💰 *Total:* ${totalFmt}`);

  // Insertar cuenta para pago (solo si el método elegido es Transferencia)
  try {
    const methodKey = (localStorage.getItem('checkout:selected_method') || '').toLowerCase();
    if (methodKey === 'transferencia') {
      const selectedId = localStorage.getItem('checkout:selected_account_id');
      let acc: any = null;
      try {
        const raw = localStorage.getItem('payments:cuentas_bancarias');
        const accounts = raw ? JSON.parse(raw) as any[] : [];
        if (selectedId) acc = accounts.find(a => a.id === selectedId) || null;
        if (!acc) {
          const actives = accounts.filter(a => a.activa);
          acc = actives.find((a: any) => a.preferida) || actives[0] || null;
        }
      } catch {}
      if (acc && acc.numero) {
        const mask = (val: string) => { const digits = String(val).replace(/\s+/g, ''); const last4 = digits.slice(-4); return `•••• ${last4}`; };
        lines.push(`🏦 *Cuenta para pago:* ${acc.banco_nombre} • ${acc.tipo} • ${mask(acc.numero)} (${acc.alias})`);
      }
    }
  } catch {}

  if (invoiceData.ncf && invoiceData.ncf.trim()) {
    lines.push(`🔢 *NCF:* ${invoiceData.ncf.trim()}`);
  }

  lines.push('');
  lines.push(`✅ ${invoiceData.businessName || ''}`);
  return lines.join('\n');
};

const buildWhatsAppUrl = (phoneE164: string, text: string) => {
  const encoded = encodeURIComponent(text);
  // Mobile intent vs web universal link
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isMobile ? `whatsapp://send?phone=${phoneE164}&text=${encoded}` : `https://wa.me/${phoneE164}?text=${encoded}`;
};

// Helpers
const normalizePhone = (raw: string) => raw.replace(/[\s\-\(\)]/g, '');
const isValidRDWhatsApp = (phone: string) => /^\+1(809|829|849)\d{7}$/.test(phone);

interface SendLogEntry { invoiceNumber: string; clientName?: string; phone: string; status: 'enviado' | 'abierto'; pdfUrl: string | null; timestamp?: string; }
const saveSendLog = (entry: SendLogEntry) => {
  try {
    const key = 'send-history';
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const log = { ...entry, timestamp: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify([log, ...current].slice(0, 200)));
  } catch {
    // ignore
  }
};