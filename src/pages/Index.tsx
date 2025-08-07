import { useState } from 'react';
import { InvoiceForm, InvoiceData } from '@/components/InvoiceForm';
import { InvoicePreview } from '@/components/InvoicePreview';
import { Layout } from '@/components/Layout';
import { saveInvoiceToHistory } from '@/utils/invoiceHistory';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { FileText, Plus } from 'lucide-react';


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
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent"></div>
          </div>
          
          {/* Hero Section */}
          <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
            <div className="text-center space-y-8 sm:space-y-10 max-w-4xl mx-auto">
              {/* Logo */}
              <div className="animate-fade-in">
                <div className="flex justify-center mb-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
                    <div className="flex items-center justify-center">
                      <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white">
                        FACTURA
                        <span className="block text-4xl sm:text-5xl md:text-6xl text-blue-300">1CLICK</span>
                      </h1>
                      <div className="ml-4 text-6xl sm:text-7xl md:text-8xl font-black text-blue-400">1</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-lg sm:text-xl md:text-2xl text-blue-100 font-medium">
                    Sistema de facturación electrónica
                  </p>
                  <p className="text-base sm:text-lg md:text-xl text-blue-200/80">
                    República Dominicana
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 animate-slide-up">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-blue-100 text-sm font-semibold">NCF Automático</div>
                  <div className="text-blue-200/80 text-xs mt-1">Numeración fiscal</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-blue-100 text-sm font-semibold">DGII Compatible</div>
                  <div className="text-blue-200/80 text-xs mt-1">Formato oficial</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-blue-100 text-sm font-semibold">Exportar PDF</div>
                  <div className="text-blue-200/80 text-xs mt-1">Listo para imprimir</div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="animate-slide-up pt-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-3 bg-white hover:bg-blue-50 text-blue-700 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105 border border-white/20"
                >
                  <Plus className="w-6 h-6" />
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