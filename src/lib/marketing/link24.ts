/* ── Link24 API wrapper (via Supabase Edge Function proxy) ── */
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface ShortenResult {
  short_url: string;
}

interface Link24FunctionResponse {
  ok?: boolean;
  status?: number;
  url?: string;
  short_url?: string;
  shortUrl?: string;
  message?: string;
  error?: string;
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.clone().json()) as Link24FunctionResponse;
      if (payload?.message || payload?.error) {
        return payload.message ?? payload.error ?? "Link24 프록시 오류";
      }
    } catch {
      try {
        const text = await error.context.clone().text();
        if (text) return text;
      } catch {
        // ignore
      }
    }
  }
  return error instanceof Error ? error.message : "알 수 없는 오류";
}

/**
 * Link24 단축 링크 생성
 * Edge Function이 DB에서 customer_id를 읽고, Secrets에서 API Key를 읽음.
 * 프론트는 org_url만 전송.
 */
export async function createShortLink(trackingUrl: string): Promise<ShortenResult> {
  const { data, error } = await supabase.functions.invoke<Link24FunctionResponse>("link24-shoturl", {
    body: { org_url: trackingUrl },
  });

  if (error) {
    throw new Error(await getFunctionErrorMessage(error));
  }

  if (!data || data.ok !== true) {
    throw new Error(data?.message || data?.error || "Link24 API 오류: 알 수 없는 응답");
  }

  const short_url = data.short_url ?? data.url ?? data.shortUrl ?? "";
  if (!short_url) {
    throw new Error(data.message || "Link24 응답에서 short_url을 찾을 수 없습니다.");
  }

  return { short_url };
}
