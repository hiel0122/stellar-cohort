/* ── Link24 API wrapper (via Supabase Edge Function proxy) ── */
import { supabase } from "@/integrations/supabase/client";
import type { MarketingSettings } from "./types";

interface ShortenResult {
  short_url: string;
}

/**
 * Link24 단축 링크 생성
 * Edge Function을 통해 CORS 우회 + application/x-www-form-urlencoded 포맷 전송
 */
export async function createShortLink(
  trackingUrl: string,
  settings: MarketingSettings,
): Promise<ShortenResult> {
  const { link24_customer_id, link24_api_key } = settings;
  if (!link24_customer_id || !link24_api_key) {
    throw new Error("Link24 API 설정이 필요합니다.");
  }

  const { data, error } = await supabase.functions.invoke("link24-shoturl", {
    body: {
      customer_id: link24_customer_id,
      api_key: link24_api_key,
      org_url: trackingUrl,
    },
  });

  if (error) {
    throw new Error(`Link24 프록시 오류: ${error.message}`);
  }

  if (!data || data.error) {
    throw new Error(data?.error || "Link24 API 오류: 알 수 없는 응답");
  }

  const short_url: string = data.url ?? data.short_url ?? data.shortUrl ?? "";
  if (!short_url) throw new Error("Link24 응답에서 short_url을 찾을 수 없습니다.");
  return { short_url };
}
