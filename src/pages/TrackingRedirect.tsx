import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { marketingProvider } from "@/lib/marketing";

/**
 * /r/:code → 클릭 기록 후 302 리다이렉트 (클라이언트 측 MVP)
 * 
 * 주의: localStorage 기반이므로 동일 브라우저에서만 기록됨.
 * 실제 운영 시 Supabase Edge Function으로 전환 필요.
 */
export default function TrackingRedirect() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (!code) return;

    const link = marketingProvider.getLinkByTrackCode(code);
    if (link) {
      // record click
      marketingProvider.recordClick(code, {
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
      });
      // redirect
      window.location.replace(link.destination_url);
    }
  }, [code]);

  const link = code ? marketingProvider.getLinkByTrackCode(code) : null;

  if (!link) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">링크를 찾을 수 없습니다</p>
          <p className="text-sm text-muted-foreground">유효하지 않거나 만료된 링크입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <p className="text-sm text-muted-foreground">리다이렉트 중…</p>
    </div>
  );
}
