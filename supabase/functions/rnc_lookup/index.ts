// Supabase Edge Function: RNC lookup from CSV using secret CLIENTS_RNC_SOURCE_URL
// Deno runtime
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function notFound(msg: string) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { "content-type": "application/json" } });
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), { status: 405, headers: { 'content-type': 'application/json' } });
    }
    const { rnc } = await req.json().catch(() => ({ rnc: null }));
    if (!rnc || typeof rnc !== 'string') return notFound('rnc requerido');

    const url = Deno.env.get('CLIENTS_RNC_SOURCE_URL');
    if (!url) return notFound('CLIENTS_RNC_SOURCE_URL no configurado');

    const res = await fetch(url, { headers: { 'accept': 'text/csv' } });
    if (!res.ok) return notFound('No se pudo descargar la fuente');
    const text = await res.text();

    // Very simple CSV parsing for columns: rnc,nombre_comercial (header included)
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines.shift() || '';
    const cols = header.split(',').map((s) => s.trim().toLowerCase());
    const idxRnc = cols.indexOf('rnc');
    const idxNombre = cols.indexOf('nombre_comercial');
    if (idxRnc === -1 || idxNombre === -1) return notFound('CSV inválido: columnas rnc,nombre_comercial requeridas');

    const needle = rnc.replace(/[^0-9]/g, '');
    for (const line of lines) {
      const parts = line.split(',');
      const rawRnc = (parts[idxRnc] || '').replace(/[^0-9]/g, '');
      if (rawRnc === needle) {
        const nombre = (parts[idxNombre] || '').trim();
        return new Response(JSON.stringify({ success: true, rnc: needle, nombre_comercial: nombre }), {
          headers: { 'content-type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ success: false }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
});
