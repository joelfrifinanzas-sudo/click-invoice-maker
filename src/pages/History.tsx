import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Download, Eye, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getInvoiceHistory, deleteInvoiceFromHistory, type HistoryInvoice } from '@/utils/invoiceHistory';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { InvoicePreview } from '@/components/InvoicePreview';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HistoryPage = () => {
  useScrollToTop();
  
  const [invoices, setInvoices] = useState<HistoryInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<HistoryInvoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setInvoices(getInvoiceHistory());
  }, []);

  const handleViewInvoice = (invoice: HistoryInvoice) => {
    setSelectedInvoice(invoice);
    setShowPreview(true);
  };

  const handleDownloadPDF = async (invoice: HistoryInvoice) => {
    await generateInvoicePDF(invoice, invoice.invoiceNumber);
  };

  const handleDeleteInvoice = (id: string) => {
    deleteInvoiceFromHistory(id);
    setInvoices(getInvoiceHistory());
  };

  const handleBackToHistory = () => {
    setShowPreview(false);
    setSelectedInvoice(null);
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(parseFloat(amount));
  };

  if (showPreview && selectedInvoice) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <div className="container mx-auto py-8">
          <InvoicePreview 
            invoiceData={selectedInvoice} 
            onBack={handleBackToHistory}
            invoiceNumber={selectedInvoice.invoiceNumber}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-invoice">
          <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <History className="w-8 h-8" />
                Historial de Facturas
              </CardTitle>
              <div className="w-20" />
            </div>
            <p className="text-primary-foreground/80">
              Revisa y descarga tus facturas anteriores
            </p>
          </CardHeader>
          
          <CardContent className="p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No hay facturas en el historial</h3>
                <p className="text-muted-foreground mb-4">
                  Las facturas generadas aparecerán aquí
                </p>
                <Link to="/">
                  <Button>
                    Crear primera factura
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="secondary" className="font-mono">
                              #{invoice.invoiceNumber}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(invoice.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>
                          <h3 className="font-medium text-lg">{invoice.clientName}</h3>
                          {invoice.clientId && (
                            <p className="text-sm text-muted-foreground">{invoice.clientId}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {invoice.services.length === 1 
                              ? invoice.services[0].concept 
                              : `${invoice.services.length} servicios`}
                          </p>
                          <p className="text-lg font-semibold text-primary mt-2">
                            {formatCurrency(invoice.services.reduce((sum, service) => sum + parseFloat(service.amount || '0'), 0).toString())}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HistoryPage;