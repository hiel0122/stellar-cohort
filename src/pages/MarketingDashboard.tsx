import { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingKPICards } from "@/components/marketing/MarketingKPICards";
import { LinkForm } from "@/components/marketing/LinkForm";
import { LinkTable } from "@/components/marketing/LinkTable";
import { LinkDetailDrawer } from "@/components/marketing/LinkDetailDrawer";
import { MarketingCharts } from "@/components/marketing/MarketingCharts";
import { ClickLogTable } from "@/components/marketing/ClickLogTable";
import { MarketingSettingsDialog } from "@/components/marketing/MarketingSettings";
import { CampaignList } from "@/components/marketing/CampaignList";
import { CampaignDetail } from "@/components/marketing/CampaignDetail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { marketingProvider } from "@/lib/marketing";
import type { MarketingLink } from "@/lib/marketing/types";

export default function MarketingDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedLink, setSelectedLink] = useState<MarketingLink | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);

  const links = marketingProvider.listLinks();
  const events = marketingProvider.listClickEvents();
  void refreshKey;

  const activeLink = activeLinkId ? links.find((l) => l.id === activeLinkId) ?? null : null;

  const handleRowClick = (link: MarketingLink) => {
    if (activeLinkId === link.id) {
      setActiveLinkId(null);
    } else {
      setActiveLinkId(link.id);
    }
  };

  const handleDetailOpen = (link: MarketingLink) => {
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
            <LinkTable
              links={links}
              selectedLinkId={activeLinkId}
              onSelect={handleRowClick}
            />

            {/* Selected link indicator */}
            {activeLink && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-muted-foreground">선택된 링크:</span>
                <Badge variant="secondary" className="text-xs font-medium">
                  {activeLink.alias}
                </Badge>
                <span className="text-[11px] font-mono text-muted-foreground">{activeLink.short_url}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1"
                  onClick={() => setActiveLinkId(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px] ml-auto"
                  onClick={() => handleDetailOpen(activeLink)}
                >
                  상세 보기
                </Button>
              </div>
            )}

            <MarketingCharts links={links} events={events} />
            <ClickLogTable selectedLink={activeLink} />
          </TabsContent>

          <TabsContent value="campaigns">
            {selectedCampaign ? (
              <CampaignDetail
                campaign={selectedCampaign}
                links={links}
                events={events}
                onBack={() => setSelectedCampaign(null)}
                onSelectLink={handleDetailOpen}
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