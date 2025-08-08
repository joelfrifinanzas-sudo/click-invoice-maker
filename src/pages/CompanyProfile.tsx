import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CompanyProfile } from '@/types/company';
import { getCompanyProfile, saveCompanyProfile } from '@/utils/companyProfile';
import {
  ArrowLeft,
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
  const [open, setOpen] = useState<string>('contacto');

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

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfile((prev) => ({ ...prev, logo: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => setProfile((p) => ({ ...p, logo: null }));

  const handleSave = () => {
    if (!profile.businessName?.trim()) {
      toast({
        title: 'Falta el nombre del negocio',
        description: 'Por favor, completa el nombre del negocio.',
        variant: 'destructive',
      });
      return;
    }
    saveCompanyProfile(profile);
    toast({
      title: 'Datos guardados',
      description: 'El perfil del negocio se guardó correctamente.',
    });
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
          <Link to="/">
            <Button variant="outline" size="icon" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
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

          {/* 2. Perfil del negocio */}
          <AccordionItem value="negocio" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <span className="text-base font-medium">Perfil del negocio</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="border-t-0 rounded-t-none">
                <CardContent className="pt-4 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nombre del negocio</Label>
                      <Input
                        id="businessName"
                        value={profile.businessName}
                        onChange={(e) => handleInput('businessName', e.target.value)}
                        placeholder="Ej: Mi Empresa S.R.L."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signatureName">Nombre para firma</Label>
                      <Input
                        id="signatureName"
                        value={profile.signatureName}
                        onChange={(e) => handleInput('signatureName', e.target.value)}
                        placeholder="Ej: Juan Rodríguez"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessRnc">RNC o Cédula</Label>
                      <Input
                        id="businessRnc"
                        value={profile.businessRnc}
                        onChange={(e) => handleInput('businessRnc', e.target.value)}
                        placeholder="123-45678-9"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Teléfono</Label>
                      <Input
                        id="businessPhone"
                        value={profile.businessPhone}
                        onChange={(e) => handleInput('businessPhone', e.target.value)}
                        placeholder="+1 (809) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessEmail">Correo</Label>
                    <Input
                      id="businessEmail"
                      type="email"
                      value={profile.businessEmail}
                      onChange={(e) => handleInput('businessEmail', e.target.value)}
                      placeholder="facturacion@miempresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessAddress">Dirección</Label>
                    <Textarea
                      id="businessAddress"
                      rows={3}
                      value={profile.businessAddress}
                      onChange={(e) => handleInput('businessAddress', e.target.value)}
                      placeholder="Av. Principal #123, Ciudad"
                    />
                  </div>

                  {/* Sub-sección: Apariencia y estilo del negocio */}
                  <div className="rounded-lg border bg-card">
                    <div className="px-4 py-3 flex items-center gap-2 border-b">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Apariencia y estilo del negocio</span>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="primaryColor">Color principal (opcional/futuro)</Label>
                          <Input
                            id="primaryColor"
                            value={profile.primaryColor ?? ''}
                            onChange={(e) => handleInput('primaryColor', e.target.value)}
                            placeholder="hsl(214 100% 50%) o #0B5ED7"
                          />
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
                            <input
                              id="logoUpload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                              }}
                            />
                            {profile.logo && (
                              <Button variant="destructive" size="sm" onClick={removeLogo} aria-label="Quitar logo">
                                <span>Quitar logo</span>
                              </Button>
                            )}
                          </div>
                          {profile.logo && (
                            <div className="mt-2">
                              <img
                                src={profile.logo}
                                alt="Logo del negocio"
                                className="h-16 w-16 object-contain rounded"
                                loading="lazy"
                              />
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
                    <Button
                      onClick={() =>
                        toast({
                          title: 'Conecta Supabase',
                          description: 'Para crear usuarios reales y asignar roles, conecta Supabase.',
                        })
                      }
                    >
                      + Crear usuario
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        toast({
                          title: 'Ver roles',
                          description: 'Gestiona roles cuando Supabase esté conectado.',
                        })
                      }
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
