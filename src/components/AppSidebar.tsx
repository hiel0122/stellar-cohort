import { LayoutDashboard, Users, BookOpen, Layers, CheckSquare, Settings, Pin, PinOff } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Instructors", url: "/instructors", icon: Users },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "Cohorts", url: "/cohorts", icon: Layers },
  { title: "Checklists", url: "/checklists", icon: CheckSquare },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface Props {
  pinned: boolean;
  onTogglePin: () => void;
}

export function AppSidebar({ pinned, onTogglePin }: Props) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            KPI Dashboard
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
            onClick={onTogglePin}
            title={pinned ? "고정 해제" : "고정"}
          >
            {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground">© 2025 KPI Dashboard</p>
      </SidebarFooter>
    </Sidebar>
  );
}
