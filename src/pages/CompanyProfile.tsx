import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CompanyProfile } from '@/types/company';
import { getCompanyProfile, saveCompanyProfile } from '@/utils/companyProfile';
import { getCurrentCompany, patchCurrentCompany } from '@/data/companyDb';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Landmark,
  UserCheck,
  Shield,
  LogOut,
  Palette,
  Image as ImageIcon,
  Save,
} from 'lucide-react';

export const CompanyProfilePage = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [open, setOpen] = useState<string>('facturacion');
  const [dbCompany, setDbCompany] = useState<any | null>(null);
  const [itbisPct, setItbisPct] = useState<number>(18);
  const [loadingDb, setLoadingDb] = useState<boolean>(true);
  const navigate = useNavigate();

  // SEO: Title + meta description + canonical
  useEffect(() => {
    const title = 'Configuración del perfil de empresa | Perfil de Empresa';
    document.title = title;
    const metaDesc = 'Actualiza los datos de tu negocio y contacto. Perfil de empresa dominicanizado, simple y moderno.';
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

  const handleInput = (field: keyof CompanyProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingDb(true);
      const { data } = await getCurrentCompany();
      if (!mounted) return;
      if (data) {
        setDbCompany(data);
        setItbisPct(typeof data.itbis_rate === 'number' ? Math.round(Number(data.itbis_rate) * 10000) / 100 : 18);
        setProfile((prev) => ({
          ...prev,
          businessName: data.name ?? prev.businessName,
          businessRnc: data.rnc ?? prev.businessRnc,
          businessAddress: data.address ?? prev.businessAddress,
          businessPhone: data.phone ?? prev.businessPhone,
        }));
      }
      setLoadingDb(false);
    })();
    return () => { mounted = false; };
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile((prev) => ({ ...prev, logo: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setProfile((p) => ({ ...p, logo: null }));

  const isValidRnc = (v: string) => /^\d{9,11}$/.test(v.replace(/\D/g, ''));
  const isValidPhone = (v: string) => /^\+?\d{7,15}$/.test(v.replace(/[^+\d]/g, ''));
  const isValidNcf = (v: string) => /^(B01|B02|B14|E31|E32|E33|E34|E41|E42|E43)-?\d{8,10}$/.test(v.trim());

  const handleSave = async () => {
    // Validaciones
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
    const pct = Number.isFinite(itbisPct) ? itbisPct : 18;
    if (pct < 0 || pct > 100) {
      toast({ title: 'ITBIS inválido', description: 'Debe estar entre 0% y 100%.', variant: 'destructive' });
      return;
    }

    // Patch solo campos modificados en BD
    try {
      const patch: any = {};
      if (dbCompany) {
        const rncDigits = (profile.businessRnc || '').replace(/\D/g, '') || null;
        const phoneNorm = (profile.businessPhone || '').replace(/[^+\d]/g, '') || null;
        if (profile.businessName !== dbCompany.name) patch.name = profile.businessName || null;
        if (rncDigits !== (dbCompany.rnc || null)) patch.rnc = rncDigits;
        if ((profile.businessAddress || null) !== (dbCompany.address || null)) patch.address = profile.businessAddress || null;
        if (phoneNorm !== (dbCompany.phone || null)) patch.phone = phoneNorm;
        const newRate = Math.round((pct / 100) * 100000) / 100000; // 5 decimales
        const oldRate = typeof dbCompany.itbis_rate === 'number' ? dbCompany.itbis_rate : 0.18;
        if (Math.abs(newRate - oldRate) > 0.000001) patch.itbis_rate = newRate;
      }
      if (Object.keys(patch).length) {
        const { error } = await patchCurrentCompany(patch);
        if (error) throw new Error(error);
      }

      // Guardar parte local (logo, ncfFormat, etc.)
      saveCompanyProfile(profile);
      toast({ title: 'Datos guardados', description: 'El perfil se actualizó correctamente.' });
    } catch (e: any) {
      toast({ title: 'Error al guardar', description: e?.message || 'Intenta nuevamente', variant: 'destructive' });
    }
  };

  const contacto = useMemo(
    () => ({
      nombre: 'Joelfri Acevedo',
      telefono: '+1 (809) 942-0001',
      correo: 'jacevedo@bootis.com.do',
      direccion: 'Av. Las Américas, Plaza Kilvio, local #4, Santo Domingo Este',
      whatsapp: 'https://wa.me/18099420001',
    }),
    []
  );

  return (
    <main className="min-h-screen bg-gradient-subtle">
      <header className="container-responsive pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-responsive-2xl font-bold">Configuración del perfil de empresa</h1>
          </div>
        </div>
      </header>

      <section className="container-responsive pb-10 max-w-2xl mx-auto">
        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={(v) => setOpen(v)}
          className="space-y-4"
        >
          {/* 1. Información de contacto */}
          <AccordionItem value="contacto" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-base font-medium">Información de contacto</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Nombre: {contacto.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Teléfono: {contacto.telefono}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Correo: {contacto.correo}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm leading-relaxed">Dirección: {contacto.direccion}</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button asChild variant="success" size="lg">
                      <a href={contacto.whatsapp} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" /> Escríbenos por WhatsApp
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
          {/* 2. Parámetros de facturación */}
          <AccordionItem value="facturacion" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <span className="text-base font-medium">Parámetros de facturación</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-4 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="itbisPct">ITBIS (%)</Label>
                      <Input id="itbisPct" type="number" step="0.01" value={itbisPct} onChange={(e) => setItbisPct(Number(e.target.value || 0))} placeholder="18" />
                      <p className="text-xs text-muted-foreground">Valor por defecto 18%. Editable.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ncfFormat">Formato de NCF (DGII)</Label>
                      <Input id="ncfFormat" value={profile.ncfFormat ?? ''} onChange={(e) => handleInput('ncfFormat', e.target.value.toUpperCase())} placeholder="Ej: B01-00000000" />
                      <p className="text-xs text-muted-foreground">Ejemplos: B01-00000000, E31-12345678.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>


          {/* 3. Usuarios y permisos */}
          <AccordionItem value="usuarios" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-base font-medium">Usuarios y permisos</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Agrega usuarios y asigna roles como Cajero, Supervisor o Administrador. Requiere Supabase conectado.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => navigate('/usuarios')}>
                      + Crear usuario
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/usuarios')}
                   >
                      Ver roles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Cerrar sesión */}
          <AccordionItem value="logout" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-destructive" />
                <span className="text-base font-medium">Cerrar sesión</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="py-4 flex justify-center">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() =>
                    toast({
                      title: 'Sesión cerrada',
                      description: 'Para cierre real y redirección a login, conecta Supabase.',
                    })
                  }
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </main>
  );
};
