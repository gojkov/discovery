import type { TasteRule } from "@/taste-rules";

/** Lowercase, collapse separators/whitespace. Shared by scoring + profile. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[&,+/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a (possibly multi-) artist string into normalized component names. */
export function artistParts(artist: string): string[] {
  const whole = normalize(artist);
  return Array.from(
    new Set([
      whole,
      ...artist
        .split(/&|,|\/|\band\b|\bfeat\.?\b|\bx\b/i)
        .map(normalize)
        .filter(Boolean)
    ])
  );
}

/** All phrases a rule can match (its phrase + aliases), normalized. */
export function rulePhrases(rule: TasteRule): string[] {
  return [rule.phrase, ...(rule.aliases ?? [])].map(normalize);
}

/** Does the (already-normalized) text contain any of the rule's phrases? */
export function matchesRule(normalizedText: string, rule: TasteRule): boolean {
  return rulePhrases(rule).some((phrase) => normalizedText.includes(phrase));
}

/** Tolerant tag parser: accepts a JSON array, a CSV string, or a real array. */
export function parseTags(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // not JSON — fall through to CSV handling
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
