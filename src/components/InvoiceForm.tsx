import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';

export interface InvoiceData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  concept: string;
  amount: string;
  date: Date;
  logo: string | null;
  businessName: string;
  signatureName: string;
}

interface InvoiceFormProps {
  onGenerateInvoice: (data: InvoiceData) => void;
}

export const InvoiceForm = ({ onGenerateInvoice }: InvoiceFormProps) => {
  const [formData, setFormData] = useState<InvoiceData>({
    clientName: '',
    clientId: '',
    clientPhone: '',
    concept: '',
    amount: '',
    date: new Date(),
    logo: localStorage.getItem('invoice-logo') || null,
    businessName: localStorage.getItem('business-name') || '',
    signatureName: localStorage.getItem('signature-name') || '',
  });

  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clientName && formData.concept && formData.amount && formData.businessName && formData.signatureName) {
      // Guardar datos del negocio para futuros usos
      localStorage.setItem('business-name', formData.businessName);
      localStorage.setItem('signature-name', formData.signatureName);
      onGenerateInvoice(formData);
    }
  };

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const logoData = e.target?.result as string;
      setFormData(prev => ({ ...prev, logo: logoData }));
      localStorage.setItem('invoice-logo', logoData);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logo: null }));
    localStorage.removeItem('invoice-logo');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-invoice">
      <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Receipt className="w-8 h-8" />
          Factura en 1 Click
        </CardTitle>
        <p className="text-primary-foreground/80">
          Genera facturas profesionales en segundos
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo de tu negocio (opcional)</Label>
            {formData.logo ? (
              <div className="relative w-32 h-32 mx-auto">
                <img
                  src={formData.logo}
                  alt="Logo"
                  className="w-full h-full object-contain border-2 border-border rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={removeLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                  dragActive ? "border-primary bg-invoice-blue-light" : "border-border hover:border-primary"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Arrastra un logo o haz clic para subir
                </p>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                />
              </div>
            )}
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre de tu negocio *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Ej: Mi Empresa S.R.L."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureName">Nombre para firma *</Label>
              <Input
                id="signatureName"
                value={formData.signatureName}
                onChange={(e) => setFormData(prev => ({ ...prev, signatureName: e.target.value }))}
                placeholder="Ej: Juan Rodríguez"
                required
              />
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nombre del cliente *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Cédula o RNC</Label>
              <Input
                id="clientId"
                value={formData.clientId}
                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                placeholder="Ej: 001-1234567-8"
              />
            </div>
          </div>

          {/* Client Contact */}
          <div className="space-y-2">
            <Label htmlFor="clientPhone">Teléfono del cliente (opcional)</Label>
            <Input
              id="clientPhone"
              type="tel"
              value={formData.clientPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="Ej: +1 809-123-4567 (para envío por WhatsApp)"
            />
          </div>

          {/* Service Details */}
          <div className="space-y-2">
            <Label htmlFor="concept">Concepto o detalle del servicio *</Label>
            <Textarea
              id="concept"
              value={formData.concept}
              onChange={(e) => setFormData(prev => ({ ...prev, concept: e.target.value }))}
              placeholder="Describe el servicio o producto facturado..."
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto total *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={!formData.clientName || !formData.concept || !formData.amount || !formData.businessName || !formData.signatureName}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Generar Factura
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};