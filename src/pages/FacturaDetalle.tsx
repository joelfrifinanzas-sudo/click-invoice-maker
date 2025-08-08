import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInvoiceById } from '@/utils/invoiceHistory';
import { Button } from '@/components/ui/button';
import { History, Home } from 'lucide-react';

export default function FacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invoice = useMemo(() => {
    if (!id) return undefined;
    return getInvoiceById(id) || undefined;
  }, [id]);

  useEffect(() => {
    if (invoice) {
      document.title = `Detalle de Factura #${invoice.invoiceNumber}`;
    } else {
      document.title = 'Detalle de Factura';
    }
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="container mx-auto py-8 max-w-3xl">
          <Card className="shadow-invoice">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Factura no encontrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">No pudimos encontrar la factura solicitada. Verifica el enlace o regresa al historial.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/historial')}>Ir al historial</Button>
                <Button onClick={() => navigate('/inicio')}>Volver al inicio</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="container mx-auto py-8 max-w-5xl">
        <header className="mb-4 flex items-center justify-between">
          <BackButton />
          <h1 className="sr-only">Detalle de factura #{invoice.invoiceNumber}</h1>
          <div className="w-14" />
        </header>
        <InvoicePreview invoiceData={invoice} onBack={() => navigate(-1)} invoiceNumber={invoice.invoiceNumber} />
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
  );
}
