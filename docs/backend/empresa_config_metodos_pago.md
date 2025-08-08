# Configurar métodos de pago por empresa

Campo agregado: empresa_config.metodos_pago (jsonb)
- Estructura: { "visa": bool, "mastercard": bool, "transferencia": bool, "paypal": bool, "otros": bool }
- Defaults: transferencia=true; los demás=false
- Validación: solo esas 5 llaves, tipos booleanos

REST (PostgREST)
- Obtener configuración
  GET {SUPABASE_URL}/rest/v1/empresa_config?select=id,metodos_pago&<filtro de empresa>

- Actualizar (enviar el objeto completo actualizado)
  PATCH {SUPABASE_URL}/rest/v1/empresa_config?id=eq.<id>
  Prefer: return=representation
  Body:
  {
    "metodos_pago": {
      "visa": true,
      "mastercard": false,
      "transferencia": true,
      "paypal": false,
      "otros": false
    }
  }

Supabase JS (merge seguro)
```ts
// Leer actual
const { data: rows } = await supabase
  .from('empresa_config')
  .select('id, metodos_pago')
  .eq('id', empresaConfigId)
  .single();

const mp = rows.metodos_pago || {};
mp.visa = true; // toggle deseado

await supabase
  .from('empresa_config')
  .update({ metodos_pago: mp })
  .eq('id', empresaConfigId);
```

GraphQL (pg_graphql)
- Query
```graphql
query {
  empresaConfigCollection {
    edges { node { id metodosPago } }
  }
}
```
- Update (si tienes mutations activadas vía Graphile/pg_graphql): ajusta según tu setup. Con REST es lo recomendado.

Notas
- La columna se expone automáticamente por REST/GraphQL.
- La validación garantiza llaves válidas y tipo booleano.
- Si necesitas toggling puntual vía RPC, podemos añadir una función SQL que use jsonb_set.
