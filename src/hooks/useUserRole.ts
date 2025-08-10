import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";

export type AppRole = "superadmin" | "admin" | "cajera";

function mapDbRoleToAppRole(dbRole?: string | null): AppRole {
  const r = (dbRole || "").toLowerCase();
  if (r === "superadmin" || r === "super_admin") return "superadmin";
  if (r === "admin" || r === "owner" || r === "manager" || r === "supervisor") return "admin";
  if (r === "cashier" || r === "cajera" || r === "member" || r === "user" || r === "cliente" || r === "client") return "cajera";
  return "superadmin";
}

export function useUserRole() {
  const [role, setRole] = useState<AppRole>("superadmin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Prefer JWT metadata for immediate role access
        const { data: auth } = await supabase.auth.getUser();
        let jwtRole = (auth.user?.user_metadata as any)?.role as string | undefined;

        if (!jwtRole && auth.user) {
          // Populate claims on demand (no-op if already synced)
          try { await (supabase.rpc as any)('sync_my_claims'); } catch {}
          const { data: auth2 } = await supabase.auth.getUser();
          jwtRole = (auth2.user?.user_metadata as any)?.role as string | undefined;
        }

        if (jwtRole) {
          if (!mounted) return;
          setRole(mapDbRoleToAppRole(jwtRole));
          return;
        }

        // Fallback to existing context + membership query
        const ctx = await getCurrentContext();
        if (!ctx.data) {
          setRole("superadmin");
          return;
        }
        const { data, error } = await supabase
          .from("user_company")
          .select("role, company_id")
          .eq("user_id", ctx.data.user.id)
          .eq("company_id", ctx.data.companyId)
          .maybeSingle();
        if (error) throw error;
        const appRole = mapDbRoleToAppRole((data as any)?.role ?? null);
        if (!mounted) return;
        setRole(appRole);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Error obteniendo rol");
        setRole("superadmin");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { role, loading, error } as const;
}
