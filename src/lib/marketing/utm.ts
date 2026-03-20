/* ── UTM Parameter Utilities ── */
import type { MarketingChannel } from "./types";
import { CHANNEL_UTM_MAP } from "./types";

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term?: string;
}

export function buildUTMParams(
  channel: MarketingChannel,
  campaign: string,
  alias: string,
  trackCode: string,
  term?: string,
): UTMParams {
  return {
    utm_source: CHANNEL_UTM_MAP[channel] ?? "etc",
    utm_medium: "linktracking",
    utm_campaign: (campaign || "none").trim().replace(/\s+/g, "-"),
    utm_content: alias?.trim() || trackCode,
    ...(term?.trim() ? { utm_term: term.trim() } : {}),
  };
}

/**
 * Appends UTM query params to a URL.
 * Handles existing query strings and hash fragments correctly.
 */
export function appendUTMToUrl(baseUrl: string, params: UTMParams): string {
  try {
    const url = new URL(baseUrl);
    const entries = Object.entries(params).filter(([, v]) => v);
    for (const [key, value] of entries) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    // Fallback for malformed URLs
    const sep = baseUrl.includes("?") ? "&" : "?";
    const qs = Object.entries(params)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");
    return `${baseUrl}${sep}${qs}`;
  }
}
