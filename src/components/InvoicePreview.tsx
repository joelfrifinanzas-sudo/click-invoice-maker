import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { InvoiceData, ServiceItem } from './InvoiceForm';
import { InvoiceActions } from './InvoiceActions';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { getCompanyProfile } from '@/utils/companyProfile';

interface InvoicePreviewProps {
  invoiceData: InvoiceData;
  onBack: () => void;
  invoiceNumber?: string;
}

export const InvoicePreview = ({ invoiceData, onBack, invoiceNumber }: InvoicePreviewProps) => {
  // Usar el número de factura pasado como prop o generar uno nuevo
  const currentInvoiceNumber = invoiceNumber || getNextInvoiceNumber();

  const company = getCompanyProfile();
  const companyName = (company.businessName || invoiceData.businessName || '').trim();
  const rnc = (company.businessRnc || '').trim();
  const address = (company.businessAddress || '').trim();
  const city = (company.businessCity || '').trim();
  const country = (company.businessCountry || 'República Dominicana').trim();
  const postal = (company.businessPostalCode || '').trim();
  const countryShort = country === 'República Dominicana' ? 'RD' : country;
  const cityLine = [city, countryShort].filter(Boolean).join(', ');
  const missingFields = [
    !company.businessName ? 'nombre del negocio' : null,
    !rnc ? 'RNC' : null,
    !address ? 'dirección' : null,
  ].filter(Boolean) as string[];

  const balanceDue = invoiceData.paymentStatus === 'pagado' ? 0 : invoiceData.total;

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Action Buttons */}
      <InvoiceActions
        invoiceData={invoiceData}
        invoiceNumber={currentInvoiceNumber}
        onBack={onBack}
      />
      {missingFields.length > 0 && (
        <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-900 text-sm">
          Faltan datos del perfil: {missingFields.join(', ')}. Completa tu perfil para que se incluyan automáticamente en la factura. <a href="/perfil-empresa" className="underline font-medium">Configurar perfil</a>
        </div>
      )}

      {/* Invoice - Siguiendo exactamente el diseño de Bootis */}
      <Card className="invoice-content bg-white shadow-soft border border-gray-200">
        <CardContent className="p-8">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-8">
            {/* Left Side - Logo and Company Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {invoiceData.logo && (
                  <img
                    src={invoiceData.logo}
                    alt="Logo"
                    className="w-20 h-20 object-contain"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">
                    {companyName}
                  </h2>
                </div>
              </div>
              
              {/* Company Details */}
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  {companyName}{rnc ? ` | RNC ${rnc}` : ''}
                </p>
                {address && <p>{address}</p>}
                {(cityLine || postal) && <p>{cityLine}{postal ? ` | ${postal}` : ''}</p>}
                {country && <p>{country}</p>}
              </div>
            </div>

            {/* Right Side - Invoice Title and Details */}
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">FACTURA</h1>
              <p className="text-sm text-gray-600 mb-1"># {currentInvoiceNumber}</p>
              
              <div className="bg-gray-100 p-3 rounded mt-4 text-right">
                <p className="text-sm text-gray-600">Saldo adeudado</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(balanceDue)}
                </p>
              </div>
              <div className="mt-2 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${invoiceData.paymentStatus === 'pagado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}`}>
                  {invoiceData.paymentStatus === 'pagado' ? 'Pagado' : 'A crédito'}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Left Column - Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Facturar a</h3>
              <div className="text-sm text-gray-800">
                <p className="font-semibold text-lg">{invoiceData.clientName}</p>
                {invoiceData.clientId && (
                  <p>RNC/Cédula: {invoiceData.clientId}</p>
                )}
                {invoiceData.clientPhone && (
                  <p>Tel: {invoiceData.clientPhone}</p>
                )}
              </div>
            </div>

            {/* Right Column - Invoice Details */}
            <div className="text-right">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de la factura :</span>
                  <span className="text-gray-800">
                    {format(invoiceData.date, "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Términos :</span>
                  <span className="text-gray-800">Pagadera a la recepción</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de vencimiento :</span>
                  <span className="text-gray-800">
                    {format(invoiceData.date, "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-8">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="text-left p-3 text-sm font-semibold w-12">#</th>
                  <th className="text-left p-3 text-sm font-semibold">Artículo & Descripción</th>
                  <th className="text-center p-3 text-sm font-semibold w-20">Cant.</th>
                  <th className="text-right p-3 text-sm font-semibold w-24">Precio unitario</th>
                  <th className="text-right p-3 text-sm font-semibold w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.services.map((service, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3 text-sm text-gray-700">{index + 1}</td>
                    <td className="p-3 text-sm text-gray-800 font-medium">{service.concept}</td>
                    <td className="p-3 text-sm text-gray-700 text-center">{((service as any).quantity || '1')}</td>
                    <td className="p-3 text-sm text-gray-700 text-right">{formatCurrency((service as any).unitPrice || 0)}</td>
                    <td className="p-3 text-sm text-gray-800 text-right font-semibold">{formatCurrency(getLineSubtotal(service))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-800">{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              {invoiceData.itbisAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ITBIS (18%)</span>
                  <span className="text-gray-800">{formatCurrency(invoiceData.itbisAmount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-gray-800">{formatCurrency(invoiceData.total)}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-800">Saldo adeudado</span>
                  <span className="text-gray-800">{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas</h3>
            <p className="text-sm text-gray-600">Gracias por su confianza.</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">Opciones de pago</span>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded font-semibold tracking-wide">VISA</span>
              <span className="px-3 py-1 bg-warning text-warning-foreground text-xs rounded font-semibold">Mastercard</span>
              <span className="px-3 py-1 bg-muted text-foreground/80 text-xs rounded font-medium">Depósito / Transferencia</span>
            </div>
          </div>

          {/* NCF Information if applicable */}
          {invoiceData.ncf && !invoiceData.ncf.startsWith('FAC-') && (
            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-800">
                <strong>NCF:</strong> {invoiceData.ncf}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Comprobante Fiscal válido para fines tributarios - DGII
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-content, .invoice-content * {
            visibility: visible;
          }
          .invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};