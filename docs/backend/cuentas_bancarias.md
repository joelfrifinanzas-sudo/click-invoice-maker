# Cuentas bancarias (backend)

Objetivo: almacenar cuentas propias para recibir pagos.

Esquema: public.cuentas_bancarias
- id: bigserial PK
- empresa_id: uuid (scoping multi-empresa)
- banco_id: FK a bancos_rd.id
- banco_nombre: text (denormalizado, se autocompleta)
- tipo: enum ('ahorros'|'corriente'|'cheques')
- alias: text 2–60
- numero: text 6–30 (usar mask(numero) para mostrar)
- moneda: text, default 'DOP'
- activa: boolean, default true
- preferida: boolean, default false
- created_at, updated_at

Reglas/validaciones
- Unicidad: (empresa_id, banco_id, numero)
- Trigger BEFORE INSERT/UPDATE completa banco_nombre desde bancos_rd.
- RLS: solo usuarios de la misma empresa_id (via JWT claim company_id) pueden CRUD y listar.
  - Ajusta la función current_company_id() si usas otro claim.

Endpoints (REST PostgREST)
- Listar activas (orden alias asc):
  GET {SUPABASE_URL}/rest/v1/cuentas_bancarias?select=id,banco_id,banco_nombre,tipo,alias,numero:mask,moneda,preferida&activa=eq.true&order=alias.asc

- Crear (activa por defecto, moneda='DOP'):
  POST {SUPABASE_URL}/rest/v1/cuentas_bancarias
  Prefer: return=representation
  Body:
  {
    "empresa_id": "<uuid_empresa>",
    "banco_id": 1,
    "tipo": "ahorros",
    "alias": "Cuenta principal",
    "numero": "1234567890"
  }
  // banco_nombre se autocompleta

- Editar:
  PATCH {SUPABASE_URL}/rest/v1/cuentas_bancarias?id=eq.<id>
  Body: { "alias": "Cuenta nómina", "activa": false, "tipo": "corriente" }

- Deshabilitar:
  PATCH {SUPABASE_URL}/rest/v1/cuentas_bancarias?id=eq.<id>
  Body: { "activa": false }

GraphQL (pg_graphql)
query {
  cuentasBancariasCollection(
    filter: {activa: {eq: true}},
    orderBy: {alias: AscNullsLast}
  ) {
    edges { node { id bancoId bancoNombre tipo alias numero moneda preferida } }
  }
}

Notas
- Usa la función SQL mask(columna) para exponer solo últimos 4 en listados públicos/UI.
- Si tu claim no es company_id, cambia current_company_id().
- No se fuerza unicidad de preferida; si la necesitas, podemos añadir una exclusión parcial.
