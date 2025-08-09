import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getCurrentContext } from "./utils";

export type Customer = Tables<"customers">;
export type CustomerInsert = TablesInsert<"customers">;
export type CustomerUpdate = TablesUpdate<"customers">;

export async function listCustomers(params?: { search?: string; limit?: number }): Promise<{ data: Customer[] | null; error: string | null }> {
  try {
    const query = supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (params?.search) {
      query.ilike("name", `%${params.search}%`);
    }
    if (params?.limit) {
      query.limit(params.limit);
    }
    const { data, error } = await query;
    return { data: data ?? null, error: error?.message ?? null };
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
    if (!ctx.data) return { data: null, error: ctx.error };

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
