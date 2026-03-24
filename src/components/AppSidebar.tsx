import { LayoutDashboard, PanelLeftClose, PanelLeft, SmilePlus, Megaphone, ShieldCheck } from "lucide-react";
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
import { BrandWordmark } from "@/components/brand/BrandWordmark";
import { useAuth } from "@/components/AuthProvider";
import { getAllowedRoutes } from "@/lib/auth";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Survey", url: "/satisfaction", icon: SmilePlus },
];

const mediaCommerceNav = [
  { title: "Link Tracking", url: "/media-commerce/marketing", icon: Megaphone },
];

const adminNav = [
  { title: "사용자 관리", url: "/admin/users", icon: ShieldCheck },
];

export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useAuth();

  const allowed = getAllowedRoutes(role);
  const filteredMain = mainNav.filter((item) => allowed.some((r) => item.url.startsWith(r)));
  const filteredMedia = mediaCommerceNav.filter((item) => allowed.some((r) => item.url.startsWith(r)));
  const filteredAdmin = adminNav.filter((item) => allowed.some((r) => item.url.startsWith(r)));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="group-data-[collapsible=icon]:hidden">
            <BrandWordmark className="text-base" />
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
        {filteredMain.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Education</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
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
        )}

        {filteredMedia.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Media Commerce</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMedia.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
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
        )}

        {filteredAdmin.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdmin.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
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
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:hidden">
        <p className="text-[10px] text-muted-foreground/50">© 2025 KPI Dashboard</p>
      </SidebarFooter>
    </Sidebar>
  );
}
