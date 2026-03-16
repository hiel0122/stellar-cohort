/**
 * PII masking utilities for satisfaction analysis
 */

/** Mask name: keep first char, replace rest with * */
export function maskName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 1) return trimmed;
  return trimmed[0] + "*".repeat(trimmed.length - 1);
}

/** Mask email: a***@domain.com */
export function maskEmail(email: string): string {
  const idx = email.indexOf("@");
  if (idx <= 0) return "***";
  return email[0] + "***" + email.slice(idx);
}
