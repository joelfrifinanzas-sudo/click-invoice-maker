import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Layout } from '@/components/Layout';
import { saveInvoiceToHistory } from '@/utils/invoiceHistory';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { FileText } from 'lucide-react';

const Index = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
      {!showForm && !showPreview ? (
        <div className="min-h-screen bg-gradient-hero flex flex-col">
          {/* Hero Section */}
          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              {/* Main Icon and Title */}
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
                    <FileText className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                    Factura 1Click
                  </h1>
                  <p className="text-xl md:text-2xl text-blue-100 font-medium">
                    Sistema de facturación electrónica
                  </p>
                  <p className="text-lg md:text-xl text-blue-200">
                    República Dominicana
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="animate-slide-up">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Nueva Factura
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : showForm && !showPreview ? (
        <div className="min-h-screen bg-gradient-subtle">
          <div className="container mx-auto py-8 px-4">
            <div className="animate-fade-in">
              <InvoiceForm onGenerateInvoice={handleGenerateInvoice} />
            </div>
          </div>
        </div>
      ) : (
        invoiceData && (
          <div className="animate-slide-up">
            <InvoicePreview 
              invoiceData={invoiceData} 
              onBack={() => {
                setShowPreview(false);
                setShowForm(false);
              }}
              invoiceNumber={invoiceNumber}
            />
          </div>
        )
      )}
    </Layout>
  );
};

export default Index;