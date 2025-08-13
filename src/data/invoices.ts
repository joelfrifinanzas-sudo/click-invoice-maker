import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { getCurrentContext } from "./utils";

export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type Payment = Tables<"payments">;

export type CreateDraftInvoiceInput = {
  items: Array<{
    product_id?: string | null;
    description?: string | null;
    quantity: number;
    unit_price: number;
    itbis_rate?: number | null;
  }>;
  itbis_rate?: number; // default 0.18
  cliente_id?: string | null; // optional: link invoice to a client (clients.id)
};

export async function createDraftInvoice(input: CreateDraftInvoiceInput): Promise<{ data: { invoice: Invoice; items: InvoiceItem[] } | null; error: string | null }> {
  try {
    const ctx = await getCurrentContext();
    if (!ctx.data) return { data: null, error: ctx.error };

    // 1) Create invoice
    const invoicePayload: TablesInsert<"invoices"> = {
      owner_user_id: ctx.data.user.id,
      company_id: ctx.data.companyId,
      status: "pendiente",
      itbis_rate: input.itbis_rate ?? 0.18,
      cliente_id: input.cliente_id ?? null,
    } as any;

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert(invoicePayload)
      .select("*")
      .maybeSingle();

    if (invErr || !inv) return { data: null, error: invErr?.message ?? "Failed to create invoice" };

    // 2) Insert items
    const itemsPayload: TablesInsert<"invoice_items">[] = input.items.map((it) => ({
      invoice_id: inv.id,
      product_id: it.product_id ?? null,
      description: it.description ?? null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      itbis_rate: it.itbis_rate ?? inv.itbis_rate,
    })) as any;

    const { data: items, error: itemsErr } = await supabase
      .from("invoice_items")
      .insert(itemsPayload)
      .select("*");

    if (itemsErr) return { data: null, error: itemsErr.message };

    return { data: { invoice: inv as Invoice, items: (items ?? []) as InvoiceItem[] }, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function addPayment(params: { invoiceId: string; amount: number; method?: string | null; notes?: string | null }): Promise<{ data: Payment | null; error: string | null }> {
  try {
    const { invoiceId, amount, method, notes } = params;
    // Insert payment (owner_user_id auto-filled via trigger if omitted)
    const { data, error } = await supabase
      .from("payments")
      .insert({ invoice_id: invoiceId, amount, method: method ?? null, notes: notes ?? null } as TablesInsert<"payments">)
      .select("*")
      .maybeSingle();

    return { data: data ?? null, error: error?.message ?? null };
  } catch (e: any) {
    return { data: null, error: e?.message ?? "Unknown error" };
  }
}

export async function cancelInvoice(invoiceId: string): Promise<{ error: string | null }>{
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ status: 'anulada' } as TablesInsert<'invoices'>)
      .eq('id', invoiceId);
    return { error: error?.message ?? null };
  } catch (e: any) {
    return { error: e?.message ?? 'Unknown error' };
  }
}
