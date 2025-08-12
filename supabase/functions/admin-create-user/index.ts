// Admin Create User Edge Function
// Accepts POST { email, password, role }
// Creates a Supabase auth user with email confirmed and stores role in user_metadata

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for browser access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Allowed app roles for new users
const ALLOWED_ROLES = ["admin", "supervisor", "cajera"] as const;

type AllowedRole = typeof ALLOWED_ROLES[number];

type CreateUserPayload = {
  email?: string;
  password?: string;
  role?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function isValidEmail(email: string) {
  // Basic RFC2822-like email check
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing Supabase configuration on server" }, 500);
  }

  let payload: CreateUserPayload;
  try {
    payload = await req.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const email = (payload.email || "").trim().toLowerCase();
  const password = payload.password || "";
  const role = (payload.role || "").trim().toLowerCase();

  // Validate inputs
  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: "Email inválido" }, 400);
  }
  if (!password || password.length < 8) {
    return jsonResponse({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
  }
  if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
    return jsonResponse({ error: `Rol inválido. Permitidos: ${ALLOWED_ROLES.join(", ")}` }, 400);
  }

  // Admin client for privileged operations
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Create user with email confirmed and role in user_metadata
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });

  if (error) {
    // Forward Supabase error details; map status when available
    const status = (error as any).status || 500;
    return jsonResponse({ error: error.message || "No se pudo crear el usuario" }, status);
  }

  if (!data?.user?.id) {
    return jsonResponse({ error: "Respuesta inesperada del servidor" }, 500);
  }

  return jsonResponse({ success: true, userId: data.user.id }, 200);
});
