/* ── Click Deduplication Utilities ── */

const BOT_PATTERNS = [
  "bot", "crawler", "spider", "slackbot", "discordbot",
  "facebookexternalhit", "kakaotalk", "telegrambot",
  "whatsapp", "linkedinbot", "googlebot", "bingbot",
  "yandexbot", "baiduspider", "duckduckbot", "twitterbot",
  "applebot", "semrushbot", "ahrefsbot",
];

export function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some((p) => ua.includes(p));
}

/**
 * Simple fingerprint from IP + UA for dedup (client-side fallback).
 * In production, use sha256 on the server side.
 */
export function simpleFingerprint(ua: string): string {
  // Simple hash for localStorage-based dedup
  let hash = 0;
  const str = ua || "unknown";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
