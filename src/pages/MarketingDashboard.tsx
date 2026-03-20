import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { MarketingKPICards } from "@/components/marketing/MarketingKPICards";
import { LinkForm } from "@/components/marketing/LinkForm";
import { LinkTable } from "@/components/marketing/LinkTable";
import { LinkDetailDrawer } from "@/components/marketing/LinkDetailDrawer";
import { MarketingCharts } from "@/components/marketing/MarketingCharts";
import { MarketingSettingsDialog } from "@/components/marketing/MarketingSettings";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingLink } from "@/lib/marketing/types";

export default function MarketingDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLink, setSelectedLink] = useState<MarketingLink | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  // read from provider on each render/refresh
  const links = marketingProvider.listLinks();
  const events = marketingProvider.listClickEvents();

  // force re-read when refreshKey changes
  void refreshKey;

  const handleSelect = (link: MarketingLink) => {
    setSelectedLink(link);
    setDrawerOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with settings */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">단축 링크 생성 · 클릭 트래킹 · 채널별 분석</p>
          </div>
          <MarketingSettingsDialog onSaved={reload} />
        </div>

        {/* KPI Cards */}
        <MarketingKPICards links={links} events={events} />

        {/* Link Form */}
        <LinkForm onCreated={reload} />

        {/* Link Table */}
        <LinkTable links={links} onSelect={handleSelect} />

        {/* Charts */}
        <MarketingCharts links={links} events={events} />

        {/* Detail Drawer */}
        <LinkDetailDrawer
          link={selectedLink}
          events={events}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdated={reload}
        />
      </div>
    </Layout>
  );
}
