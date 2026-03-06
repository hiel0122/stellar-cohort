import { useState, createContext, useContext, useCallback } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, Search, Bell, User, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RawDataInputDrawer } from "@/components/RawDataInputDrawer";

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
  const [pinned, setPinned] = useState(true);
  const [rawDataOpen, setRawDataOpen] = useState(false);
  const [rawDataTab, setRawDataTab] = useState<RawDataTabType>("cohorts");

  const openRawData = useCallback((tab: RawDataTabType = "cohorts") => {
    setRawDataTab(tab);
    setRawDataOpen(true);
  }, []);

  return (
    <LayoutContext.Provider value={{ openRawData }}>
      <SidebarProvider defaultOpen={pinned}>
        <div className="flex min-h-screen w-full">
          <AppSidebar pinned={pinned} onTogglePin={() => setPinned(!pinned)} />
          <div className="flex flex-1 flex-col min-w-0">
            <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger><Menu className="h-4 w-4" /></SidebarTrigger>
                <h1 className="text-sm font-semibold text-foreground hidden sm:block">KPI Dashboard</h1>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 mr-1" onClick={() => openRawData("cohorts")}>
                  <Database className="h-3 w-3" /> 원데이터 입력
                </Button>
                
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
