import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getCurrentContext } from "./utils";

export type Product = Tables<"products">;
export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;

export async function listProducts(params?: { search?: string; limit?: number; activeOnly?: boolean }): Promise<{ data: Product[] | null; error: string | null }> {
  try {
    const query = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (params?.search) query.ilike("name", `%${params.search}%`);
    if (params?.activeOnly) query.eq("active", true);
    if (params?.limit) query.limit(params.limit);
    const { data, error } = await query;
    return { data: data ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function upsertProduct(input: Partial<ProductInsert & ProductUpdate> & { id?: string }): Promise<{ data: Product | null; error: string | null }> {
  try {
    const ctx = await getCurrentContext();
    if (!ctx.data) return { data: null, error: ctx.error };

    const payload: ProductInsert & Partial<ProductUpdate> = {
      name: input.name ?? "",
      currency: input.currency ?? "DOP",
      itbis_rate: input.itbis_rate ?? 0.18,
      unit_price: input.unit_price ?? 0,
      active: input.active ?? true,
      owner_user_id: input.owner_user_id ?? ctx.data.user.id,
      company_id: input.company_id ?? ctx.data.companyId,
      sku: input.sku ?? null as any,
      ...(input.id ? { id: input.id } : {}),
    } as any;

    const { data, error } = await supabase.from("products").upsert(payload).select("*").maybeSingle();
    return { data: data ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}
