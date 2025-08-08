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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

export default function CrearFactura() {
  useScrollToTop();
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'factura' | 'cotizacion'>('factura');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerateInvoice = async (data: InvoiceData) => {
    try {
      const nextInvoiceNumber = getNextInvoiceNumber();
      // Guardar en historial y obtener ID
      const newId = saveInvoiceToHistory(data, nextInvoiceNumber);
      // Navegar al detalle
      navigate(`/facturas/${newId}`);
    } catch (error) {
      console.error('Error al guardar/navegar a detalle:', error);
      toast({
        title: 'Error al generar',
        description: 'No se pudo finalizar la generación. Permanece en esta pantalla e intenta nuevamente.',
        variant: 'destructive',
      });
      try { localStorage.setItem('lastError', JSON.stringify({ event: 'crear_factura_navigate_error', route: location.pathname, timestamp: new Date().toISOString() })); } catch {}
    }
  };

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}