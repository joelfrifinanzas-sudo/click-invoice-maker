import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Layout } from '@/components/Layout';
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
    <Layout>
      <div className="min-h-screen bg-gradient-subtle">
        <div className="container mx-auto py-8 px-4">
          {!showPreview ? (
            <div className="animate-fade-in">
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
    </Layout>
  );
};

export default Index;