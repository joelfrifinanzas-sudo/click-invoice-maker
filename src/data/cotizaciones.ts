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
    const { data, error } = await supabase
      .from("cotizaciones")
      .select("*, items:cotizacion_items(*)")
      .eq("public_id", publicId)
      .maybeSingle();
    return { data: (data as any) ?? null, error: error?.message ?? null };
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
