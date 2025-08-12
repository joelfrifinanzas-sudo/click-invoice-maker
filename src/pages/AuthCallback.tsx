import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

function parseHash(hash: string) {
  const h = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(h);
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    type: params.get("type"),
    error: params.get("error_description") || params.get("error"),
  };
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("Procesando autenticación...");
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState<string>(() => {
    try { return localStorage.getItem("auth:last_email") || ""; } catch { return ""; }
  });
  const [resending, setResending] = useState(false);
  const { access_token, refresh_token, error } = useMemo(() => parseHash(location.hash), [location.hash]);

  useEffect(() => {
    // Basic SEO + noindex for this transitional page
    const prevTitle = document.title;
    document.title = "Auth Callback – Iniciando sesión";
    const metaDesc = document.createElement("meta");
    metaDesc.name = "description";
    metaDesc.content = "Confirmación de email y autenticación por enlace mágico.";
    document.head.appendChild(metaDesc);

    const metaRobots = document.createElement("meta");
    metaRobots.name = "robots";
    metaRobots.content = "noindex,nofollow";
    document.head.appendChild(metaRobots);

    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = `${window.location.origin}/auth/callback`;
    document.head.appendChild(link);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(metaDesc);
      document.head.removeChild(metaRobots);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ensureCompanyProfile = async (userId: string, userEmail?: string | null) => {
      const { data: profile } = await supabase
        .from("users_profiles")
        .select("company_id")
        .eq("id", userId)
        .maybeSingle();

      let companyId = profile?.company_id as string | null | undefined;

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
            .maybeSingle()
            .then(() => {});
          try {
            await supabase.rpc("add_owner_membership", { _company_id: companyId, _user_id: userId });
          } catch {}
        }
      }

      try { await supabase.rpc("sync_my_claims"); } catch {}
      try { await supabase.rpc("touch_login"); } catch {}
    };

    const proceed = async () => {
      try {
        const sessRes = await supabase.auth.getSession();
        let session = sessRes.data.session;

        if (!session) {
          if (error) throw new Error(error);
          if (access_token && refresh_token) {
            const { data, error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
            if (setErr) throw setErr;
            session = data.session;
          }
        }

        if (!session?.user) {
          throw new Error("Enlace inválido o expirado");
        }

        if (cancelled) return;

        setStatus("Sincronizando tu cuenta...");
        await ensureCompanyProfile(session.user.id, session.user.email);

        if (cancelled) return;
        setStatus("¡Autenticado! Redirigiendo...");
        setTimeout(() => navigate("/app/inicio", { replace: true }), 300);
      } catch (e: any) {
        const msg = e?.message || "Fallo desconocido";
        setErr(msg);
        setStatus(`Error: ${msg}`);
        toast({ title: "Enlace inválido o expirado", description: msg, variant: "destructive" });
      }
    };

    proceed();
    return () => { cancelled = true; };
  }, [access_token, refresh_token, error, navigate, toast]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      try { localStorage.setItem("auth:last_email", email); } catch {}
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } });
      if (error) throw error;
      toast({ title: "Enlace enviado", description: "Revisa tu correo para continuar." });
    } catch (e: any) {
      toast({ title: "No se pudo enviar el enlace", description: e?.message || "Intenta de nuevo más tarde", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <section className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin">
          <Loader2 className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-semibold">Autenticando…</h1>
        <p className="text-muted-foreground">{status}</p>
        {err && (
          <div className="space-y-2">
            <p className="text-sm">Intentar de nuevo con: <strong>{email || "(sin correo guardado)"}</strong></p>
            <div className="flex items-center justify-center">
              <Button onClick={handleResend} disabled={!email || resending}>
                {resending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reenviar enlace
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
