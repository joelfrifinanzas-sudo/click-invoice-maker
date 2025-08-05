import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Building2, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompanyProfile } from '@/types/company';
import { saveCompanyProfile, getCompanyProfile } from '@/utils/companyProfile';
import { useToast } from '@/hooks/use-toast';

export const CompanyProfilePage = () => {
  const [profile, setProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof CompanyProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!profile.businessName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del negocio es obligatorio",
        variant: "destructive",
      });
      return;
    }

    saveCompanyProfile(profile);
    toast({
      title: "Perfil guardado",
      description: "Los datos de la empresa han sido guardados correctamente",
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfile(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setProfile(prev => ({ ...prev, logo: null }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Perfil de Empresa</h1>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Configuración de Datos Empresariales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Datos básicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">
                  Nombre del Negocio <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={profile.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder="Mi Empresa S.R.L."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signatureName">Nombre de quien Firma</Label>
                <Input
                  id="signatureName"
                  value={profile.signatureName}
                  onChange={(e) => handleInputChange('signatureName', e.target.value)}
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            {/* RNC y contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessRnc">RNC / Cédula</Label>
                <Input
                  id="businessRnc"
                  value={profile.businessRnc}
                  onChange={(e) => handleInputChange('businessRnc', e.target.value)}
                  placeholder="123-45678-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Teléfono Comercial</Label>
                <Input
                  id="businessPhone"
                  value={profile.businessPhone}
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                  placeholder="+1 (809) 123-4567"
                />
              </div>
            </div>

            {/* Email y dirección */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Correo de Facturación</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={profile.businessEmail}
                  onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                  placeholder="facturacion@miempresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAddress">Dirección del Negocio</Label>
                <Textarea
                  id="businessAddress"
                  value={profile.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  placeholder="Calle Principal #123, Ciudad, País"
                  rows={3}
                />
              </div>
            </div>

            {/* Prefijo y logo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Prefijo de Factura</Label>
                <Input
                  id="invoicePrefix"
                  value={profile.invoicePrefix}
                  onChange={(e) => handleInputChange('invoicePrefix', e.target.value)}
                  placeholder="FAC"
                  maxLength={5}
                />
                <p className="text-sm text-muted-foreground">
                  Ejemplo: FAC-0001, INV-0001
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logo del Negocio</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center ${
                    dragActive ? 'border-primary bg-primary/10' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {profile.logo ? (
                    <div className="relative inline-block">
                      <img
                        src={profile.logo}
                        alt="Logo"
                        className="h-20 w-20 object-contain mx-auto rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Arrastra una imagen o{' '}
                        <label className="text-primary cursor-pointer hover:underline">
                          selecciona un archivo
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón guardar */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} size="lg">
                Guardar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};