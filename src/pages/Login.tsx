import { useState, useEffect, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;

function loadAttempts(email: string): number[] {
  try {
    const raw = localStorage.getItem(`auth:attempts:${email.toLowerCase()}`);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    const now = Date.now();
    const filtered = arr.filter((t) => now - t < WINDOW_MS);
    if (filtered.length !== arr.length) {
      localStorage.setItem(`auth:attempts:${email.toLowerCase()}`, JSON.stringify(filtered));
    }
    return filtered;
  } catch {
    return [];
  }
}

function pushAttempt(email: string) {
  try {
    const arr = loadAttempts(email);
    arr.push(Date.now());
    localStorage.setItem(`auth:attempts:${email.toLowerCase()}`, JSON.stringify(arr));
  } catch {}
}

function clearAttempts(email: string) {
  try { localStorage.removeItem(`auth:attempts:${email.toLowerCase()}`); } catch {}
}

function useCaptcha(email: string) {
  const [captcha, setCaptcha] = useState("");
  const [solved, setSolved] = useState(false);
  const [a, b] = useMemo(() => {
    const a = Math.floor(Math.random() * 8) + 2;
    const b = Math.floor(Math.random() * 8) + 1;
    return [a, b];
  }, [email]);

  function verify(): boolean {
    const ok = Number(captcha) === a + b;
    setSolved(ok);
    return ok;
  }

  return { captcha, setCaptcha, a, b, solved, verify } as const;
}

export default function Login() {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState<boolean>(() => {
    try { return localStorage.getItem("auth:remember") === "1"; } catch { return true; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [magicSending, setMagicSending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const attempts = loadAttempts(email);
  const showCaptcha = attempts.length >= MAX_ATTEMPTS;
  const captcha = useCaptcha(email);

  useEffect(() => {
    document.title = "Iniciar sesión | App";
  }, []);

  useEffect(() => {
    try { localStorage.setItem("auth:remember", remember ? "1" : "0"); } catch {}
  }, [remember]);

  if (user) return <Navigate to="/app/inicio" replace />;

  const mapError = (msg?: string) => {
    const m = (msg || "").toLowerCase();
    if (m.includes("invalid") && m.includes("credential")) return "Credenciales inválidas";
    if (m.includes("too many") || m.includes("rate limit")) return "Demasiados intentos. Intenta en 5 min.";
    return msg || "Error inesperado";
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (showCaptcha && !captcha.solved) {
      if (!captcha.verify()) {
        setErrorMsg("Por favor resuelve el captcha para continuar");
        return;
      }
    }

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      pushAttempt(email);
      setErrorMsg(mapError(error.message));
      return;
    }

    // Post-login check: suspended accounts
    const { data: auth } = await supabase.auth.getUser();
    const status = (auth.user?.user_metadata as any)?.status as string | undefined;
    if (status && status.toLowerCase() === "suspended") {
      await supabase.auth.signOut();
      setErrorMsg("Cuenta suspendida");
      return;
    }

    try { await supabase.rpc("touch_login"); } catch {}
    clearAttempts(email);
    toast({ title: "Sesión iniciada" });
    navigate("/app/inicio", { replace: true });
  }

  async function handleMagicLink() {
    setErrorMsg(null);
    setMagicSending(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl },
    });
    setMagicSending(false);
    if (error) {
      setErrorMsg(mapError(error.message));
    } else {
      toast({ title: "Enlace enviado", description: "Revisa tu correo para iniciar sesión." });
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetSending(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
    setResetSending(false);
    if (error) {
      // Intencionalmente no revelamos si el correo existe
      toast({ title: "Si la cuenta existe, enviamos un enlace", description: "Revisa tu correo.", });
    } else {
      toast({ title: "Si la cuenta existe, enviamos un enlace", description: "Revisa tu correo.", });
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Iniciar sesión</h1>
      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            <Label htmlFor="remember">Recordarme por 30 días</Label>
          </div>
          <button type="button" onClick={() => setForgotOpen((s) => !s)} className="text-sm underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {showCaptcha && (
          <div className="rounded-md border p-3">
            <Label htmlFor="captcha">Verificación rápida</Label>
            <div className="mt-2 flex items-center gap-2">
              <span>{captcha.a} + {captcha.b} =</span>
              <Input id="captcha" inputMode="numeric" className="w-24" value={captcha.captcha} onChange={(e) => captcha.setCaptcha(e.target.value)} />
              <Button type="button" variant="outline" onClick={() => setErrorMsg(captcha.verify() ? null : "Respuesta incorrecta")}>Validar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Hemos detectado varios intentos. Completa el captcha para continuar.</p>
          </div>
        )}

        {errorMsg && (
          <div role="alert" aria-live="polite" className="text-sm text-destructive">
            {errorMsg}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={submitting || !email}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar sesión
        </Button>
      </form>

      {forgotOpen && (
        <form className="mt-4 space-y-3" onSubmit={handleResetPassword}>
          <Label>Te enviaremos un enlace para restablecer tu contraseña</Label>
          <Button type="submit" variant="outline" className="w-full" disabled={resetSending || !email}>
            {resetSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar enlace de restablecimiento
          </Button>
        </form>
      )}

      <div className="my-6"><Separator /><div className="text-center text-xs text-muted-foreground mt-2">o</div></div>

      <Button type="button" variant="secondary" className="w-full" onClick={handleMagicLink} disabled={magicSending || !email}>
        {magicSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Recibir enlace mágico al correo
      </Button>
    </main>
  );
}

