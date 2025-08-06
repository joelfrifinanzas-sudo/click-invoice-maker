import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Receipt, Upload, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { getCompanyProfile } from '@/utils/companyProfile';
import { NCFType, NCF_TYPES, ALLOWED_NCF_TYPES, determineNCFType, generateNCF } from '@/utils/ncfGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit2, RefreshCw } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';

export interface ServiceItem {
  concept: string;
  amount: string;
}

export interface InvoiceData {
  clientName: string;
  clientId: string;
  clientPhone: string;
  services: ServiceItem[];
  date: Date;
  logo: string | null;
  businessName: string;
  signatureName: string;
  ncfType: NCFType;
  ncf: string;
}

interface InvoiceFormProps {
  onGenerateInvoice: (data: InvoiceData) => void;
}

export const InvoiceForm = ({ onGenerateInvoice }: InvoiceFormProps) => {
  const [formData, setFormData] = useState<InvoiceData>({
    clientName: '',
    clientId: '',
    clientPhone: '+1 ',
    services: [{ concept: '', amount: '' }],
    date: new Date(),
    logo: null,
    businessName: '',
    signatureName: '',
    ncfType: 'B02',
    ncf: '',
  });

  const [isEditingNCF, setIsEditingNCF] = useState(false);

  // Cargar perfil de empresa al montar el componente
  useEffect(() => {
    const companyProfile = getCompanyProfile();
    setFormData(prev => ({
      ...prev,
      logo: companyProfile.logo,
      businessName: companyProfile.businessName,
      signatureName: companyProfile.signatureName,
    }));
  }, []);

  const [dragActive, setDragActive] = useState(false);

  // Generar NCF automáticamente cuando cambie el tipo o los datos del cliente
  useEffect(() => {
    if (formData.ncfType && formData.services.length > 0) {
      const totalAmount = formData.services.reduce((sum, service) => sum + parseFloat(service.amount || '0'), 0);
      const autoNCFType = determineNCFType(!!formData.clientId.trim(), totalAmount);
      const generatedNCF = generateNCF(formData.ncfType || autoNCFType);
      
      if (!isEditingNCF) {
        setFormData(prev => ({ ...prev, ncf: generatedNCF }));
      }
    }
  }, [formData.ncfType, formData.clientId, formData.services, isEditingNCF]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasValidServices = formData.services.length > 0 && 
      formData.services.every(service => service.concept.trim() && service.amount.trim());
    
    if (formData.clientName && hasValidServices && formData.businessName && formData.signatureName && formData.ncf) {
      // Guardar datos del negocio para futuros usos
      localStorage.setItem('business-name', formData.businessName);
      localStorage.setItem('signature-name', formData.signatureName);
      onGenerateInvoice(formData);
    }
  };

  const regenerateNCF = () => {
    const totalAmount = formData.services.reduce((sum, service) => sum + parseFloat(service.amount || '0'), 0);
    const autoNCFType = determineNCFType(!!formData.clientId.trim(), totalAmount);
    const generatedNCF = generateNCF(formData.ncfType || autoNCFType);
    setFormData(prev => ({ ...prev, ncf: generatedNCF }));
    setIsEditingNCF(false);
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { concept: '', amount: '' }]
    }));
  };

  const removeService = (index: number) => {
    if (formData.services.length > 1) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter((_, i) => i !== index)
      }));
    }
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
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
            <PhoneInput
              value={formData.clientPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, clientPhone: value }))}
              placeholder="809-123-4567"
            />
          </div>

          {/* NCF Section */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">Número de Comprobante Fiscal (NCF)</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ncfType">Tipo de NCF *</Label>
                <Select
                  value={formData.ncfType}
                  onValueChange={(value: NCFType) => {
                    setFormData(prev => ({ ...prev, ncfType: value }));
                    setIsEditingNCF(false);
                  }}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar tipo de NCF" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {ALLOWED_NCF_TYPES.map((key) => {
                      const config = NCF_TYPES[key];
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex flex-col">
                            <span className="font-medium">{config.description}</span>
                            <span className="text-xs text-muted-foreground">{config.type}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {NCF_TYPES[formData.ncfType]?.requiresClientId 
                    ? "⚠️ Requiere Cédula/RNC del cliente" 
                    : "✅ No requiere Cédula/RNC"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ncf">NCF Generado</Label>
                <div className="flex gap-2">
                  <Input
                    id="ncf"
                    value={formData.ncf}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, ncf: e.target.value }));
                      setIsEditingNCF(true);
                    }}
                    placeholder="NCF se generará automáticamente"
                    className="bg-background font-mono text-sm"
                    readOnly={!isEditingNCF}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingNCF(!isEditingNCF)}
                    className="px-3"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={regenerateNCF}
                    className="px-3"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isEditingNCF ? "Editando manualmente" : "Generado automáticamente"}
                </p>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Servicios o productos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar servicio
              </Button>
            </div>
            
            {formData.services.map((service, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Servicio {index + 1}
                  </span>
                  {formData.services.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`concept-${index}`}>Concepto o detalle *</Label>
                  <Textarea
                    id={`concept-${index}`}
                    value={service.concept}
                    onChange={(e) => updateService(index, 'concept', e.target.value)}
                    placeholder="Describe el servicio o producto..."
                    className="min-h-[80px]"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`amount-${index}`}>Monto *</Label>
                  <Input
                    id={`amount-${index}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={service.amount}
                    onChange={(e) => updateService(index, 'amount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
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
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity text-lg py-6"
            disabled={!formData.clientName || !formData.businessName || !formData.signatureName || !formData.services.every(s => s.concept.trim() && s.amount.trim()) || !formData.ncf}
          >
            <Receipt className="w-5 h-5 mr-2" />
            Generar Factura Profesional
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};