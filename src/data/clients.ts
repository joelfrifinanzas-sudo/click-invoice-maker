import { supabase } from "@/integrations/supabase/client";
import { getCurrentContext } from "@/data/utils";

export type ClientType = "Empresarial" | "Individuo";

// Legacy Client type preserved for UI compatibility
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

// Canonical row from public.clients
type CanonicalClient = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company_id: string;
  created_by: string;
  status: string;
  archived: boolean;
  created_at: string;
};

function mapCanonicalToClient(row: CanonicalClient): Client {
  return {
    id: row.id,
    created_at: row.created_at,
    tipo_cliente: "Individuo",
    saludo: null,
    nombre_pila: null,
    apellido: null,
    nombre_empresa: null,
    nombre_visualizacion: row.name,
    email: row.email,
    telefono_laboral: null,
    telefono_movil: row.phone,
    pais_tel: "DO",
    documento: null,
    es_contribuyente: false,
    notas: null,
    tenant_id: row.company_id,
    activo: row.status === "active" && !row.archived,
  };
}

export async function listClients({ search = "", page = 1, pageSize = 20 }: ListClientsParams) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: [] as Client[], total: 0, error: ctx.error };
  const { companyId } = ctx.data;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .range(from, to);

  const term = search.trim();
  if (term) {
    const like = `%${term}%`;
    query = query.or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`);
  }

  const { data, error, count } = await query;
  const mapped = ((data as CanonicalClient[]) || []).map(mapCanonicalToClient);
  return { data: mapped, total: count || 0, error: error?.message || null };
}

export async function getClientById(id: string) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  const mapped = data ? mapCanonicalToClient(data as CanonicalClient) : null;
  return { data: mapped, error: error?.message || null };
}

export type UpsertClientInput = Partial<Omit<Client, "tenant_id" | "created_at">> & {
  id?: string;
};

export async function upsertClient(input: UpsertClientInput) {
  const ctx = await getCurrentContext();
  if (!ctx.data) return { data: null as Client | null, error: ctx.error };

  const isUpdate = !!input.id;
  if (isUpdate) {
    const updatePayload: Partial<CanonicalClient> = {};
    if (input.nombre_visualizacion) updatePayload.name = input.nombre_visualizacion;
    if (typeof input.activo === "boolean") {
      updatePayload.status = input.activo ? "active" : "inactive";
      // keep archived as-is unless explicitly provided via notas toggle (not present)
    }
    if (input.email !== undefined) updatePayload.email = input.email ?? null;
    const phone = input.telefono_movil || input.telefono_laboral;
    if (phone !== undefined) updatePayload.phone = phone ?? null;

    const { data, error } = await supabase
      .from("clients")
      .update(updatePayload)
      .eq("id", input.id as string)
      .select("*")
      .maybeSingle();

    if (error || !data) return { data: null, error: error?.message || "No se pudo actualizar" };
    return { data: mapCanonicalToClient(data as CanonicalClient), error: null };
  }

  // Insert
  const name =
    input.nombre_visualizacion?.trim() ||
    input.nombre_empresa?.trim() ||
    `${(input.nombre_pila || "").trim()} ${(input.apellido || "").trim()}`.trim() ||
    "Cliente";
  const phone = input.telefono_movil || input.telefono_laboral || null;

  const insertPayload = {
    company_id: ctx.data.companyId,
    created_by: ctx.data.user.id,
    name,
    email: input.email ?? null,
    phone,
    status: input.activo === false ? "inactive" : "active",
    archived: false,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(insertPayload)
    .select("*")
    .maybeSingle();

  if (error || !data) return { data: null, error: error?.message || "No se pudo crear" };
  return { data: mapCanonicalToClient(data as CanonicalClient), error: null };
}
