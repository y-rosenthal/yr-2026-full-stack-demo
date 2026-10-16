// The Supabase API keys that Edge Functions use.
//
// Supabase gives every Edge Function its project's keys in two environment
// variables, SUPABASE_PUBLISHABLE_KEYS and SUPABASE_SECRET_KEYS. Each holds a
// JSON object of named keys, such as {"default": "sb_secret_..."}: a project can
// have several keys of each kind, and a new project has one of each, named
// "default".

function getKey(variable: string): string {
  let keys: Record<string, string> = {};
  try {
    keys = JSON.parse(Deno.env.get(variable) ?? "{}");
  } catch {
    // Not valid JSON: reported below.
  }
  const key = keys["default"] ?? Object.values(keys)[0];
  if (!key) {
    throw new Error(
      `No Supabase key found in ${variable}. Check Project Settings > API Keys in the Supabase dashboard.`
    );
  }
  return key;
}

// Low privileges; Row Level Security applies.
export const SUPABASE_PUBLISHABLE_KEY = getKey("SUPABASE_PUBLISHABLE_KEYS");

// Bypasses Row Level Security: use only inside Edge Functions, never in the browser.
export const SUPABASE_SECRET_KEY = getKey("SUPABASE_SECRET_KEYS");
