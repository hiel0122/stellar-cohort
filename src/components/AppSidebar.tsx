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
      <SidebarHeader className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
            KPI
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
            onClick={onTogglePin}
            title={pinned ? "고정 해제" : "고정"}
          >
            {pinned ? <Pin className="h-3 w-3" /> : <PinOff className="h-3 w-3" />}
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
