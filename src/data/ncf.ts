import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";
import type { NCFType } from "@/utils/ncfGenerator";

export async function getNextNCF(ncfType: NCFType): Promise<{ data: string | null; error: string | null }>{
  try {
    if (ncfType === 'NONE') return { data: null, error: null };
    const ctx = await getCurrentContext();
    if (!ctx.data) return { data: null, error: ctx.error };
    const { data, error } = await supabase.rpc('next_ncf', { _company_id: ctx.data.companyId, _ncf_type: ncfType });
    return { data: (data as string) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? 'Unknown error' };
  }
}
