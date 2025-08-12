import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getCurrentContext } from "./utils";

export type Customer = Tables<"customers">;
export type CustomerInsert = TablesInsert<"customers">;
export type CustomerUpdate = TablesUpdate<"customers">;

export async function listCustomers(params?: { search?: string; limit?: number }): Promise<{ data: Customer[] | null; error: string | null }> {
  try {
    const ctx = await getCurrentContext();
    const companyId = ctx.data?.companyId ?? null;

    if (!companyId) {
      // Sin contexto de empresa, no retornar datos para evitar mezclar empresas
      return { data: [], error: null };
    }

    // Marcar clientes que también son usuarios internos (best-effort, no bloquea)
    try {
      await supabase.rpc('mark_customers_as_users', { _company_id: companyId });
    } catch {}

    let query = supabase
      .from("customers")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (params?.search?.trim()) {
      const term = params.search.trim();
      query = query.or(`name.ilike.%${term}%,rnc.ilike.%${term}%,phone.ilike.%${term}%`);
    }
    if (params?.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    return { data: data ?? [], error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function getCustomerById(id: string): Promise<{ data: Customer | null; error: string | null }> {
  try {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    return { data: data ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function upsertCustomer(input: Partial<CustomerInsert & CustomerUpdate> & { id?: string }): Promise<{ data: Customer | null; error: string | null }> {
  try {
    // Ensure owner_user_id and company_id
    const ctx = await getCurrentContext();
    if (!ctx.data || !ctx.data.companyId) return { data: null, error: "Completa empresa" };

    const payload: CustomerInsert & Partial<CustomerUpdate> = {
      name: input.name ?? "",
      currency: input.currency ?? "DOP",
      itbis_rate: input.itbis_rate ?? 0.18,
      owner_user_id: input.owner_user_id ?? ctx.data.user.id,
      company_id: input.company_id ?? ctx.data.companyId,
      email: input.email ?? null as any,
      phone: input.phone ?? null as any,
      address: input.address ?? null as any,
      rnc: input.rnc ?? null as any,
      ...(input.id ? { id: input.id } : {}),
    } as any;

    const { data, error } = await supabase.from("customers").upsert(payload).select("*").maybeSingle();
    return { data: data ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}
