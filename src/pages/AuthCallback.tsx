import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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
  const BASE_URL = typeof window !== 'undefined' ? window.location.origin : "";
  const { access_token, refresh_token, error } = useMemo(() => parseHash(location.hash), [location.hash]);
  const { code, qerror } = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      code: params.get("code"),
      qerror: params.get("error_description") || params.get("error"),
    };
  }, [location.search]);

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
        // 1) Intentar adjuntar invitación existente
        try {
          const { data: invitedId } = await supabase.rpc("cm_accept_any_invitation_for_me");
          if (invitedId) {
            companyId = invitedId as unknown as string;
            await supabase
              .from("users_profiles")
              .upsert({ id: userId, company_id: companyId })
              .select("company_id")
              .maybeSingle();
          }
        } catch {}
      }

      if (!companyId) {
        // 2) Crear empresa mínima y ligar al perfil
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
        }
      }

      try { await supabase.rpc("touch_login"); } catch {}
      return companyId ?? null;
    };

    const ensureMembershipRole = async (companyId: string, userEmail?: string | null) => {
      if (!companyId) return null;
      try {
        const { data, error } = await supabase.rpc("cm_bootstrap_membership", { _company_id: companyId, _email: userEmail ?? null });
        if (error) throw error;
        return data as any;
      } catch {
        return null;
      }
    };

    const proceed = async () => {
      try {
        const sessRes = await supabase.auth.getSession();
        let session = sessRes.data.session;

        if (!session) {
          if (qerror || error) throw new Error(qerror || error!);
          if (code) {
            const { data, error: exchErr } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (exchErr) throw exchErr;
            session = data.session;
          } else if (access_token && refresh_token) {
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
        const companyId = await ensureCompanyProfile(session.user.id, session.user.email);

        if (cancelled) return;
        if (companyId) {
          setStatus("Aplicando permisos...");
          await ensureMembershipRole(companyId, session.user.email);
          try { await supabase.rpc("sync_my_claims"); } catch {}
        }

        if (cancelled) return;
        setStatus("Cargando membresías...");
        const { data: mList, error: mErr } = await supabase.from("my_memberships").select("*");
        if (mErr) throw mErr;
        const list = (mList as any[]) || [];

        if (list.length === 0) {
          navigate("/perfil-negocio", { replace: true });
          return;
        }

        if (list.length === 1) {
          const only = list[0];
          try { localStorage.setItem("app:company_id", only.company_id); } catch {}
          try { localStorage.setItem("app:membership_role", String(only.role || "")); } catch {}
          try {
            const { data: auth2 } = await supabase.auth.getUser();
            const uid = auth2.user?.id;
            if (uid) await supabase.from("users_profiles").update({ last_company_id: only.company_id }).eq("id", uid);
          } catch {}
          navigate("/app/inicio", { replace: true });
          return;
        }

        // Multiples empresas: vamos al selector de contexto en /login
        navigate("/login?state=context", { replace: true });
      } catch (e: any) {
        const msg = e?.message || "Fallo desconocido";
        setErr(msg);
        setStatus(`Error: ${msg}`);
        toast({ title: "Enlace inválido o expirado", description: msg, variant: "destructive" });
        setTimeout(() => navigate("/login?e=invalid_link", { replace: true }), 300);
      }
    };

    proceed();
    return () => { cancelled = true; };
  }, [access_token, refresh_token, error, code, qerror, navigate, toast]);


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
              <p className="text-sm">No se pudo confirmar el enlace. Te llevaremos al inicio de sesión.</p>
            </div>
          )}
      </section>
    </main>
  );
}
