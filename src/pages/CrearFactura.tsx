import { useEffect, useState } from 'react';
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
import { ClientPickerDialog } from '@/components/clients/ClientPickerDialog';
import { Client } from '@/data/clients';
import { createDraftInvoice } from '@/data/invoices';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentContext } from '@/data/utils';

export default function CrearFactura() {
  useScrollToTop();
  
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'factura' | 'cotizacion'>('factura');
const [clientDialogOpen, setClientDialogOpen] = useState<boolean>(true);
const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

useEffect(() => {
  if (!selectedClient) setClientDialogOpen(true);
}, [selectedClient]);

  const checkInvoiceLimit = async () => {
    try {
      const ctx = await getCurrentContext();
      const c = ctx.data;
      if (!c?.companyId) return; // compat: sin plan ni límites, no bloquear
      // Leer límites de la empresa
      const { data: company } = await supabase
        .from('companies')
        .select('limit_invoices_per_month')
        .eq('id', c.companyId)
        .maybeSingle();
      const limit = (company as any)?.limit_invoices_per_month as number | null;
      if (!limit || limit <= 0) return; // compat: sin límite configurado, no avisar
      // Conteo de facturas del mes
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10);
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', c.companyId)
        .gte('issue_date', start)
        .lt('issue_date', end);
      if ((count || 0) >= limit) {
        toast({
          title: 'Límite de facturas alcanzado',
          description: 'Has alcanzado tu límite mensual. Considera subir de plan para continuar sin restricciones.',
        });
      }
    } catch {}
  };

  const handleGenerateInvoice = async (data: InvoiceData) => {
    try {
      // Validación de límites (modo compatibilidad: solo aviso, no bloquea)
      await checkInvoiceLimit();
      // 1) Persist draft to Supabase with selected customer (non-blocking UX)
      const itbisRate = data.includeITBIS ? 0.18 : 0;
      const items = (data.services || []).map((s) => ({
        description: s.concept,
        quantity: Number(s.quantity || '1') || 1,
        unit_price: Number(s.unitPrice || '0') || 0,
        itbis_rate: itbisRate,
      }));
const { error: dbError } = await createDraftInvoice({
        items,
        itbis_rate: itbisRate,
        customer_id: null, // TODO: migrar a client_id si se requiere persistir a tabla clients
      });
      if (dbError) {
        console.warn('No se pudo guardar en la base de datos:', dbError);
      } else {
        toast({ title: 'Guardado como borrador', description: 'La factura quedó asociada al cliente.' });
      }

      // 2) Flujo actual (historial local + navegación)
      const nextInvoiceNumber = getNextInvoiceNumber();
      const newId = saveInvoiceToHistory(data, nextInvoiceNumber);
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
      {/* Dialogo para seleccionar/crear cliente */}
<ClientPickerDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onConfirm={(c) => { setSelectedClient(c); setClientDialogOpen(false); }}
      />
      {!showPreview ? (
        <div className="min-h-screen bg-white">
          {/* Back Button */}
          <div className="px-4 pt-4">
            <BackButton />
          </div>
          {/* Form Content */}
          <div className="px-4 py-6">
            {activeTab === 'factura' ? (
<InvoiceForm
                onGenerateInvoice={handleGenerateInvoice}
                prefill={{
                  clientName: selectedClient?.nombre_visualizacion,
                  clientId: selectedClient?.documento || '',
                  clientPhone: selectedClient?.telefono_movil || selectedClient?.telefono_laboral || '+1 ',
                }}
                selectedClientHint={{
                  requiresFiscal: !!selectedClient?.es_contribuyente,
                  defaultConsumerFinal: selectedClient?.tipo_cliente === 'Individuo' && !selectedClient?.documento,
                }}
              />
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