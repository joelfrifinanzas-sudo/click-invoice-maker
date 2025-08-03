import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Download, Printer, ArrowLeft, MessageCircle, Mail } from 'lucide-react';
import { InvoiceData } from './InvoiceForm';
import { generateInvoicePDF, getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { generateWhatsAppLink, generateEmailLink } from '@/utils/shareUtils';
import { useState, useEffect } from 'react';

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
  onBack: () => void;
}

export const InvoicePreview = ({ invoiceData, onBack }: InvoicePreviewProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    // Generar número de factura al cargar el componente
    const number = getNextInvoiceNumber();
    setInvoiceNumber(number);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoiceData, invoiceNumber);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappLink = generateWhatsAppLink(invoiceData, invoiceNumber);
    window.open(whatsappLink, '_blank');
  };

  const handleEmailShare = () => {
    const emailLink = generateEmailLink(invoiceData, invoiceNumber);
    window.location.href = emailLink;
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Action Buttons */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al formulario
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
          <Button variant="outline" onClick={handleWhatsAppShare} className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar por WhatsApp
          </Button>
          <Button variant="outline" onClick={handleEmailShare} className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
            <Mail className="w-4 h-4 mr-2" />
            Enviar por Correo
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <Card className="invoice-content bg-white shadow-soft">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              {invoiceData.logo && (
                <img
                  src={invoiceData.logo}
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-invoice-blue">FACTURA</h1>
                <p className="text-invoice-gray">#{invoiceNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-invoice-gray mb-1">{invoiceData.businessName}</p>
              <p className="text-sm text-invoice-gray">Fecha de emisión:</p>
              <p className="font-semibold">
                {format(invoiceData.date, "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
            </div>
          </div>

          {/* Client Information */}
          <div className="mb-8 p-4 bg-invoice-blue-light rounded-lg">
            <h3 className="font-semibold text-invoice-blue mb-2">FACTURAR A:</h3>
            <p className="font-medium text-lg">{invoiceData.clientName}</p>
            {invoiceData.clientId && (
              <p className="text-invoice-gray">Cédula/RNC: {invoiceData.clientId}</p>
            )}
            {invoiceData.clientPhone && (
              <p className="text-invoice-gray">Teléfono: {invoiceData.clientPhone}</p>
            )}
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className="font-semibold text-invoice-blue mb-4">DETALLES DEL SERVICIO</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-invoice-blue-light p-4 font-semibold text-invoice-blue grid grid-cols-3 gap-4">
                <span>Descripción</span>
                <span className="text-center">Cantidad</span>
                <span className="text-right">Monto</span>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4 items-start">
                <span className="text-sm leading-relaxed">{invoiceData.concept}</span>
                <span className="text-center">1</span>
                <span className="text-right font-semibold">{formatCurrency(invoiceData.amount)}</span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Total */}
          <div className="flex justify-end">
            <div className="text-right space-y-2">
              <div className="flex justify-between items-center min-w-[250px]">
                <span className="text-invoice-gray">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoiceData.amount)}</span>
              </div>
              <div className="flex justify-between items-center min-w-[250px]">
                <span className="text-invoice-gray">ITBIS (18%):</span>
                <span className="font-medium">
                  {formatCurrency((parseFloat(invoiceData.amount) * 0.18).toString())}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center min-w-[250px] text-lg">
                <span className="font-bold text-invoice-blue">TOTAL:</span>
                <span className="font-bold text-invoice-blue text-xl">
                  {formatCurrency((parseFloat(invoiceData.amount) * 1.18).toString())}
                </span>
              </div>
            </div>
          </div>

          {/* Firma */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex justify-between items-start">
              <div className="text-center">
                <div className="w-48 border-b border-border mb-2"></div>
                <p className="text-sm font-medium">{invoiceData.signatureName}</p>
                <p className="text-xs text-invoice-gray">Firma autorizada</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-invoice-gray">
            <p>Gracias por su preferencia</p>
            <p className="mt-2">Esta factura fue generada con <span className="text-invoice-blue font-medium">Factura en 1 Click</span></p>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};