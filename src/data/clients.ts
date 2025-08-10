import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";

export type ClientType = "Empresarial" | "Individuo";

export type Client = {
  id: string;
  created_at: string;
  tipo_cliente: ClientType;
  saludo: string | null;
  nombre_pila: string | null;
  apellido: string | null;
  nombre_empresa: string | null;
  nombre_visualizacion: string;
  email: string | null;
  telefono_laboral: string | null;
  telefono_movil: string | null;
  pais_tel: string;
  documento: string | null;
  es_contribuyente: boolean;
  notas: string | null;
  tenant_id: string;
  activo: boolean;
};

export type ListClientsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export async function listClients({ search = "", page = 1, pageSize = 20 }: ListClientsParams) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: [] as Client[], total: 0, error: ctx.error };
  const { companyId } = ctx.data;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("tenant_id", companyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(
      `nombre_visualizacion.ilike.${like},documento.ilike.${like},email.ilike.${like}`
    );
  }

  const { data, error, count } = await query;
  return { data: (data as Client[]) || [], total: count || 0, error: error?.message || null };
}

export async function getClientById(id: string) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return { data: data as Client | null, error: error?.message || null };
}

export type UpsertClientInput = Partial<Omit<Client, "tenant_id" | "created_at">> & {
  id?: string;
};

export async function upsertClient(input: UpsertClientInput) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: null as Client | null, error: ctx.error };
  const payload = { ...input, tenant_id: ctx.data.companyId } as any;

  const { data, error } = await supabase.rpc("upsert_client", { payload });
  return { data: (data as Client) || null, error: error?.message || null };
}
