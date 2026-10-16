/**
 * Supabase admin client using the service-role key.
 * SERVER-ONLY — never import this in any client component or expose to browser.
 * Used for admin operations that bypass Row Level Security.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Throw at module load time if env is missing – catches misconfiguration early
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export function createAdminClient() {
  return supabaseAdmin;
}
