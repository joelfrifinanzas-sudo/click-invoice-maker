import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

type Action = "precheck" | "record";

interface Payload {
  action: Action;
  email: string;
  success?: boolean;
}

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = (await req.json()) as Payload;
    const ip = clientIp(req);
    const email = (body.email || "").toLowerCase();

    if (!email) {
      return new Response(JSON.stringify({ error: "email requerido" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    if (body.action === "precheck") {
      const { data, error } = await supabase.rpc("auth_rate_limit_check", {
        _email: email,
        _ip: ip,
        _window_mins: 15,
        _max_attempts: 5,
      });
      if (error) throw error;
      const res = Array.isArray(data) && data[0] ? data[0] : { blocked: false, failures: 0, retry_after_seconds: 0 };
      return new Response(
        JSON.stringify({
          blocked: !!res.blocked,
          failures: res.failures ?? 0,
          retryAfterSeconds: res.retry_after_seconds ?? 0,
          captchaRequired: !!res.blocked,
        }),
        { status: 200, headers: { "content-type": "application/json", ...corsHeaders } }
      );
    }

    if (body.action === "record") {
      const ok = !!body.success;
      const { error } = await supabase.rpc("auth_log_attempt", {
        _email: email,
        _ip: ip,
        _ok: ok,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "action inválida" }), {
      status: 400,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  } catch (e: any) {
    console.error("login-guard error", e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders },
    });
  }
});
