import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { InvoicePreview } from '@/components/InvoicePreview';
import { saveInvoiceToHistory } from '@/utils/invoiceHistory';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { ArrowLeft, FileText, ClipboardList, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';

export default function CrearFactura() {
  useScrollToTop();
  
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
          {/* Back Button */}
          <div className="px-4 pt-4">
            <BackButton />
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
          
          {/* Floating Home Button */}
          <Button
            onClick={() => navigate('/inicio')}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-50"
            size="sm"
          >
            <Home className="w-6 h-6" />
          </Button>
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
            
            {/* Floating Home Button */}
            <Button
              onClick={() => navigate('/inicio')}
              className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 z-50"
              size="sm"
            >
              <Home className="w-6 h-6" />
            </Button>
          </div>
        )
      )}
    </>
  );
}