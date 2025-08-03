import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';

const Index = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerateInvoice = (data: InvoiceData) => {
    setInvoiceData(data);
    setShowPreview(true);
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="container mx-auto py-8">
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
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Index;