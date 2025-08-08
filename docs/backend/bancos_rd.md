# Catálogo de bancos RD (backend)

Objetivo: tabla/colección editable `bancos_rd` para entidades bancarias de RD.

Esquema (public.bancos_rd):
- id: bigserial PK
- nombre: text, requerido, único (case-insensitive), 1..120
- codigo: text, opcional, único si se provee
- activo: boolean, default true
- created_at, updated_at: timestamptz

Seguridad (RLS):
- Lectura: cualquiera puede SELECT, pero solo filas activo = true
- CRUD: solo admin (JWT claim role = 'admin')

Semilla inicial (editable):
Banreservas, Banco Popular, Banco BHD, Banco Santa Cruz, Banco Caribe, Scotiabank RD, Banco Promerica, Banco Ademi, Banco BDI, Banco Vimenca, APAP, ACAP, La Nacional.

Listar bancos activos en orden alfabético
- REST (PostgREST):
  GET {SUPABASE_URL}/rest/v1/bancos_rd?select=id,nombre,codigo&order=nombre.asc
  - Devuelve solo activos por RLS.

- GraphQL (pg_graphql):
  query {
    bancosRdCollection(filter: {activo: {eq: true}}, orderBy: {nombre: AscNullsLast}) {
      edges { node { id nombre codigo } }
    }
  }

CRUD (admin)
- Crear:
  POST {SUPABASE_URL}/rest/v1/bancos_rd
  Headers: Prefer: return=representation
  Body: { "nombre": "Banco Nuevo", "codigo": "BNV", "activo": true }

- Actualizar:
  PATCH {SUPABASE_URL}/rest/v1/bancos_rd?id=eq.<id>
  Body: { "activo": false, "codigo": "BNV" }

- Eliminar:
  DELETE {SUPABASE_URL}/rest/v1/bancos_rd?id=eq.<id>

Notas
- La lista pública ya sale filtrada por activos vía RLS.
- Si usas un modelo de roles distinto, ajusta la política en la migración (auth.jwt()).
- Para performance y unicidad se usa lower(nombre).
