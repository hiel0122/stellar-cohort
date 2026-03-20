import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { marketingProvider } from "@/lib/marketing";

/**
 * /r/:code → 클릭 기록 후 리다이렉트
 * UTM이 활성화된 링크는 tracked_url로 리다이렉트
 */
export default function TrackingRedirect() {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (!code) return;

    const link = marketingProvider.getLinkByTrackCode(code);
    if (link) {
      // record click (dedup/bot filter handled inside provider)
      marketingProvider.recordClick(code, {
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
      });

      // Use tracked_url (UTM-applied) if available, otherwise destination_url
      const redirectTo = (link.utm_enabled && link.tracked_url)
        ? link.tracked_url
        : link.destination_url;

      window.location.replace(redirectTo);
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
