import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import { getCurrentContext } from "@/data/utils";

export type Company = Tables<"companies">;
export type CompanyUpdate = TablesUpdate<"companies">;

export async function getCurrentCompany(): Promise<{ data: Company | null; error: string | null }>{
  try {
    const ctx = await getCurrentContext();
    if (!ctx.data) return { data: null, error: ctx.error };
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", ctx.data.companyId)
      .maybeSingle();
    return { data: (data as Company) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function patchCurrentCompany(patch: Partial<Pick<CompanyUpdate, "name"|"rnc"|"address"|"phone"|"itbis_rate">>): Promise<{ error: string | null }>{
  try {
    const ctx = await getCurrentContext();
    if (!ctx.data) return { error: ctx.error };
    if (!Object.keys(patch).length) return { error: null };
    const { error } = await supabase
      .from("companies")
      .update(patch)
      .eq("id", ctx.data.companyId);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}
