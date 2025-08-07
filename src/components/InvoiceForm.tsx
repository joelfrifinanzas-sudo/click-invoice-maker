import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarIcon, 
  Receipt, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw,
  Copy,
  Save,
  Send,
  Mail,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { es } from 'date-fns/locale';
import { getCompanyProfile } from '@/utils/companyProfile';
import { NCFType, NCF_TYPES, ALLOWED_NCF_TYPES, determineNCFType, generateNCF } from '@/utils/ncfGenerator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { validateClientId, autoFormatClientId, ValidationResult } from '@/utils/validationUtils';
import { useToast } from '@/hooks/use-toast';

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
  const [clientIdValidation, setClientIdValidation] = useState<ValidationResult>({ isValid: true, message: '' });
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

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

  // Validar cédula/RNC cuando cambie
  useEffect(() => {
    if (formData.clientId.trim()) {
      const validation = validateClientId(formData.clientId);
      setClientIdValidation(validation);
    } else {
      setClientIdValidation({ isValid: true, message: '' });
    }
  }, [formData.clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    const hasValidServices = formData.services.length > 0 && 
      formData.services.every(service => service.concept.trim() && service.amount.trim());
    
    if (!formData.clientName.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre del cliente es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!hasValidServices) {
      toast({
        title: "Error de validación", 
        description: "Debe agregar al menos un servicio con concepto y monto",
        variant: "destructive",
      });
      return;
    }

    if (formData.clientId.trim() && !clientIdValidation.isValid) {
      toast({
        title: "Error de validación",
        description: clientIdValidation.message,
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.businessName.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre del negocio es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.signatureName.trim()) {
      toast({
        title: "Error de validación",
        description: "El nombre para la firma es obligatorio",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.ncf.trim()) {
      toast({
        title: "Error de validación",
        description: "Debe generar un NCF válido",
        variant: "destructive",
      });
      return;
    }
    
    // Guardar datos del negocio para futuros usos
    localStorage.setItem('business-name', formData.businessName);
    localStorage.setItem('signature-name', formData.signatureName);
    
    // Generar factura
    onGenerateInvoice(formData);
    
    toast({
      title: "¡Factura generada!",
      description: "Su factura ha sido creada exitosamente",
    });
  };

  const duplicateInvoice = () => {
    const newNCF = generateNCF(formData.ncfType);
    setFormData(prev => ({ ...prev, ncf: newNCF, date: new Date() }));
    setIsEditingNCF(false);
    
    toast({
      title: "Factura duplicada",
      description: "Se creó una copia con nuevo NCF y fecha actual",
    });
  };

  const saveAsDraft = () => {
    const drafts = JSON.parse(localStorage.getItem('invoice-drafts') || '[]');
    const draftId = `draft-${Date.now()}`;
    const draft = { ...formData, id: draftId, savedAt: new Date().toISOString() };
    
    drafts.unshift(draft);
    localStorage.setItem('invoice-drafts', JSON.stringify(drafts.slice(0, 10))); // Mantener solo 10 borradores
    
    toast({
      title: "Borrador guardado",
      description: "La factura se guardó como borrador",
    });
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

  const handleClientIdChange = (value: string) => {
    const formatted = autoFormatClientId(value);
    setFormData(prev => ({ ...prev, clientId: formatted }));
  };

  const calculateTotal = () => {
    return formData.services.reduce((sum, service) => sum + parseFloat(service.amount || '0'), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
    }).format(amount);
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

  const total = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="w-full max-w-4xl mx-auto shadow-card border-0">
        <CardHeader className="text-center bg-gradient-primary text-white rounded-t-xl pb-8">
          <CardTitle className="flex items-center justify-center gap-3 text-3xl font-bold">
            <Receipt className="w-10 h-10" />
            Nueva Factura
          </CardTitle>
          <p className="text-white/90 text-lg">
            Sistema de facturación electrónica para República Dominicana
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              <CheckCircle className="w-3 h-3 mr-1" />
              NCF Automático DGII
            </Badge>
          </div>
        </CardHeader>
      
        <CardContent className="p-8">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Button
              type="button"
              variant="outline"
              onClick={duplicateInvoice}
              className="flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicar Factura
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={saveAsDraft}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Borrador
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information Card */}
            <Card className="shadow-soft border border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Información del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Logo de tu negocio (opcional)</Label>
                  {formData.logo ? (
                    <div className="relative w-24 h-24 mx-auto">
                      <img
                        src={formData.logo}
                        alt="Logo"
                        className="w-full h-full object-contain border border-border rounded-lg"
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
                        "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
                        dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary"
                      )}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Subir logo (JPG, PNG)
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

                {/* Business Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">Nombre de tu negocio *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Ej: Mi Empresa S.R.L."
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signatureName" className="text-sm font-medium">Nombre para firma *</Label>
                    <Input
                      id="signatureName"
                      value={formData.signatureName}
                      onChange={(e) => setFormData(prev => ({ ...prev, signatureName: e.target.value }))}
                      placeholder="Ej: Juan Rodríguez"
                      className="h-11"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information Card */}
            <Card className="shadow-soft border border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-sm font-medium">Nombre del cliente *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Ej: Juan Pérez Martínez"
                      className="h-11"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientId" className="text-sm font-medium">Cédula o RNC del cliente</Label>
                    <Input
                      id="clientId"
                      value={formData.clientId}
                      onChange={(e) => handleClientIdChange(e.target.value)}
                      placeholder="001-1234567-8 o 123456789"
                      className={cn(
                        "h-11",
                        formData.clientId.trim() && !clientIdValidation.isValid && "border-destructive"
                      )}
                    />
                    {formData.clientId.trim() && (
                      <div className={cn(
                        "flex items-center gap-2 text-sm",
                        clientIdValidation.isValid ? "text-success" : "text-destructive"
                      )}>
                        {clientIdValidation.isValid ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>{clientIdValidation.message}</span>
                        {clientIdValidation.type && (
                          <Badge variant="outline" className="text-xs">
                            {clientIdValidation.type === 'cedula' ? 'Cédula' : 'RNC'}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-sm font-medium">Teléfono del cliente (opcional)</Label>
                  <PhoneInput
                    value={formData.clientPhone}
                    onChange={(value) => setFormData(prev => ({ ...prev, clientPhone: value }))}
                    placeholder="809-123-4567"
                    className="h-11"
                  />
                </div>
              </CardContent>
            </Card>

            {/* NCF Section Card */}
            <Card className="shadow-soft border border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  Número de Comprobante Fiscal (NCF)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generación automática según normativas DGII
                </p>
              </CardHeader>
              <CardContent>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="ncfType" className="text-sm font-medium">Tipo de NCF *</Label>
                    <Select
                      value={formData.ncfType}
                      onValueChange={(value: NCFType) => {
                        setFormData(prev => ({ ...prev, ncfType: value }));
                        setIsEditingNCF(false);
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar tipo de NCF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALLOWED_NCF_TYPES.map((key) => {
                          const config = NCF_TYPES[key];
                          return (
                            <SelectItem key={key} value={key} className="py-3">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{config.description}</span>
                                <span className="text-xs text-muted-foreground">{config.type}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <div className={cn(
                      "flex items-center gap-2 text-xs px-3 py-2 rounded-md",
                      NCF_TYPES[formData.ncfType]?.requiresClientId 
                        ? "bg-warning/10 text-warning-foreground border border-warning/20" 
                        : "bg-success/10 text-success border border-success/20"
                    )}>
                      {NCF_TYPES[formData.ncfType]?.requiresClientId ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Requiere Cédula/RNC del cliente</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>No requiere Cédula/RNC</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="ncf" className="text-sm font-medium">NCF Generado</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ncf"
                        value={formData.ncf}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, ncf: e.target.value }));
                          setIsEditingNCF(true);
                        }}
                        placeholder="NCF se generará automáticamente"
                        className="bg-background font-mono text-sm h-11"
                        readOnly={!isEditingNCF}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingNCF(!isEditingNCF)}
                        className="px-3 h-11"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={regenerateNCF}
                        className="px-3 h-11"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isEditingNCF ? "Editando manualmente" : "Generado automáticamente según DGII"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services Card */}
            <Card className="shadow-soft border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Servicios o Productos
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addService}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
            
                {formData.services.map((service, index) => (
                  <div key={index} className="p-6 border border-border rounded-xl space-y-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        Item #{index + 1}
                      </span>
                      {formData.services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`concept-${index}`} className="text-sm font-medium">Concepto o detalle *</Label>
                      <Textarea
                        id={`concept-${index}`}
                        value={service.concept}
                        onChange={(e) => updateService(index, 'concept', e.target.value)}
                        placeholder="Describe el servicio o producto..."
                        className="min-h-[80px] resize-none"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`amount-${index}`} className="text-sm font-medium">Monto (DOP) *</Label>
                      <Input
                        id={`amount-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={service.amount}
                        onChange={(e) => updateService(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="h-11 font-mono"
                        required
                      />
                    </div>
                  </div>
                ))}

                {/* Total Display */}
                {total > 0 && (
                  <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-foreground">Total a Pagar:</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Impuestos incluidos según normativas dominicanas
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Date Selection Card */}
            <Card className="shadow-soft border border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Fecha de Emisión
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha de la factura</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-11",
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
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-primary hover:opacity-90 transition-all text-lg py-6 shadow-invoice"
                disabled={!formData.clientName || !formData.businessName || !formData.signatureName || !formData.services.every(s => s.concept.trim() && s.amount.trim()) || !formData.ncf}
              >
                <Receipt className="w-5 h-5 mr-2" />
                Generar Factura Profesional
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};