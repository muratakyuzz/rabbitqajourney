import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Handshake,
  FolderOpen,
  LogOut,
  ChevronDown,
  Bell,
  DollarSign,
  Zap,
  Settings,
  Settings2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const adminNav = [
  { title: "Dashboard", url: "/app/admin/dashboard", icon: LayoutDashboard },
  { title: "Partners", url: "/app/admin/partners", icon: Building2 },
  { title: "Leads", url: "/app/admin/leads", icon: Zap },
  { title: "Deals", url: "/app/admin/deals", icon: Handshake },
  { title: "Content Hub", url: "/app/admin/documents", icon: FolderOpen },
  { title: "Reporting", url: "/app/admin/reporting", icon: BarChart3 },
];

const adminSettingsNav = [
  { title: "Configure", url: "/app/admin/configure", icon: Settings2 },
  { title: "Users", url: "/app/admin/users", icon: Users },
];

const partnerNav = [
  { title: "Dashboard", url: "/app/partner/dashboard", icon: LayoutDashboard },
  { title: "Leads", url: "/app/partner/leads", icon: Zap },
  { title: "Deals", url: "/app/partner/deals", icon: Handshake },
  { title: "Finance", url: "/app/partner/finance", icon: DollarSign },
  { title: "Content Hub", url: "/app/partner/documents", icon: FolderOpen },
  { title: "Settings", url: "/app/partner/settings", icon: Settings },
];

function SidebarNav() {
  const { user, role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = role === "admin" ? adminNav : partnerNav;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70 bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border/70">
        <div className="flex items-center justify-center h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-sidebar-primary/30 bg-sidebar-primary/10 shadow-[0_0_0_1px_hsl(var(--sidebar-primary)/0.12)]">
          <img src="/brand/vector.png" alt="PartnerHub logo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            PartnerHub
          </span>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-muted font-semibold px-3 mb-1">
              {role === "admin" ? "Administration" : "My Portal"}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="group flex items-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                      activeClassName="bg-[hsl(var(--sidebar-primary)/0.10)] text-[hsl(var(--sidebar-primary))] shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.32)] [&>svg]:text-[hsl(var(--sidebar-primary))]"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && (
          <SidebarGroup className={collapsed ? "mt-3" : "mt-4 pt-3 border-t border-sidebar-border/70"}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-muted font-semibold px-3 mb-1">
                Settings
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminSettingsNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="group flex items-start gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150"
                        activeClassName="bg-[hsl(var(--sidebar-primary)/0.10)] text-[hsl(var(--sidebar-primary))] shadow-[inset_0_0_0_1px_hsl(var(--sidebar-primary)/0.32)] [&>svg]:text-[hsl(var(--sidebar-primary))]"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/70 group-hover:text-sidebar-foreground" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/50">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {user.email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.email}</p>
              <p className="text-[10px] text-sidebar-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function Topbar() {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/75 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs rounded-md border px-2 py-1 text-muted-foreground">
          {role === "admin" ? "Admin" : "Partner"}
        </span>

        <Button variant="ghost" size="icon" className="text-muted-foreground relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-sm h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user?.email.slice(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-medium">{user?.email}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 p-6 overflow-auto bg-background">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
