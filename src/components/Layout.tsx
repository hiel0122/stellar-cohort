import { useState, createContext, useContext, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, Bell, User, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RawDataInputDrawer } from "@/components/RawDataInputDrawer";

const TITLE_MAP: Record<string, string> = {
  "/": "매출 대시보드",
  "/dashboard": "매출 대시보드",
  "/satisfaction": "만족도 분석",
};

const RAW_DATA_ROUTES = new Set(["/", "/dashboard"]);

type RawDataTabType = "cohorts" | "costs" | "targets";
interface LayoutContextType {
  openRawData: (tab?: RawDataTabType) => void;
}
const LayoutContext = createContext<LayoutContextType>({ openRawData: () => {} });
export function useLayoutActions() { return useContext(LayoutContext); }

interface Props {
  children: React.ReactNode;
  defaultInstructor?: string;
  defaultCourse?: string;
  defaultCohortNo?: number | null;
}

export function Layout({ children, defaultInstructor, defaultCourse, defaultCohortNo }: Props) {
  const [rawDataOpen, setRawDataOpen] = useState(false);
  const [rawDataTab, setRawDataTab] = useState<RawDataTabType>("cohorts");
  const { pathname } = useLocation();

  const pageTitle = TITLE_MAP[pathname] ?? "운영 Studio";
  const showRawData = RAW_DATA_ROUTES.has(pathname);

  const openRawData = useCallback((tab: RawDataTabType = "cohorts") => {
    setRawDataTab(tab);
    setRawDataOpen(true);
  }, []);

  return (
    <LayoutContext.Provider value={{ openRawData }}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-w-0">
            <header className="sticky top-0 z-30 flex min-h-[3.5rem] items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4 py-2">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {showRawData && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 mr-1" onClick={() => openRawData("cohorts")}>
                    <Database className="h-3 w-3" /> 원데이터 입력
                  </Button>
                )}
                
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Bell className="h-4 w-4" /></Button>
                <ThemeToggle />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><User className="h-4 w-4" /></Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto">
              <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</div>
            </main>
          </div>
        </div>

        <RawDataInputDrawer
          open={rawDataOpen}
          onOpenChange={setRawDataOpen}
          defaultInstructor={defaultInstructor}
          defaultCourse={defaultCourse}
          defaultCohortNo={defaultCohortNo ?? undefined}
          defaultTab={rawDataTab}
        />
      </SidebarProvider>
    </LayoutContext.Provider>
  );
}
