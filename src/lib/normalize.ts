/**
 * Weak normalization for duplicate detection.
 * Display values are kept as-is (only trimmed).
 * normalizedKey is used solely for duplicate comparison.
 */

export function normalizeWeak(text: string): string {
  return text
    // Replace unicode whitespace (nbsp etc.) with regular space
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    // Trim
    .trim()
    // Collapse multiple spaces into one
    .replace(/\s{2,}/g, " ")
    // Lowercase for comparison
    .toLowerCase();
}

/**
 * Clean display name: trim + collapse internal spaces only.
 */
export function cleanDisplayName(text: string): string {
  return text
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, " ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

/**
 * Find an existing item by normalized key match.
 * Returns the original display value if found, null otherwise.
 */
export function findByNormalizedKey(
  input: string,
  existingValues: string[]
): string | null {
  const inputKey = normalizeWeak(input);
  if (!inputKey) return null;
  for (const val of existingValues) {
    if (normalizeWeak(val) === inputKey) return val;
  }
  return null;
}
