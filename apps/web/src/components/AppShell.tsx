import { Outlet, useNavigate, useLocation } from "react-router";
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
import { useRq } from "@/lib/rabbitqa/store";
import { ROLE_SHORT } from "@rabbitqa/shared/domain/labels";
import { canAccessAdmin, canSeeManagementReport, visibleInsights, visibleProjects } from "@/lib/rabbitqa/perm";
import { useAlertViews } from "@/lib/rabbitqa/store";
import { ALERT_LEVEL_LABEL } from "@rabbitqa/shared/domain/labels";
import type { AuthUser } from "@/lib/auth-api";
import { effectiveStatus } from "@/lib/rabbitqa/ai-mock";
import { toast } from "sonner";
import {
  ListChecks,
  RotateCcw,
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
  Gauge,
  Sparkles,
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

const mainNav = [
  { title: "Genel bakış", url: "/app/overview", icon: Gauge, can: null },
  { title: "AI Insight", url: "/app/insights", icon: Sparkles, can: null },
  { title: "Müşteri projeleri", url: "/app/projects", icon: Building2, can: null },
  { title: "Bana atananlar", url: "/app/my-work", icon: ListChecks, can: null },
  { title: "Yönetim raporu", url: "/app/reports", icon: BarChart3, can: canSeeManagementReport },
  { title: "Sistem ayarları", url: "/app/admin", icon: Settings, can: canAccessAdmin },
] as { title: string; url: string; icon: typeof Gauge; can: ((u: AuthUser | null) => boolean) | null }[];


function SidebarNav() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { state: rq } = useRq();
  const pendingAi = visibleInsights(rq, user).filter((i) => effectiveStatus(rq, i) === "pending").length;
  const items = mainNav.filter((i) => !i.can || i.can(user));

  return (
    <Sidebar collapsible="icon" className="print:hidden border-r border-sidebar-border/70 bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border/70">
        <div className="flex items-center justify-center h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-sidebar-primary/30 bg-sidebar-primary/10 shadow-[0_0_0_1px_hsl(var(--sidebar-primary)/0.12)]">
          <img src="/brand/vector.png" alt="RabbitQA logo" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
            RabbitQA Onboarding
          </span>
        )}
      </div>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-sidebar-muted font-semibold px-3 mb-1">
              Onboarding
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
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {!collapsed && item.url === "/app/insights" && pendingAi > 0 && <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">{pendingAi}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="px-2 pb-4">
        {!collapsed && user && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/50">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
                {user.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-muted truncate">{user.email}</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function AlertBell() {
  const { user } = useAuth();
  const { state } = useRq();
  const navigate = useNavigate();
  const all = useAlertViews();
  const pids = new Set(visibleProjects(state, user).map((p) => p.id));
  const open = all.filter((a) => a.status === "open" && pids.has(a.projectId))
    .sort((a, b) => (a.level === b.level ? (b.createdAt ?? "").localeCompare(a.createdAt ?? "") : a.level === "red" ? -1 : 1));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground relative" aria-label={`Uyarılar (${open.length})`}>
          <Bell className="h-4 w-4" />
          {open.length > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold leading-4 text-center">{open.length > 99 ? "99+" : open.length}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Açık uyarılar ({open.length})</div>
        <DropdownMenuSeparator />
        {open.length === 0 && <div className="px-2 py-3 text-sm text-muted-foreground">Açık uyarı yok</div>}
        {open.slice(0, 8).map((a) => (
          <DropdownMenuItem key={a.key} className="flex items-start gap-2" onClick={() => navigate(`/app/projects/${a.projectId}?panel=alerts`)}>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${a.level === "red" ? "bg-destructive" : "bg-warning"}`} title={ALERT_LEVEL_LABEL[a.level]} />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{state.projects.find((p) => p.id === a.projectId)?.customerName}</span>
              <span className="block text-sm truncate">{a.title}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Topbar() {
  const { user, logout, role } = useAuth();
  const { reset } = useRq();
  const navigate = useNavigate();

  return (
    <header className="print:hidden h-14 border-b bg-background/85 backdrop-blur-sm supports-backdrop-filter:bg-background/75 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs rounded-md border px-2 py-1 text-muted-foreground">
          {role ? ROLE_SHORT[role] : ""}
        </span>

        <AlertBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-sm h-9 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {user?.name.split(" ").map((x) => x[0]).join("").slice(0, 2) || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline font-medium">{user?.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { reset(); toast.success("Demo verisi sıfırlandı"); }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Demo verisini sıfırla
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Çıkış yap
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
          <main className="flex-1 p-6 print:p-0 overflow-auto bg-background">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
