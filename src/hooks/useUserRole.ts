import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";

export type AppRole = "superadmin" | "admin" | "cajera";

function mapDbRoleToAppRole(dbRole?: string | null): AppRole {
  const r = (dbRole || "").toLowerCase();
  if (r === "superadmin") return "superadmin";
  if (r === "admin" || r === "owner" || r === "manager" || r === "supervisor") return "admin";
  if (r === "cashier" || r === "cajera" || r === "member" || r === "user") return "cajera";
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
        const ctx = await getCurrentContext();
        if (!ctx.data) {
          setRole("cajera");
          setLoading(false);
          return;
        }
        // Try to read role from user_company for current company
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
        setRole("cajera");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading, error } as const;
}
