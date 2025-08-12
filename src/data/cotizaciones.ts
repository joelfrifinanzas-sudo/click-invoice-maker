import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { getCurrentContext } from "./utils";

export type Cotizacion = Tables<"cotizaciones">;
export type CotizacionItem = Tables<"cotizacion_items">;

export type CotizacionInsert = TablesInsert<"cotizaciones">;
export type CotizacionUpdate = TablesUpdate<"cotizaciones">;

export async function createCotizacionDraft(input: Partial<CotizacionInsert>): Promise<{ data: Cotizacion | null; error: string | null }> {
  try {
    const ctx = await getCurrentContext();
    if (!ctx.data) return { data: null, error: ctx.error };

    const payload: CotizacionInsert = {
      company_id: input.company_id ?? ctx.data.companyId,
      customer_id: input.customer_id ?? null as any,
      fecha: input.fecha ?? (new Date().toISOString().slice(0, 10) as any),
      vence_el: input.vence_el ?? null as any,
      moneda: input.moneda ?? "DOP",
      itbis_rate: input.itbis_rate ?? 0.18,
      tipo_descuento: input.tipo_descuento ?? ("none" as any),
      valor_descuento: input.valor_descuento ?? 0,
      notas: input.notas ?? null as any,
      terminos: input.terminos ?? null as any,
      estado: input.estado ?? ("borrador" as any),
      number: input.number ?? null as any,
    } as any;

    const { data, error } = await supabase
      .from("cotizaciones")
      .insert(payload)
      .select("*")
      .maybeSingle();

    return { data: (data as Cotizacion) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function upsertCotizacionItems(cotizacionId: string, items: Array<Partial<CotizacionItem> & { nombre: string; qty: number; precio_unitario: number; itbis_rate?: number }>): Promise<{ error: string | null }> {
  try {
    // Simplest approach: delete existing items and reinsert
    const { error: delErr } = await supabase.from("cotizacion_items").delete().eq("cotizacion_id", cotizacionId);
    if (delErr) return { error: delErr.message };

    if (!items.length) return { error: null };

    const payload = items.map((it) => ({
      cotizacion_id: cotizacionId,
      product_id: it.product_id ?? null,
      nombre: it.nombre,
      qty: it.qty,
      precio_unitario: it.precio_unitario,
      itbis_rate: it.itbis_rate ?? 0.18,
    })) as any[];

    const { error } = await supabase.from("cotizacion_items").insert(payload);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}

export async function getCotizacionTotals(id: string): Promise<{ data: { neto: number; itbis: number; total: number } | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from("v_cotizacion_totales")
      .select("neto,itbis,total")
      .eq("cotizacion_id", id)
      .maybeSingle();
    return { data: (data as any) ?? { neto: 0, itbis: 0, total: 0 }, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function sendCotizacion(id: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc("cotizacion_send", { _id: id });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}

export async function getCotizacionByPublicId(publicId: string): Promise<{ data: (Cotizacion & { items: CotizacionItem[] }) | null; error: string | null }> {
  try {
    // Use secure RPC that fetches only the requested quote and its items
    const { data, error } = await (supabase as any).rpc("cotizacion_public_get", { _public_id: publicId });
    if (error) return { data: null, error: error.message };
    if (!data || Object.keys(data || {}).length === 0) return { data: null, error: null };

    // data is JSONB: remove hidden fields already handled in SQL; coerce to expected shape
    const items = (data.items as any[]) ?? [];
    const { items: _omit, ...rest } = data as any;
    return { data: { ...(rest as Cotizacion), items: items as CotizacionItem[] } as any, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function markCotizacionViewed(publicId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.rpc("cotizacion_mark_viewed", { _public_id: publicId });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}

export async function acceptCotizacionPublic(publicId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await (supabase as any).rpc("cotizacion_public_accept", { _public_id: publicId });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}

export async function rejectCotizacionPublic(publicId: string, motivo: string): Promise<{ error: string | null }> {
  try {
    const { error } = await (supabase as any).rpc("cotizacion_public_reject", { _public_id: publicId, _motivo: motivo });
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? "Unknown error" };
  }
}

export async function duplicateCotizacion(id: string): Promise<{ data: string | null; error: string | null }> {
  try {
    const { data, error } = await (supabase as any).rpc("cotizacion_duplicate", { _id: id });
    return { data: (data as any) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function convertCotizacionToInvoice(id: string): Promise<{ data: string | null; error: string | null }> {
  try {
    const { data, error } = await (supabase as any).rpc("cotizacion_convert_to_invoice", { _id: id });
    return { data: (data as any) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function listCotizaciones(params?: { estado?: string; from?: string; to?: string; customerId?: string; search?: string; limit?: number }): Promise<{ data: Cotizacion[] | null; error: string | null }>{
  try {
    let query = supabase.from("cotizaciones").select("*").order("created_at", { ascending: false });
    if (params?.estado) query = query.eq("estado", params.estado as any);
    if (params?.customerId) query = query.eq("customer_id", params.customerId);
    if (params?.from) query = query.gte("fecha", params.from);
    if (params?.to) query = query.lte("fecha", params.to);
    if (params?.limit) query = query.limit(params.limit);
    if (params?.search) query = query.ilike("number", `%${params.search}%`);
    const { data, error } = await query;
    return { data: (data as any) ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}
