import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function Layout({ children }: Props) {
  const [pinned, setPinned] = useState(true);

  return (
    <SidebarProvider defaultOpen={pinned}>
      <div className="flex min-h-screen w-full">
        <AppSidebar pinned={pinned} onTogglePin={() => setPinned(!pinned)} />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4">
            <SidebarTrigger>
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-sm font-semibold text-foreground">Instructor KPI Dashboard</h1>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
