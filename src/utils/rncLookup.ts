import { supabase } from "@/integrations/supabase/client";

const CACHE_KEY = "rnc_cache_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function loadCache(): Record<string, { name: string; ts: number }> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    // Purge expired
    Object.keys(parsed).forEach((k) => {
      if (!parsed[k] || typeof parsed[k].ts !== 'number' || now - parsed[k].ts > CACHE_TTL_MS) delete parsed[k];
    });
    return parsed;
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, { name: string; ts: number }>) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

export async function lookupRncName(rnc: string): Promise<{ name: string | null; fromCache: boolean }> {
  const key = (rnc || '').replace(/[^0-9]/g, '');
  if (!key) return { name: null, fromCache: false };

  const cache = loadCache();
  if (cache[key]) {
    return { name: cache[key].name || null, fromCache: true };
  }

  // Call Supabase Edge Function (requires secret CLIENTS_RNC_SOURCE_URL configured)
  try {
    const { data, error } = await supabase.functions.invoke('rnc_lookup', { body: { rnc: key } });
    if (error) throw error;
    const name = (data as any)?.nombre_comercial || null;
    const newCache = { ...cache, [key]: { name: name || '', ts: Date.now() } };
    saveCache(newCache);
    return { name, fromCache: false };
  } catch {
    // Fail silently; allow manual entry
    return { name: null, fromCache: false };
  }
}
