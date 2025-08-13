import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type CurrentContext = {
  user: User;
  companyId: string;
};

export async function getCurrentContext(): Promise<{ data: CurrentContext | null; error: string | null }> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return { data: null, error: "Not authenticated" };

    // Prefer explicit selection stored locally
    try {
      const lsCompanyId = localStorage.getItem('app:company_id');
      if (lsCompanyId) {
        return { data: { user, companyId: lsCompanyId }, error: null };
      }
    } catch {}

    const { data: profile, error } = await supabase
      .from("users_profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!profile?.company_id) return { data: null, error: "Missing company_id in profile" };

    return { data: { user, companyId: profile.company_id }, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}
