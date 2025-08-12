import { useEffect, useMemo, useState } from 'react';
import { BackButton } from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CompanyProfile } from '@/types/company';
import { getCompanyProfile, saveCompanyProfile } from '@/utils/companyProfile';
import { getCurrentCompany, patchCurrentCompany } from '@/data/companyDb';
import { Landmark, Image as ImageIcon, Palette, Save } from 'lucide-react';

export const BusinessProfilePage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [dbCompany, setDbCompany] = useState<any | null>(null);

  // SEO: Title + meta description + canonical
  useEffect(() => {
    const title = 'Perfil del negocio | Datos del negocio';
    document.title = title;
    const metaDesc = 'Edita nombre, RNC, contacto, logo y estilo del negocio.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', metaDesc);
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', window.location.href);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await getCurrentCompany();
      if (!mounted) return;
      if (data) {
        setDbCompany(data);
        setProfile((prev) => ({
          ...prev,
          businessName: data.name ?? prev.businessName,
          businessRnc: data.rnc ?? prev.businessRnc,
          businessAddress: data.address ?? prev.businessAddress,
          businessPhone: data.phone ?? prev.businessPhone,
        }));
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleInput = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => setProfile((prev) => ({ ...prev, logo: e.target?.result as string }));
    reader.readAsDataURL(file);
  };
  const removeLogo = () => setProfile((p) => ({ ...p, logo: null }));

  const isValidRnc = (v: string) => /^\d{9,11}$/.test(v.replace(/\D/g, ''));
  const isValidPhone = (v: string) => /^\+?\d{7,15}$/.test(v.replace(/[^+\d]/g, ''));
  const isValidNcf = (v: string) => /^(B01|B02|B14|E31|E32|E33|E34|E41|E42|E43)-?\d{8,10}$/.test(v.trim());

  const handleSave = async () => {
    if (!profile.businessName?.trim()) {
      toast({ title: 'Falta el nombre comercial', description: 'Completa el nombre del negocio.', variant: 'destructive' });
      return;
    }
    if (profile.businessRnc && !isValidRnc(profile.businessRnc)) {
      toast({ title: 'RNC inválido', description: 'Debe contener 9 a 11 dígitos.', variant: 'destructive' });
      return;
    }
    if (profile.businessPhone && !isValidPhone(profile.businessPhone)) {
      toast({ title: 'Teléfono inválido', description: 'Usa solo números, admite formato internacional +.', variant: 'destructive' });
      return;
    }
    if (profile.ncfFormat && !isValidNcf(profile.ncfFormat)) {
      toast({ title: 'Formato de NCF inválido', description: 'Ejemplos válidos: B01-00000000, E31-12345678.', variant: 'destructive' });
      return;
    }

    try {
      const patch: any = {};
      if (dbCompany) {
        const rncDigits = (profile.businessRnc || '').replace(/\D/g, '') || null;
        const phoneNorm = (profile.businessPhone || '').replace(/[^+\d]/g, '') || null;
        if (profile.businessName !== dbCompany.name) patch.name = profile.businessName || null;
        if (rncDigits !== (dbCompany.rnc || null)) patch.rnc = rncDigits;
        if ((profile.businessAddress || null) !== (dbCompany.address || null)) patch.address = profile.businessAddress || null;
        if (phoneNorm !== (dbCompany.phone || null)) patch.phone = phoneNorm;
      }
      if (Object.keys(patch).length) {
        const { error } = await patchCurrentCompany(patch);
        if (error) throw new Error(error);
      }

      saveCompanyProfile(profile);
      toast({ title: 'Datos del negocio guardados', description: 'El perfil se actualizó correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e?.message || 'Intenta nuevamente', variant: 'destructive' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <header className="container-responsive pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            <h1 className="text-responsive-2xl font-bold">Perfil del negocio</h1>
          </div>
        </div>
      </header>

      <section className="container-responsive pb-10 max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input id="businessName" value={profile.businessName} onChange={(e) => handleInput('businessName', e.target.value)} placeholder="Ej: Mi Empresa S.R.L." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureName">Nombre para firma</Label>
                <Input id="signatureName" value={profile.signatureName} onChange={(e) => handleInput('signatureName', e.target.value)} placeholder="Ej: Juan Rodríguez" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessRnc">RNC o Cédula</Label>
                <Input id="businessRnc" value={profile.businessRnc} onChange={(e) => handleInput('businessRnc', e.target.value)} placeholder="123-45678-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPhone">Teléfono</Label>
                <Input id="businessPhone" value={profile.businessPhone} onChange={(e) => handleInput('businessPhone', e.target.value)} placeholder="+1 (809) 000-0000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessEmail">Correo</Label>
              <Input id="businessEmail" type="email" value={profile.businessEmail} onChange={(e) => handleInput('businessEmail', e.target.value)} placeholder="facturacion@miempresa.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Dirección</Label>
              <Textarea id="businessAddress" rows={3} value={profile.businessAddress} onChange={(e) => handleInput('businessAddress', e.target.value)} placeholder="Calle y número, sector" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessCity">Ciudad</Label>
                <Input id="businessCity" value={profile.businessCity ?? ''} onChange={(e) => handleInput('businessCity', e.target.value)} placeholder="Santo Domingo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessCountry">País</Label>
                <Input id="businessCountry" value={profile.businessCountry ?? 'República Dominicana'} onChange={(e) => handleInput('businessCountry', e.target.value)} placeholder="República Dominicana" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPostalCode">Código postal</Label>
                <Input id="businessPostalCode" value={profile.businessPostalCode ?? ''} onChange={(e) => handleInput('businessPostalCode', e.target.value)} placeholder="10101" />
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 flex items-center gap-2 border-b">
                <Palette className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Apariencia y estilo del negocio</span>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Color principal (opcional/futuro)</Label>
                    <Input id="primaryColor" value={profile.primaryColor ?? ''} onChange={(e) => handleInput('primaryColor', e.target.value)} placeholder="hsl(214 100% 50%) o #0B5ED7" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUpload">Subir logo del negocio</Label>
                    <div className="flex items-center gap-3">
                      <Button asChild variant="outline" size="sm">
                        <label htmlFor="logoUpload" className="cursor-pointer">
                          <span className="inline-flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Seleccionar imagen
                          </span>
                        </label>
                      </Button>
                      <input id="logoUpload" type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(file); }} />
                      {profile.logo && (
                        <Button variant="destructive" size="sm" onClick={removeLogo} aria-label="Quitar logo">
                          <span>Quitar logo</span>
                        </Button>
                      )}
                    </div>
                    {profile.logo && (
                      <div className="mt-2">
                        <img src={profile.logo} alt="Logo del negocio" className="h-16 w-16 object-contain rounded" loading="lazy" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} size="lg">
                <Save className="h-4 w-4" /> Guardar datos del negocio
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default BusinessProfilePage;
