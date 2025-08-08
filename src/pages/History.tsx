import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Download, Eye, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceHistory, deleteInvoiceFromHistory, type HistoryInvoice } from '@/utils/invoiceHistory';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { InvoicePreview } from '@/components/InvoicePreview';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HistoryPage = () => {
  useScrollToTop();
  const navigate = useNavigate();
  
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

  const handleCreateNewInvoice = () => {
    navigate('/crear-factura');
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
    <div className="min-h-screen bg-gradient-subtle p-4 relative">
      <div className="container mx-auto py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-invoice">
          <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-white/20"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex-1 text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-2xl mb-2">
                  <History className="w-8 h-8" />
                  Historial de Facturas
                </CardTitle>
                <p className="text-primary-foreground/80">
                  Revisa y descarga tus facturas anteriores
                </p>
              </div>
              <div className="w-20" />
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {invoices.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No hay facturas en el historial</h3>
                <p className="text-muted-foreground mb-4">
                  Las facturas generadas aparecerán aquí
                </p>
                <Button onClick={handleCreateNewInvoice}>
                  Crear primera factura
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="overflow-hidden border shadow-sm">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header with invoice number and date */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                            #{invoice.invoiceNumber}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(invoice.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                          </span>
                        </div>

                        {/* Client information */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-foreground">{invoice.clientName}</h3>
                          {invoice.clientId && (
                            <p className="text-sm text-muted-foreground">RNC/Cédula: {invoice.clientId}</p>
                          )}
                        </div>

                        {/* Service description */}
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.services.length === 1 
                              ? invoice.services[0].concept 
                              : `${invoice.services.length} servicios incluidos`}
                          </p>
                        </div>

                        {/* Total amount */}
                        <div className="pt-2">
                          <p className="text-2xl font-bold text-primary">
                            {formatCurrency(invoice.total.toString())}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInvoice(invoice)}
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(invoice)}
                            className="flex-1"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {/* Floating Action Button */}
      <Button
        onClick={handleCreateNewInvoice}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
        size="icon"
      >
        <Plus className="w-6 h-6 text-primary-foreground" />
      </Button>
    </div>
  );
};

export default HistoryPage;