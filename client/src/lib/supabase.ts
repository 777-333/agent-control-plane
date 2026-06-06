import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Browser Supabase client (email/password + OAuth providers).
 * Falls back to harmless placeholder values when not configured so the module
 * import never throws; UI guards on `isSupabaseConfigured`.
 */
export const supabase = createClient(
  supabaseUrl ?? "http://localhost",
  supabaseAnonKey ?? "public-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Exchange the current Supabase access token for the app's httpOnly session
 * cookie. Must be called after every successful Supabase sign-in.
 */
export async function establishServerSession(accessToken: string): Promise<void> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ accessToken }),
  });

  if (!response.ok) {
    throw new Error("Serversitzung konnte nicht erstellt werden.");
  }
}
