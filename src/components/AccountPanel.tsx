import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Building2, LogOut, MessageCircle, Plus, Shield, Phone, Mail, MapPin, ChevronRight, Palette, CreditCard } from "lucide-react";
import { CompanyProfile } from "@/types/company";
import { getCompanyProfile, saveCompanyProfile } from "@/utils/companyProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
interface AccountPanelTriggerProps {
  children: React.ReactNode;
}

export function AccountPanelTrigger({ children }: AccountPanelTriggerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const goUsers = () =>
    toast({
      title: "Conecta Supabase para gestionar usuarios",
      description: "Esta sección se habilitará al conectar tu proyecto de Supabase.",
    });

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[88vw] sm:w-[420px] p-0 overflow-y-auto">
        <div className="px-4 py-3 border-b bg-background/95 backdrop-blur">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Panel de cuenta
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-4 space-y-4 bg-muted/30">
          <ContactSection />

          <div className="space-y-3">
            <NavItem
              icon={Building2}
              label="Perfil de la Empresa"
              onClick={() => navigate("/perfil-empresa")}
            />
            <NavItem
              icon={Palette}
              label="Marca y preferencias"
              onClick={() => navigate("/perfil-empresa")}
            />
            <NavItem icon={Shield} label="Gestión de Usuarios" onClick={goUsers} />
            <NavItem
              icon={CreditCard}
              label="Métodos de pago"
              onClick={() => navigate("/pagos")}
              highlight
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContactSection() {
  const profile = getCompanyProfile();
  const contactName = profile.signatureName?.trim() || profile.businessName || "Contacto";
  const phone = profile.businessPhone || "";
  const email = profile.businessEmail || "";
  const address = profile.businessAddress || "";
  const phoneDigits = phone.replace(/[^\d]/g, "");
  const wa = phoneDigits ? `https://wa.me/${phoneDigits.startsWith("1") ? phoneDigits : `1${phoneDigits}`}` : "";

  return (
    <section aria-labelledby="contacto-title" className="bg-card rounded-xl border shadow-card">
      <div className="p-4">
        <h2 id="contacto-title" className="text-base font-semibold mb-3">Contáctanos</h2>
        <div className="text-sm space-y-2">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium leading-tight">{contactName}</p>
              {phone && <p className="text-muted-foreground">{phone}</p>}
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              {email && <p className="text-muted-foreground break-all">{email}</p>}
            </div>
          </div>
          {address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">{address}</p>
            </div>
          )}
        </div>
        <div className="mt-3">
          <Button asChild variant="success" className="w-full" disabled={!wa}>
            <a href={wa || undefined} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2" /> WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CompanyProfileSection() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<CompanyProfile>(() => getCompanyProfile());

  const onChange = (field: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((p) => ({ ...p, [field]: e.target.value } as CompanyProfile));
  };

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, logo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!profile.businessName?.trim()) {
      toast({ title: "Completa el nombre del negocio", variant: "destructive" });
      return;
    }
    saveCompanyProfile(profile);
    toast({ title: "Perfil de empresa guardado", description: "Se aplicará automáticamente al crear facturas." });
  };

  return (
    <section aria-labelledby="empresa-title">
      <h2 id="empresa-title" className="text-base font-semibold mb-3">Perfil de la Empresa</h2>
      <Accordion type="single" collapsible defaultValue="basicos" className="w-full">
        <AccordionItem value="basicos">
          <AccordionTrigger>Datos básicos</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="businessName">Nombre del negocio</Label>
                <Input id="businessName" value={profile.businessName} onChange={onChange("businessName")} placeholder="Mi Empresa S.R.L." />
              </div>
              <div className="space-y-1">
                <Label htmlFor="signatureName">Nombre para firma</Label>
                <Input id="signatureName" value={profile.signatureName} onChange={onChange("signatureName")} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="businessRnc">RNC o cédula</Label>
                <Input id="businessRnc" value={profile.businessRnc} onChange={onChange("businessRnc")} placeholder="123-456789-0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="businessPhone">Teléfono</Label>
                <Input id="businessPhone" value={profile.businessPhone} onChange={onChange("businessPhone")} placeholder="+1 (809) 000-0000" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="businessEmail">Correo</Label>
                <Input id="businessEmail" type="email" value={profile.businessEmail} onChange={onChange("businessEmail")} placeholder="facturacion@miempresa.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="businessAddress">Dirección</Label>
                <Textarea id="businessAddress" value={profile.businessAddress} onChange={onChange("businessAddress")} rows={3} placeholder="Calle Principal #123, Ciudad" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="branding">
          <AccordionTrigger>Branding y preferencias</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1">
                <Label htmlFor="slogan">Lema o eslogan</Label>
                <Input id="slogan" value={profile.slogan || ""} onChange={onChange("slogan")} placeholder="Calidad y servicio" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="website">Página web (opcional)</Label>
                <Input id="website" value={profile.website || ""} onChange={onChange("website")} placeholder="https://miempresa.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Moneda</Label>
                <Input id="currency" value={profile.currency || "DOP"} onChange={onChange("currency")} placeholder="DOP" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="primaryColor">Color principal (HSL o HEX)</Label>
                <Input id="primaryColor" value={profile.primaryColor || ""} onChange={onChange("primaryColor")} placeholder="214 100% 50%" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" type="file" accept="image/*" onChange={onLogoChange} />
                {profile.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logo} alt="Logo del negocio" className="h-16 w-16 object-contain mt-2 rounded" />
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="mt-3 flex justify-end">
        <Button onClick={handleSave}>Guardar perfil</Button>
      </div>
    </section>
  );
}

function UsersRolesSection() {
  const { toast } = useToast();
  const handleCreateUser = () => {
    toast({
      title: "Conecta Supabase para gestionar usuarios",
      description: "Ve al botón verde ‘Supabase’ arriba a la derecha y conecta tu proyecto.",
    });
  };
  return (
    <section aria-labelledby="usuarios-title">
      <h2 id="usuarios-title" className="text-base font-semibold mb-3">Gestión de Usuarios / Roles</h2>
      <p className="text-sm text-muted-foreground mb-3">
        Para crear usuarios, asignar roles (Cajera, Supervisor, Administrador, …) y manejar sesión, conecta la integración nativa de Supabase.
      </p>
      <div className="flex gap-2">
        <Button onClick={handleCreateUser} className="flex-1">
          <Plus className="mr-2" /> Crear usuario
        </Button>
        <Button variant="outline" className="flex-1">
          <Shield className="mr-2" /> Roles
        </Button>
      </div>
    </section>
  );
}

function LogoutSection() {
  const { toast } = useToast();
  const handleLogout = () => {
    toast({ title: "Conecta Supabase para habilitar el cierre de sesión" });
    // Aquí redirigirías a /login tras integrar autenticación con Supabase
  };
  return (
    <section aria-labelledby="logout-title">
      <h2 id="logout-title" className="sr-only">Cerrar sesión</h2>
      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2" /> Cerrar sesión
      </Button>
    </section>
  );
}

function NavItem({ icon: Icon, label, onClick, highlight = false }: { icon: any; label: string; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-card hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-primary" />
        <span className={highlight ? "text-primary font-medium" : "font-medium"}>{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
