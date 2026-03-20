/* ── Link24 API wrapper ── */
import type { MarketingSettings } from "./types";

interface ShortenResult {
  short_url: string;
}

/**
 * Link24 단축 링크 생성
 * org_url에는 최종 URL이 아닌 우리 트래킹 URL을 넣는다.
 */
export async function createShortLink(
  trackingUrl: string,
  settings: MarketingSettings,
): Promise<ShortenResult> {
  const { link24_customer_id, link24_api_key } = settings;
  if (!link24_customer_id || !link24_api_key) {
    throw new Error("Link24 API 설정이 필요합니다.");
  }

  const res = await fetch("https://www.link24.kr/api/v1/shorten", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Customer-Id": link24_customer_id,
      "X-Api-Key": link24_api_key,
    },
    body: JSON.stringify({ org_url: trackingUrl }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Link24 API 오류 (${res.status}): ${text}`);
  }

  const data = await res.json();
  // Link24 응답 형태에 따라 파싱 (일반적: { short_url: "..." })
  const short_url: string = data.short_url ?? data.shortUrl ?? data.url ?? "";
  if (!short_url) throw new Error("Link24 응답에서 short_url을 찾을 수 없습니다.");
  return { short_url };
}
