import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Printer, Mail } from 'lucide-react';
import { InvoiceData } from './InvoiceForm';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { shareInvoiceViaWhatsApp } from '@/utils/whatsappUtils';
import { generateEmailLink } from '@/utils/shareUtils';
import { useState } from 'react';

interface InvoiceActionsProps {
  invoiceData: InvoiceData;
  invoiceNumber: string;
  onBack: () => void;
}

export const InvoiceActions = ({ invoiceData, invoiceNumber, onBack }: InvoiceActionsProps) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const handleWhatsAppShare = async () => {
    try {
      await shareInvoiceViaWhatsApp(invoiceData, invoiceNumber);
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
    }
  };

  const handleEmailShare = () => {
    const emailLink = generateEmailLink(invoiceData, invoiceNumber);
    window.location.href = emailLink;
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 print:hidden">
      {/* Layout exacto de la imagen de referencia */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Primera fila: Volver + WhatsApp (ocupa 2 columnas) + Imprimir */}
        <div className="lg:col-span-1">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex flex-col items-center justify-center gap-2 w-full h-20 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-2xl text-gray-700 p-4 shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="text-sm font-medium">Volver</span>
          </Button>
        </div>

        <div className="lg:col-span-3">
          <Button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-3 w-full h-20 bg-green-100 hover:bg-green-200 border border-green-300 rounded-2xl text-green-700 p-4 shadow-sm"
          >
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
            </svg>
            <span className="text-lg font-semibold">Enviar por WhatsApp</span>
          </Button>
        </div>

        <div className="lg:col-span-1">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-2 w-full h-20 bg-white hover:bg-gray-50 border border-gray-300 rounded-2xl text-gray-700 p-4 shadow-sm"
          >
            <Printer className="w-6 h-6" />
            <span className="text-sm font-medium">Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Segunda fila: Descargar PDF + Enviar por Correo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className="flex items-center justify-center gap-3 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold shadow-sm disabled:opacity-70"
        >
          <Download className="w-5 h-5" />
          <span className="text-lg">{isGeneratingPDF ? 'Generando PDF...' : 'Descargar PDF'}</span>
        </Button>

        <Button
          variant="outline"
          onClick={handleEmailShare}
          className="flex items-center justify-center gap-3 h-16 bg-white hover:bg-blue-50 border border-blue-300 text-blue-700 rounded-2xl font-semibold shadow-sm"
        >
          <Mail className="w-5 h-5" />
          <span className="text-lg">Enviar por Correo</span>
        </Button>
      </div>
    </div>
  );
};