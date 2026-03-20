import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingKPICards } from "@/components/marketing/MarketingKPICards";
import { LinkForm } from "@/components/marketing/LinkForm";
import { LinkTable } from "@/components/marketing/LinkTable";
import { LinkDetailDrawer } from "@/components/marketing/LinkDetailDrawer";
import { MarketingCharts } from "@/components/marketing/MarketingCharts";
import { MarketingSettingsDialog } from "@/components/marketing/MarketingSettings";
import { CampaignList } from "@/components/marketing/CampaignList";
import { CampaignDetail } from "@/components/marketing/CampaignDetail";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingLink } from "@/lib/marketing/types";

export default function MarketingDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLink, setSelectedLink] = useState<MarketingLink | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const links = marketingProvider.listLinks();
  const events = marketingProvider.listClickEvents();
  void refreshKey;

  const handleSelect = (link: MarketingLink) => {
    setSelectedLink(link);
    setDrawerOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">단축 링크 생성 · 클릭 트래킹 · 채널별 분석</p>
          <MarketingSettingsDialog onSaved={reload} />
        </div>

        {/* KPI Cards */}
        <MarketingKPICards links={links} events={events} />

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <LinkForm onCreated={reload} />
            <LinkTable links={links} onSelect={handleSelect} />
            <MarketingCharts links={links} events={events} />
          </TabsContent>

          <TabsContent value="campaigns">
            {selectedCampaign ? (
              <CampaignDetail
                campaign={selectedCampaign}
                links={links}
                events={events}
                onBack={() => setSelectedCampaign(null)}
                onSelectLink={handleSelect}
              />
            ) : (
              <CampaignList
                links={links}
                events={events}
                onSelectCampaign={setSelectedCampaign}
              />
            )}
          </TabsContent>
        </Tabs>

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
