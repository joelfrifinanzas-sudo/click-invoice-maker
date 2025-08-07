import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';
import { saveInvoiceToHistory } from '@/utils/invoiceHistory';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { ArrowLeft, FileText, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CrearFactura() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'factura' | 'cotizacion'>('factura');
  const navigate = useNavigate();

  const handleGenerateInvoice = (data: InvoiceData) => {
    const nextInvoiceNumber = getNextInvoiceNumber();
    setInvoiceData(data);
    setInvoiceNumber(nextInvoiceNumber);
    setShowPreview(true);
    
    // Guardar en historial
    saveInvoiceToHistory(data, nextInvoiceNumber);
  };

  return (
    <>
      {!showPreview ? (
        <div className="min-h-screen bg-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-40">
            {/* Back button and title */}
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nueva Factura</h1>
                <p className="text-sm text-gray-500">Sistema de facturación electrónica para República Dominicana</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('factura')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'factura'
                    ? 'bg-[#007bff] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Factura
              </button>
              <button
                onClick={() => setActiveTab('cotizacion')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'cotizacion'
                    ? 'bg-[#007bff] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                Cotización
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="px-4 py-6">
            {activeTab === 'factura' ? (
              <InvoiceForm onGenerateInvoice={handleGenerateInvoice} />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <ClipboardList className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                  Módulo de Cotización
                </h3>
                <p className="text-yellow-700">
                  Esta funcionalidad estará disponible próximamente. 
                  Por ahora puedes crear facturas directamente.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        invoiceData && (
          <div className="min-h-screen bg-white">
            <div className="px-4 py-6">
              <InvoicePreview 
                invoiceData={invoiceData} 
                onBack={() => setShowPreview(false)}
                invoiceNumber={invoiceNumber}
              />
            </div>
          </div>
        )
      )}
    </>
  );
}