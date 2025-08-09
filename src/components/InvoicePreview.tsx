import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { InvoiceData, ServiceItem } from './InvoiceForm';
import { InvoiceActions } from './InvoiceActions';
import { getNextInvoiceNumber } from '@/utils/pdfGenerator';
import { getCompanyProfile } from '@/utils/companyProfile';
import { useIsMobile } from '@/hooks/use-mobile';
import { CreditCard, Landmark, CreditCardIcon, Wallet, Link as LinkIcon, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getPaymentMethods, getBankAccounts } from '@/utils/localPayments';
import { maskAccountNumber } from '@/utils/mask';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  const isMobile = useIsMobile();
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP'
    }).format(num);
  };


  const getLineSubtotal = (service: ServiceItem): number => {
    const qty = parseFloat(((service as any).quantity || '1'));
    const unit = parseFloat(((service as any).unitPrice || '0'));
    return (isNaN(qty) || isNaN(unit)) ? 0 : qty * unit;
  };

  // Métodos y cuentas desde configuración local
  const methods = useMemo(() => getPaymentMethods(), []);
  const accountsLs = useMemo(() => getBankAccounts(), []);
  const activeAccounts = useMemo(() => accountsLs.filter(a => a.activa), [accountsLs]);
  const preferredAccount = useMemo(() => activeAccounts.find(a => a.preferida) || activeAccounts[0] || null, [activeAccounts]);
  const [showTransfer, setShowTransfer] = useState(false);
  const [otherAccountsOpen, setOtherAccountsOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(preferredAccount?.id ?? null);
  const selectedAccount = useMemo(() => activeAccounts.find(a => a.id === selectedAccountId) || preferredAccount || null, [activeAccounts, preferredAccount, selectedAccountId]);
  const [otrosOpen, setOtrosOpen] = useState(false);
  const paypalUrl = useMemo(() => localStorage.getItem('payments:paypal_url') || 'https://www.paypal.com/', []);
  const { toast } = useToast();

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
          <div className="flex justify-between items-start mb-4 md:mb-8">
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
              
              {!isMobile && (
                <div className="bg-muted p-3 rounded mt-4 text-right">
                  <p className="text-sm text-muted-foreground">Saldo adeudado</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatCurrency(balanceDue)}
                  </p>
                </div>
              )}
              <div className="mt-2 text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${invoiceData.paymentStatus === 'pagado' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}`}>
                  {invoiceData.paymentStatus === 'pagado' ? 'Pagado' : 'A crédito'}
                </span>
              </div>
            </div>
          </div>

          {/* Invoice Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
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
            <div className="md:text-right">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de factura</span>
                  <span className="text-gray-800">
                    {format(invoiceData.date, "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Términos</span>
                  <span className="text-gray-800">Pagadera a la recepción</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de vencimiento</span>
                  <span className="text-gray-800">
                    {format(invoiceData.date, "dd MMM yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Services Table / Cards */}
          <div className="mb-4 md:mb-8">
            {isMobile ? (
              <div className="space-y-3">
                {invoiceData.services.map((service, index) => (
                  <div key={index} className="rounded-xl border border-border bg-card text-foreground p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-semibold">{index + 1}</span>
                        <p className="font-medium text-sm md:text-base">{service.concept}</p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">{formatCurrency(getLineSubtotal(service))}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs md:text-sm">
                      <div className="">
                        <span className="block text-muted-foreground">Cant.</span>
                        <span className="font-medium">{((service as any).quantity || '1')}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-muted-foreground">Precio</span>
                        <span className="font-medium">{formatCurrency((service as any).unitPrice || 0)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-muted-foreground">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(getLineSubtotal(service))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-4 md:mb-8">
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
          <div className="mb-4 md:mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas</h3>
            <p className="text-sm text-gray-600">{invoiceData.notas?.trim() ? invoiceData.notas.trim() : 'Gracias por su confianza.'}</p>
          </div>

          <div className="mt-4 md:mt-6 mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cobrar con</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {methods.visa && (
                <Button variant="outline" className="h-12 justify-start" onClick={() => { localStorage.setItem('checkout:selected_method', 'visa'); toast({ title: 'Pago con tarjeta', description: 'Continuar al flujo de tarjeta (demo local).' }); }}>
                  <CreditCardIcon className="mr-2 h-5 w-5" /> TC Visa
                </Button>
              )}
              {methods.mastercard && (
                <Button variant="outline" className="h-12 justify-start" onClick={() => { localStorage.setItem('checkout:selected_method', 'mastercard'); toast({ title: 'Pago con tarjeta', description: 'Continuar al flujo de tarjeta (demo local).' }); }}>
                  <CreditCard className="mr-2 h-5 w-5" /> TC Mastercard
                </Button>
              )}
              {methods.transferencia && (
                <Button className="h-12 justify-start" onClick={() => { localStorage.setItem('checkout:selected_method', 'transferencia'); const accId = (selectedAccount?.id) || (preferredAccount?.id) || null; if (accId) { localStorage.setItem('checkout:selected_account_id', accId); } else { localStorage.removeItem('checkout:selected_account_id'); } setShowTransfer(true); }}>
                  <Landmark className="mr-2 h-5 w-5" /> Transferencia
                </Button>
              )}
              {methods.paypal && (
                <Button variant="outline" className="h-12 justify-start" onClick={() => { localStorage.setItem('checkout:selected_method', 'paypal'); window.open(paypalUrl, '_blank', 'noopener,noreferrer'); }}>
                  <LinkIcon className="mr-2 h-5 w-5" /> PayPal
                </Button>
              )}
              {methods.otros && (
                <Button variant="outline" className="h-12 justify-start" onClick={() => { localStorage.setItem('checkout:selected_method', 'otros'); setOtrosOpen((v) => !v); }}>
                  <Wallet className="mr-2 h-5 w-5" /> Otros
                </Button>
              )}
            </div>

            {/* Detalle de transferencia */}
            {methods.transferencia && showTransfer && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                {selectedAccount ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{selectedAccount.banco_nombre}</p>
                        <p className="text-sm text-muted-foreground">{selectedAccount.alias} • <span className="capitalize">{selectedAccount.tipo}</span></p>
                      </div>
                      <div className="text-sm font-mono">{maskAccountNumber(selectedAccount.numero)}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(selectedAccount.numero);
                            toast({ title: 'Cuenta copiada' });
                          } catch {
                            toast({ title: 'No se pudo copiar', variant: 'destructive' });
                          }
                        }}
                      >
                        <Copy className="h-4 w-4 mr-1" /> Copiar cuenta
                      </Button>
                      {activeAccounts.length > 1 && (
                        <Button size="sm" variant="outline" onClick={() => setOtherAccountsOpen(true)}>Ver otras</Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tienes cuentas activas configuradas. Agrega una en Ajustes › Pagos.</p>
                )}
              </div>
            )}

            {/* Modal para seleccionar otras cuentas */}
            <Dialog open={otherAccountsOpen} onOpenChange={setOtherAccountsOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Selecciona una cuenta</DialogTitle>
                  <DialogDescription>Elige otra cuenta activa para mostrar</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {activeAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center justify-between gap-2 border rounded-md p-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{acc.banco_nombre}</p>
                        <p className="text-xs text-muted-foreground truncate">{acc.alias} • <span className="capitalize">{acc.tipo}</span> • {maskAccountNumber(acc.numero)}</p>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedAccountId(acc.id); localStorage.setItem('checkout:selected_account_id', acc.id); setOtherAccountsOpen(false); }}>Seleccionar</Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Otros (acordeón) */}
            {methods.otros && (
              <div className="mt-4">
                <Accordion type="single" collapsible value={otrosOpen ? 'otros' : undefined} onValueChange={(v) => setOtrosOpen(v === 'otros')}>
                  <AccordionItem value="otros">
                    <AccordionTrigger>Otros métodos</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Configura el texto desde Ajustes › Pagos. Por ahora: coordina con nuestro equipo para otras formas de pago.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
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