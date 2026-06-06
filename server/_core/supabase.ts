import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ENV } from "./env";

let _client: SupabaseClient | null = null;

/**
 * Server-side Supabase client used to verify access tokens during login.
 * Prefers the service-role key (server-only); falls back to the anon key,
 * which is sufficient for `auth.getUser(token)`.
 *
 * Returns null when Supabase is not configured (e.g. local dev without auth).
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (_client) return _client;

  const key = ENV.supabaseServiceRoleKey || ENV.supabaseAnonKey;
  if (!ENV.supabaseUrl || !key) {
    return null;
  }

  _client = createClient(ENV.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _client;
}
