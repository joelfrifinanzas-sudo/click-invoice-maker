import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
  const [status, setStatus] = useState<string>("Procesando autenticación...");
  const { access_token, refresh_token, error } = useMemo(() => parseHash(location.hash), [location.hash]);

  useEffect(() => {
    // Basic SEO for this transitional page
    const prevTitle = document.title;
    document.title = "Auth Callback – Iniciando sesión";
    const meta = document.createElement("meta");
    meta.name = "description";
    meta.content = "Confirmación de email y autenticación por enlace mágico.";
    document.head.appendChild(meta);

    const link = document.createElement("link");
    link.rel = "canonical";
    link.href = `${window.location.origin}/auth/callback`;
    document.head.appendChild(link);

    return () => {
      document.title = prevTitle;
      document.head.removeChild(meta);
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const proceed = async () => {
      try {
        if (error) {
          setStatus(`Error de autenticación: ${error}`);
          setTimeout(() => navigate("/login", { replace: true }), 2000);
          return;
        }

        if (access_token && refresh_token) {
          // Set the session directly from the hash params
          const { data, error: setErr } = await supabase.auth.setSession({ access_token, refresh_token });
          if (setErr) throw setErr;
          if (!data.session) throw new Error("No se pudo establecer la sesión");
          // Touch profile/claims
          try { await supabase.rpc("touch_login"); } catch { /* ignore */ }
          setStatus("¡Autenticado! Redirigiendo...");
          setTimeout(() => navigate("/app/inicio", { replace: true }), 300);
          return;
        }

        // Fallback: if no tokens in hash, check existing session
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          try { await supabase.rpc("touch_login"); } catch { /* ignore */ }
          setStatus("Sesión encontrada. Redirigiendo...");
          setTimeout(() => navigate("/app/inicio", { replace: true }), 300);
        } else {
          setStatus("No se encontró sesión. Redirigiendo al inicio de sesión...");
          setTimeout(() => navigate("/login", { replace: true }), 800);
        }
      } catch (e: any) {
        setStatus(`Error: ${e?.message || "Fallo desconocido"}`);
        setTimeout(() => navigate("/login", { replace: true }), 1200);
      }
    };

    proceed();
    return () => { cancelled = true; };
  }, [access_token, refresh_token, error, navigate]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6">
      <section className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin">
          <Loader2 className="h-10 w-10" />
        </div>
        <h1 className="text-xl font-semibold">Autenticando…</h1>
        <p className="text-muted-foreground">{status}</p>
      </section>
    </main>
  );
}
