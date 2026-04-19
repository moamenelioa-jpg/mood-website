import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key for privileged ops
export function getSupabaseServer(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Supabase URL is not set (NEXT_PUBLIC_SUPABASE_URL)");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// Public client (optional, for future client-side usage)
export function getSupabasePublic(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  if (!anonKey) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set");

  return createClient(url, anonKey, {
    auth: { persistSession: true },
  });
}

export function getSupabaseBucket(): string {
  return process.env.SUPABASE_BUCKET || "assets";
}
