/* ── localStorage-based MarketingDataProvider ── */
import type { MarketingDataProvider, MarketingLink, ClickEvent, MarketingSettings, CreateLinkInput } from "./types";
import { isBot, simpleFingerprint } from "./dedup";

const LINKS_KEY = "mc_links_v1";
const EVENTS_KEY = "mc_click_events_v1";
const SETTINGS_KEY = "mc_settings_v1";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, val: unknown) {
  localStorage.setItem(key, JSON.stringify(val));
}

function uid(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
}

class LocalMarketingProvider implements MarketingDataProvider {
  /* ── Links ── */
  createLink(input: CreateLinkInput): MarketingLink {
    const links = this.listLinks();
    const link: MarketingLink = {
      id: uid(),
      alias: input.alias,
      channel: input.channel,
      campaign: input.campaign,
      destination_url: input.destination_url,
      short_url: input.short_url,
      track_code: input.track_code,
      note: input.note ?? "",
      status: "active",
      total_clicks: 0,
      last_clicked_at: null,
      created_at: new Date().toISOString(),
      tracked_url: input.tracked_url,
      utm_enabled: input.utm_enabled ?? false,
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      utm_campaign: input.utm_campaign,
      utm_content: input.utm_content,
      utm_term: input.utm_term,
    };
    links.push(link);
    writeJSON(LINKS_KEY, links);
    return link;
  }

  listLinks(): MarketingLink[] {
    return readJSON<MarketingLink[]>(LINKS_KEY, []);
  }

  getLink(id: string): MarketingLink | null {
    return this.listLinks().find((l) => l.id === id) ?? null;
  }

  getLinkByTrackCode(code: string): MarketingLink | null {
    return this.listLinks().find((l) => l.track_code === code) ?? null;
  }

  updateLink(id: string, updates: Partial<MarketingLink>): MarketingLink | null {
    const links = this.listLinks();
    const idx = links.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    links[idx] = { ...links[idx], ...updates };
    writeJSON(LINKS_KEY, links);
    return links[idx];
  }

  deleteLink(id: string): void {
    const links = this.listLinks().filter((l) => l.id !== id);
    writeJSON(LINKS_KEY, links);
    const events = this.listClickEvents().filter((e) => e.link_id !== id);
    writeJSON(EVENTS_KEY, events);
  }

  /* ── Clicks ── */
  recordClick(track_code: string, meta?: { referrer?: string; user_agent?: string }): boolean {
    const links = this.listLinks();
    const link = links.find((l) => l.track_code === track_code);
    if (!link) return false;

    const settings = this.getSettings();
    const ua = meta?.user_agent ?? "";

    // Bot filter
    if (settings?.bot_filter_enabled && isBot(ua)) {
      // Record as deduped bot click
      const events = this.listClickEvents();
      events.push({
        id: uid(),
        link_id: link.id,
        track_code,
        timestamp: new Date().toISOString(),
        referrer: meta?.referrer ?? "",
        user_agent: ua,
        deduped: true,
      });
      writeJSON(EVENTS_KEY, events);
      return false;
    }

    // Dedup check
    const dedupEnabled = settings?.dedup_enabled ?? false;
    const windowSec = link.dedup_window_override ?? settings?.dedup_window_sec ?? 60;

    if (dedupEnabled) {
      const events = this.listClickEvents();
      const now = Date.now();
      const fp = simpleFingerprint(ua);
      const isDup = events.some(
        (e) =>
          e.track_code === track_code &&
          !e.deduped &&
          simpleFingerprint(e.user_agent) === fp &&
          now - new Date(e.timestamp).getTime() < windowSec * 1000,
      );
      if (isDup) {
        events.push({
          id: uid(),
          link_id: link.id,
          track_code,
          timestamp: new Date().toISOString(),
          referrer: meta?.referrer ?? "",
          user_agent: ua,
          deduped: true,
        });
        writeJSON(EVENTS_KEY, events);
        return false;
      }
    }

    // Normal click
    const events = this.listClickEvents();
    events.push({
      id: uid(),
      link_id: link.id,
      track_code,
      timestamp: new Date().toISOString(),
      referrer: meta?.referrer ?? "",
      user_agent: ua,
      deduped: false,
    });
    writeJSON(EVENTS_KEY, events);

    // update link stats
    link.total_clicks += 1;
    link.last_clicked_at = new Date().toISOString();
    const idx = links.findIndex((l) => l.id === link.id);
    links[idx] = link;
    writeJSON(LINKS_KEY, links);
    return true;
  }

  listClickEvents(linkId?: string): ClickEvent[] {
    const all = readJSON<ClickEvent[]>(EVENTS_KEY, []);
    return linkId ? all.filter((e) => e.link_id === linkId) : all;
  }

  /* ── Settings ── */
  getSettings(): MarketingSettings | null {
    return readJSON<MarketingSettings | null>(SETTINGS_KEY, null);
  }

  saveSettings(s: MarketingSettings): void {
    writeJSON(SETTINGS_KEY, s);
  }
}

export const marketingProvider: MarketingDataProvider = new LocalMarketingProvider();
