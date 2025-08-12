import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Login() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastSentAt = useRef<number>(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    document.title = mode === "signup" ? "Crear cuenta | App" : "Iniciar sesión | App";
  }, [mode]);

  useEffect(() => {
    try {
      const remembered = localStorage.getItem("auth:last_email");
      if (remembered) setEmail(remembered);
    } catch {}
  }, []);

  const canResendIn = useMemo(() => {
    const now = Date.now();
    const delta = now - lastSentAt.current;
    const wait = Math.max(0, 22000 - delta); // ~22s cooldown per Supabase rate limits
    return Math.ceil(wait / 1000);
  }, [sending, sent]);

  if (user) return <Navigate to="/app/inicio" replace />;

  async function sendLoginLink() {
    setErrorMsg(null);

    try {
      const pre = await supabase.functions.invoke("login-guard", { body: { action: "precheck", email } });
      if (!pre.error && (pre.data as any)?.blocked) {
        setErrorMsg("Demasiados intentos. Intenta en 5 min.");
        return;
      }
    } catch {}

    setSending(true);
    try {
      try { localStorage.setItem("auth:last_email", email); } catch {}
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectUrl, shouldCreateUser: true },
      });
      if (error) throw error;

      lastSentAt.current = Date.now();
      setSent(true);
      toast({ title: "Enlace enviado", description: "Revisa tu correo para continuar." });
      try { await supabase.functions.invoke("login-guard", { body: { action: "record", email, success: true } }); } catch {}
    } catch (e: any) {
      const msg = e?.message || "Error desconocido";
      setErrorMsg(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
      try { await supabase.functions.invoke("login-guard", { body: { action: "record", email, success: false } }); } catch {}
    } finally {
      setSending(false);
    }
  }

  async function sendSignupLink() {
    setErrorMsg(null);
    setSending(true);
    try {
      try { localStorage.setItem("auth:last_email", email); } catch {}
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: redirectUrl,
          // Enviar código OTP por correo (además del magic link según config)
          data: { first_name: firstName, last_name: lastName, phone },
        },
      });
      if (error) throw error;

      lastSentAt.current = Date.now();
      setSent(true);
      toast({ title: "Enlace enviado", description: "Revisa tu correo y haz clic en el enlace para confirmar." });
    } catch (e: any) {
      const msg = e?.message || "Error desconocido";
      setErrorMsg(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function ensureAccountSetup(userId: string, userEmail?: string | null) {
    const { data: profile } = await supabase
      .from("users_profiles")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();

    let companyId = (profile as any)?.company_id as string | null | undefined;

    if (!companyId) {
      const defaultName = (userEmail?.split("@")[0] || "Mi Empresa").slice(0, 80);
      const { data: company } = await supabase
        .from("companies")
        .insert({ owner_user_id: userId, name: defaultName })
        .select("id")
        .maybeSingle();
      companyId = company?.id ?? null;

      if (companyId) {
        await supabase
          .from("users_profiles")
          .upsert({ id: userId, company_id: companyId })
          .select("company_id")
          .maybeSingle();
        try {
          await supabase.rpc("add_owner_membership", { _company_id: companyId, _user_id: userId });
        } catch {}
      }
    }

    try { await supabase.rpc("sync_my_claims"); } catch {}
    try { await supabase.rpc("touch_login"); } catch {}
  }

  async function verifyLoginCode() {
    setErrorMsg(null);
    setSending(true);
    try {
      if (!email || !code || code.length < 6) throw new Error("Ingresa el código completo");
      // Paso principal: verificar como 'email' (OTP de 6 dígitos)
      let { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' as any });
      if (error) {
        // Fallback: verificar como 'magiclink' por si el template usa ese tipo
        const res2 = await supabase.auth.verifyOtp({ email, token: code, type: 'magiclink' as any });
        data = res2.data; error = res2.error;
      }
      if (error) throw error;

      // Asegurar perfil/empresa/rol y redirigir
      const sess = await supabase.auth.getSession();
      const u = sess.data.session?.user;
      if (u) {
        await ensureAccountSetup(u.id, u.email);
      }

      toast({ title: "Código verificado", description: "Sesión iniciada correctamente." });
      navigate("/app/inicio", { replace: true });
    } catch (e: any) {
      const msg = e?.message || "Código inválido o expirado";
      setErrorMsg(msg);
      toast({ title: "No se pudo verificar", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  async function verifySignupCode() {
    setErrorMsg(null);
    setSending(true);
    try {
      if (!email || !code || code.length < 6) throw new Error("Ingresa el código completo");
      // Intento 1: verificar como 'signup'
      let { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' as any });
      if (error) {
        // Intento 2 (fallback): verificar como 'email'
        const res2 = await supabase.auth.verifyOtp({ email, token: code, type: 'email' as any });
        data = res2.data; error = res2.error;
      }
      if (error) throw error;

      // Guardar metadatos del usuario
      await supabase.auth.updateUser({ data: { first_name: firstName, last_name: lastName, phone } });

      // Asegurar perfil/empresa/rol y redirigir
      const sess = await supabase.auth.getSession();
      const u = sess.data.session?.user;
      if (u) {
        await ensureAccountSetup(u.id, u.email);
      }
      toast({ title: "Cuenta verificada", description: "Sesión iniciada correctamente." });
      navigate("/app/inicio", { replace: true });
    } catch (e: any) {
      const msg = e?.message || "Código inválido o expirado";
      setErrorMsg(msg);
      toast({ title: "No se pudo verificar", description: msg, variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const onResend = async () => {
    const now = Date.now();
    if (now - lastSentAt.current < 22000) {
      toast({ title: "Espera unos segundos", description: `Puedes reenviar en ${canResendIn}s.` });
      return;
    }
    if (mode === "signup") await sendSignupLink(); else await sendLoginLink();
  };

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">{mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}</h1>

      <Tabs value={mode} onValueChange={(v) => setMode(v as any)} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="login" className="flex-1">Iniciar sesión</TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">Crear cuenta</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-0">
          <AuthEmailForm
            email={email}
            setEmail={setEmail}
            code={code}
            setCode={setCode}
            sending={sending}
            sent={sent}
            errorMsg={errorMsg}
            onSubmit={sendLoginLink}
            onVerify={verifyLoginCode}
            onResend={onResend}
          />
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <SignupForm
            firstName={firstName}
            setFirstName={setFirstName}
            lastName={lastName}
            setLastName={setLastName}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
            code={code}
            setCode={setCode}
            sending={sending}
            sent={sent}
            errorMsg={errorMsg}
            onSubmit={sendSignupLink}
            onVerify={verifySignupCode}
            onResend={onResend}
          />
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />
      <p className="text-xs text-muted-foreground">Te enviaremos un enlace seguro al correo. No pediremos contraseña.</p>
    </main>
  );
}

function AuthEmailForm({
  email,
  setEmail,
  code,
  setCode,
  sending,
  sent,
  errorMsg,
  onSubmit,
  onVerify,
  onResend,
}: {
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  sending: boolean;
  sent: boolean;
  errorMsg: string | null;
  onSubmit: () => void | Promise<void>;
  onVerify: () => void | Promise<void>;
  onResend: () => void | Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (sent) onVerify(); else onSubmit(); }}>
      <div>
        <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
      </div>

      {errorMsg && (
        <div role="alert" aria-live="polite" className="text-sm text-destructive">{errorMsg}</div>
      )}

      {sent && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Código de verificación</label>
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-xs text-muted-foreground">Ingresa el código de 6 dígitos enviado a tu correo.</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={sending || !email || (sent && code.length < 6)}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {sent ? "Verificar código" : "Enviar código"}
      </Button>

      <div className="text-center">
        <button type="button" onClick={onResend} className="text-xs underline disabled:opacity-50" disabled={sending}>
          Reenviar {sent ? "código" : "enlace/código"}
        </button>
      </div>
    </form>
  );
}

function SignupForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  email,
  setEmail,
  code,
  setCode,
  sending,
  sent,
  errorMsg,
  onSubmit,
  onVerify,
  onResend,
}: {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  sending: boolean;
  sent: boolean;
  errorMsg: string | null;
  onSubmit: () => void | Promise<void>;
  onVerify: () => void | Promise<void>;
  onResend: () => void | Promise<void>;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!sent) onSubmit();
      }}
    >
      {!sent && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-sm font-medium">Nombre</label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <label htmlFor="lastName" className="text-sm font-medium">Apellidos</label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1" />
            </div>
          </div>

          <div>
            <label htmlFor="email2" className="text-sm font-medium">Correo electrónico</label>
            <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium">Número de celular</label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1" />
          </div>
        </>
      )}

      {errorMsg && (
        <div role="alert" aria-live="polite" className="text-sm text-destructive">{errorMsg}</div>
      )}

      {sent && (
        <div className="space-y-2">
          <p className="text-sm">Hemos enviado un enlace de confirmación a tu correo. Ábrelo para completar el registro.</p>
          <p className="text-xs text-muted-foreground">Si no lo ves, revisa spam o promociones.</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={sending || !email || sent}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {sent ? "Enlace enviado" : "Enviar enlace"}
      </Button>

      <div className="text-center">
        <button type="button" onClick={onResend} className="text-xs underline disabled:opacity-50" disabled={sending}>
          Reenviar enlace
        </button>
      </div>
    </form>
  );
}

