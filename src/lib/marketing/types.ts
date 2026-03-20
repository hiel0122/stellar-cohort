/* ── Marketing Dashboard Types ── */
/* 매출/정산/만족도와 완전 분리된 마케팅 전용 타입 */

export interface MarketingLink {
  id: string;
  alias: string;
  channel: MarketingChannel;
  campaign: string;
  destination_url: string;
  short_url: string;
  track_code: string;
  note: string;
  status: "active" | "paused";
  total_clicks: number;
  last_clicked_at: string | null;
  created_at: string;
}

export type MarketingChannel = "카페" | "메일" | "문자" | "카카오" | "기타";
export const CHANNEL_OPTIONS: MarketingChannel[] = ["카페", "메일", "문자", "카카오", "기타"];

export interface ClickEvent {
  id: string;
  link_id: string;
  track_code: string;
  timestamp: string;
  referrer: string;
  user_agent: string;
}

export interface MarketingSettings {
  link24_customer_id: string;
  link24_api_key: string;
  tracking_base_url: string;
}

export interface CreateLinkInput {
  alias: string;
  channel: MarketingChannel;
  campaign: string;
  destination_url: string;
  note?: string;
  short_url: string;
  track_code: string;
}

/** Provider interface – swap localStorage → Supabase later */
export interface MarketingDataProvider {
  createLink(input: CreateLinkInput): MarketingLink;
  listLinks(): MarketingLink[];
  getLink(id: string): MarketingLink | null;
  getLinkByTrackCode(code: string): MarketingLink | null;
  updateLink(id: string, updates: Partial<Pick<MarketingLink, "alias" | "channel" | "campaign" | "note" | "status">>): MarketingLink | null;
  deleteLink(id: string): void;
  recordClick(track_code: string, meta?: { referrer?: string; user_agent?: string }): boolean;
  listClickEvents(linkId?: string): ClickEvent[];
  getSettings(): MarketingSettings | null;
  saveSettings(s: MarketingSettings): void;
}
