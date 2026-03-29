/* ── Link24 API wrapper (via Supabase Edge Function proxy) ── */
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://fwgnljlzzpneinawyeqq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3Z25samx6enBuZWluYXd5ZXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3ODEwOTYsImV4cCI6MjA4NzM1NzA5Nn0.j7y4IRh6TNfwO4uVno5tZ9do7J6CmWuXbNNg3SIHqIc";

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

/**
 * Link24 단축 링크 생성
 * fetch로 직접 호출하여 Authorization=anon_key(Verify-JWT 통과),
 * x-user-jwt=user_access_token(실제 유저 인증)으로 분리.
 */
export async function createShortLink(trackingUrl: string): Promise<ShortenResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/link24-shoturl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-jwt": `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ org_url: trackingUrl }),
  });

  let data: Link24FunctionResponse;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Edge Function 응답 파싱 실패 (status ${res.status})`);
  }

  if (!res.ok || data.ok !== true) {
    throw new Error(data?.message || data?.error || `Link24 API 오류 (status ${res.status})`);
  }

  const short_url = data.short_url ?? data.url ?? data.shortUrl ?? "";
  if (!short_url) {
    throw new Error(data.message || "Link24 응답에서 short_url을 찾을 수 없습니다.");
  }

  return { short_url };
}
