// The rules for task labels, used by the create-task-with-ai Edge Function.
//
// The AI picks one of the "existing labels" (the default labels plus the labels
// the user has already used) or, if none fits, suggests a new one. This file
// checks the AI's reply before it is saved. It is plain TypeScript (no Deno or
// Node features), so the Jest tests in tests/unit can test it too.

// The labels every user starts with. lib/labels.ts gives them their colours.
export const DEFAULT_LABELS = ["work", "personal", "priority", "shopping", "home"];

// The longest label allowed. supabase/migrations/8_flexible_labels.sql has the
// same limit.
export const MAX_LABEL_LENGTH = 20;

// Lowercase letters and digits, with words separated by one space or hyphen.
// supabase/migrations/8_flexible_labels.sql has the same rule.
const LABEL_FORMAT = /^[a-z0-9]+(?:[ -][a-z0-9]+)*$/;

// Tidy up a label: lowercase, single spaces, no quotes or punctuation at the
// ends, and no "Label:" in front (the AI sometimes adds one).
export function normalizeLabel(raw: string | null | undefined): string {
  let label = (raw ?? "").trim().toLowerCase();
  label = label.replace(/^label\s*:\s*/, "");
  label = label.replace(/_/g, "-");
  label = label.replace(/\s+/g, " ");
  label = label.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  return label;
}

export function isValidLabel(label: string): boolean {
  return label.length <= MAX_LABEL_LENGTH && LABEL_FORMAT.test(label);
}

// The default labels, then the user's own labels, each once, in normalized form.
export function existingLabelList(userLabels: (string | null)[]): string[] {
  const all = [...DEFAULT_LABELS, ...userLabels.map(normalizeLabel)];
  return Array.from(new Set(all.filter((label) => label !== "")));
}

// "homes" -> "home", "boxes" -> "box". Rough, but enough to catch plurals.
function singular(word: string): string {
  if (word.length > 4 && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}

function words(label: string): string[] {
  return label.split(/[ -]/).map(singular);
}

// True if the shorter list of words appears, in order, inside the longer one.
// "my-home" contains "home"; "homework" does not.
function containsWords(longer: string[], shorter: string[]): boolean {
  for (let i = 0; i + shorter.length <= longer.length; i++) {
    if (shorter.every((word, j) => longer[i + j] === word)) return true;
  }
  return false;
}

// Find the existing label that a suggested label merely repeats or rephrases:
// the same label, the same letters ("my home" and "my-home"), a plural
// ("homes"), or the existing label as a whole word inside it ("my-home",
// "home stuff"), or the other way round. Returns null if there is none.
export function findSimilarLabel(label: string, existing: string[]): string | null {
  const squash = (s: string) => words(s).join("");
  const checks = [
    (e: string) => e === label,
    (e: string) => squash(e) === squash(label),
    (e: string) => {
      const [a, b] = [words(label), words(e)];
      return a.length > b.length ? containsWords(a, b) : containsWords(b, a);
    },
  ];
  // Try the strictest check first against every label, then the looser ones.
  for (const check of checks) {
    const match = existing.find(check);
    if (match) return match;
  }
  return null;
}

// Turn the AI's reply into the label to save: an existing label if the reply
// matches or rephrases one, a new label if the reply is a valid new one, or
// null (no label) if the reply is empty or not a valid label.
export function chooseLabel(
  reply: string | null | undefined,
  existing: string[]
): string | null {
  const label = normalizeLabel(reply);
  if (!isValidLabel(label)) return null;
  return findSimilarLabel(label, existing) ?? label;
}
