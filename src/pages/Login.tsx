import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const lastSentAt = useRef<number>(0);

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
      const { error } = await supabase.auth.signUp({
        email,
        options: { emailRedirectTo: redirectUrl },
      } as any);
      if (error) throw error;
      lastSentAt.current = Date.now();
      setSent(true);
      toast({ title: "Enlace enviado", description: "Revisa tu correo para confirmar tu cuenta." });
    } catch (e: any) {
      const msg = e?.message || "Error desconocido";
      setErrorMsg(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
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
            sending={sending}
            sent={sent}
            errorMsg={errorMsg}
            onSubmit={sendLoginLink}
            onResend={onResend}
          />
        </TabsContent>

        <TabsContent value="signup" className="mt-0">
          <AuthEmailForm
            email={email}
            setEmail={setEmail}
            sending={sending}
            sent={sent}
            errorMsg={errorMsg}
            onSubmit={sendSignupLink}
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
  sending,
  sent,
  errorMsg,
  onSubmit,
  onResend,
}: {
  email: string;
  setEmail: (v: string) => void;
  sending: boolean;
  sent: boolean;
  errorMsg: string | null;
  onSubmit: () => void | Promise<void>;
  onResend: () => void | Promise<void>;
}) {
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div>
        <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
      </div>

      {errorMsg && (
        <div role="alert" aria-live="polite" className="text-sm text-destructive">{errorMsg}</div>
      )}

      <Button type="submit" className="w-full" disabled={sending || !email || sent}>
        {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {sent ? "Revisa tu correo" : "Enviar enlace"}
      </Button>

      <div className="text-center">
        <button type="button" onClick={onResend} className="text-xs underline disabled:opacity-50" disabled={sending}>
          Reenviar enlace
        </button>
      </div>
    </form>
  );
}
