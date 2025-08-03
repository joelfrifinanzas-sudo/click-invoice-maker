import { InvoiceData } from '@/components/InvoiceForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const generateWhatsAppLink = (invoiceData: InvoiceData, invoiceNumber: string): string => {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };

  const subtotal = parseFloat(invoiceData.amount);
  const itbis = subtotal * 0.18;
  const total = subtotal + itbis;

  const message = `🧾 *FACTURA #${invoiceNumber}*

📅 *Fecha:* ${format(invoiceData.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}

👤 *Cliente:* ${invoiceData.clientName}
${invoiceData.clientId ? `📋 *Cédula/RNC:* ${invoiceData.clientId}` : ''}

📝 *Concepto:*
${invoiceData.concept}

💰 *Detalle de pago:*
• Subtotal: ${formatCurrency(subtotal.toString())}
• ITBIS (18%): ${formatCurrency(itbis.toString())}
• *Total: ${formatCurrency(total.toString())}*

✅ Factura generada por *${invoiceData.businessName}*

_Generado con Factura en 1 Click_`;

  const encodedMessage = encodeURIComponent(message);
  
  // Si hay teléfono, enviar directamente al contacto
  if (invoiceData.clientPhone) {
    // Limpiar el número de teléfono (remover espacios, guiones, etc.)
    const cleanPhone = invoiceData.clientPhone.replace(/[\s\-\(\)]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }
  
  // Si no hay teléfono, abrir WhatsApp Web para seleccionar contacto
  return `https://wa.me/?text=${encodedMessage}`;
};

export const generateEmailLink = (invoiceData: InvoiceData, invoiceNumber: string): string => {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };

  const subtotal = parseFloat(invoiceData.amount);
  const itbis = subtotal * 0.18;
  const total = subtotal + itbis;

  const subject = `Factura #${invoiceNumber} - ${invoiceData.businessName}`;
  
  const body = `Estimado/a ${invoiceData.clientName},

Adjunto encontrará la factura #${invoiceNumber} correspondiente a los servicios prestados.

DETALLES DE LA FACTURA:
- Fecha: ${format(invoiceData.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}
- Cliente: ${invoiceData.clientName}
${invoiceData.clientId ? `- Cédula/RNC: ${invoiceData.clientId}` : ''}

Concepto:
${invoiceData.concept}

RESUMEN:
- Subtotal: ${formatCurrency(subtotal.toString())}
- ITBIS (18%): ${formatCurrency(itbis.toString())}
- TOTAL: ${formatCurrency(total.toString())}

Gracias por su preferencia.

Atentamente,
${invoiceData.signatureName}
${invoiceData.businessName}

---
Esta factura fue generada con Factura en 1 Click`;

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
};