// The Supabase API keys that Edge Functions use.
//
// Supabase gives every Edge Function its project's keys in environment variables.
// Newer projects use publishable and secret keys, in SUPABASE_PUBLISHABLE_KEYS and
// SUPABASE_SECRET_KEYS: each is a JSON object of named keys, such as
// {"default": "sb_secret_..."}. Older projects have the legacy anon and service_role
// keys, in SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY, which Supabase is
// retiring. Use the new key when the project has one, and the legacy key otherwise.

function getKey(newKeysVariable: string, legacyVariable: string): string {
  const keys = Deno.env.get(newKeysVariable);
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, string>;
      const key = parsed["default"] ?? Object.values(parsed)[0];
      if (key) return key;
    } catch {
      // Not valid JSON: use the legacy key below.
    }
  }
  return Deno.env.get(legacyVariable) ?? "";
}

// Low privileges; Row Level Security applies. Replaces the legacy anon key.
export const SUPABASE_PUBLISHABLE_KEY = getKey(
  "SUPABASE_PUBLISHABLE_KEYS",
  "SUPABASE_ANON_KEY"
);

// Bypasses Row Level Security: use only inside Edge Functions, never in the browser.
// Replaces the legacy service_role key.
export const SUPABASE_SECRET_KEY = getKey(
  "SUPABASE_SECRET_KEYS",
  "SUPABASE_SERVICE_ROLE_KEY"
);
