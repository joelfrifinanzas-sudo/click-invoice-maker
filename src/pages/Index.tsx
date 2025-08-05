import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Button } from '@/components/ui/button';
import { History, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { saveInvoiceToHistory } from '@/utils/invoiceHistory';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';

const Index = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateInvoice = (data: InvoiceData) => {
    const nextInvoiceNumber = getNextInvoiceNumber();
    setInvoiceData(data);
    setInvoiceNumber(nextInvoiceNumber);
    setShowPreview(true);
    
    // Guardar en historial
    saveInvoiceToHistory(data, nextInvoiceNumber);
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="container mx-auto py-8">
        {!showPreview ? (
          <div className="animate-fade-in">
            <div className="flex justify-end gap-2 mb-4">
              <Link to="/perfil-empresa">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Perfil Empresa
                </Button>
              </Link>
              <Link to="/history">
                <Button variant="outline" size="sm">
                  <History className="w-4 h-4 mr-2" />
                  Ver Historial
                </Button>
              </Link>
            </div>
            <InvoiceForm onGenerateInvoice={handleGenerateInvoice} />
          </div>
        ) : (
          invoiceData && (
            <div className="animate-slide-up">
              <InvoicePreview 
                invoiceData={invoiceData} 
                onBack={handleBackToForm}
                invoiceNumber={invoiceNumber}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Index;