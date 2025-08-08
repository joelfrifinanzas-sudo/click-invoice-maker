# Verificación rápida del campo `notas` (Supabase)

Este documento sirve para verificar que el campo `notas` persiste vía API REST (PostgREST) y GraphQL.

Requisitos:
- Proyecto conectado a Supabase
- URL del proyecto: https://<PROJECT_REF>.supabase.co
- Clave anon o service role para pruebas locales

## REST (PostgREST)

1) Crear factura con `notas` (reemplaza la ruta por `invoices` o `facturas` según tu tabla)

curl -X POST \
  "https://<PROJECT_REF>.supabase.co/rest/v1/invoices" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "numero": "FAC-0014",
    "total": 1500.00,
    "cliente_id": "<UUID_CLIENTE>",
    "notas": "Entrega parcial, restante en 7 días."
  }'

2) Obtener factura (debe incluir `notas`)

curl -X GET \
  "https://<PROJECT_REF>.supabase.co/rest/v1/invoices?select=*&numero=eq.FAC-0014" \
  -H "apikey: <ANON_KEY>" \
  -H "Authorization: Bearer <ANON_KEY>"

## GraphQL (pg_graphql)

POST https://<PROJECT_REF>.supabase.co/graphql/v1

Headers:
- apikey: <ANON_KEY>
- Authorization: Bearer <ANON_KEY>

Mutation de ejemplo:

mutation InsertFactura {
  insertIntoinvoicesCollection(objects: { numero: "FAC-0015", total: 2500.0, cliente_id: "<UUID_CLIENTE>", notas: "Factura con observaciones." }) {
    records { id numero total notas }
  }
}

Query de ejemplo:

query GetFactura {
  invoicesCollection(filter: { numero: { eq: "FAC-0015" } }) {
    edges { node { id numero total notas } }
  }
}

Notas:
- RLS puede requerir políticas adecuadas para insertar/leer.
- Si usas la tabla `facturas`, reemplaza `invoices` por `facturas` en los ejemplos.
