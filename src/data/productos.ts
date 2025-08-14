import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";

export type Producto = {
  id: string;
  name: string;
  sku?: string | null;
  currency: string;
  unit_price: number;
  itbis_rate: number;
  active: boolean;
  company_id?: string | null;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
};

export type UpsertProductInput = {
  id?: string;
  name: string;
  sku?: string | null;
  currency?: string;
  unit_price: number;
  itbis_rate?: number;
  active?: boolean;
};

export async function upsertProduct(input: UpsertProductInput) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: null as Producto | null, error: ctx.error };

  const payload = {
    ...input,
    currency: input.currency || 'DOP',
    itbis_rate: input.itbis_rate || 0.18,
    active: input.active !== false,
    company_id: ctx.data.companyId,
    owner_user_id: ctx.data.user.id
  };

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return { data: null as Producto | null, error: error.message };
    }

    return { data: data as Producto, error: null };
  } catch (e: any) {
    return { data: null as Producto | null, error: e?.message || 'Error desconocido' };
  }
}

export async function listProductos({ search, activeOnly = true, page = 0, limit = 20 }: {
  search?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: [] as Producto[], error: ctx.error };

  const from = page * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('products')
    .select('*')
    .eq('company_id', ctx.data.companyId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (activeOnly) {
    query = query.eq('active', true);
  }

  if (search) {
    const like = `%${search}%`;
    query = query.or(`name.ilike.${like},sku.ilike.${like}`);
  }

  const { data, error } = await query;
  
  return { 
    data: (data as Producto[]) || [], 
    error: error?.message || null 
  };
}