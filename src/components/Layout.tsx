import { useState, createContext, useContext, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, User, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RawDataInputDrawer } from "@/components/RawDataInputDrawer";
import { useAuth } from "@/components/AuthProvider";
import { SessionSoftBanner } from "@/components/SessionSoftBanner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TITLE_MAP: Record<string, string> = {
  "/dashboard": "매출 대시보드",
  "/media-commerce/marketing": "마케팅 대시보드",
  "/satisfaction": "만족도 분석",
  "/admin/users": "사용자 권한 관리",
};

const RAW_DATA_ROUTES = new Set(["/dashboard"]);

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
  const navigate = useNavigate();
  const { user, signOut, softError, retrySessionSync, dismissSoftError, resetSession, loading, profileLoading } = useAuth();

  const pageTitle = TITLE_MAP[pathname] ?? "운영 Studio";
  const showRawData = RAW_DATA_ROUTES.has(pathname);

  const openRawData = useCallback((tab: RawDataTabType = "cohorts") => {
    setRawDataTab(tab);
    setRawDataOpen(true);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <User className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user && (
                      <>
                        <div className="px-2 py-1.5">
                          <p className="text-sm font-medium text-foreground">{user.user_metadata?.full_name ?? "User"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>
            {softError && (
              <div className="sticky top-14 z-20 border-b border-border/50 bg-background/70 px-4 py-3 backdrop-blur md:px-8">
                <div className="mx-auto max-w-6xl">
                  <SessionSoftBanner
                    message={softError}
                    busy={loading || profileLoading}
                    onRetry={retrySessionSync}
                    onReset={resetSession}
                    onDismiss={dismissSoftError}
                  />
                </div>
              </div>
            )}
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
