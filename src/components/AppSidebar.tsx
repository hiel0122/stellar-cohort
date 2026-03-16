import { LayoutDashboard, PanelLeftClose, PanelLeft, SmilePlus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { title: "대시보드", url: "/", icon: LayoutDashboard },
  { title: "만족도 분석", url: "/satisfaction", icon: SmilePlus },
];

export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground">
              운영 Studio
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/30">
              Beta
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={toggleSidebar}
            title={collapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      activeClassName="bg-accent text-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <p className="text-[10px] text-muted-foreground/50">© 2025 KPI Dashboard</p>
      </SidebarFooter>
    </Sidebar>
  );
}
