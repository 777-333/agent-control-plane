import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Activity,
  BellRing,
  Blocks,
  BrainCircuit,
  ChartColumn,
  ChevronRight,
  FileSearch,
  Fingerprint,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Route,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import FirstRunTour from "./FirstRunTour";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard-Übersicht",
    path: "/",
    area: "Overview",
    description: "Zentrale Lageübersicht über KPI-Signale, Risiken, Kosten und Governance-Status.",
    statusLabel: "Live",
  },
  {
    icon: BrainCircuit,
    label: "Agenten-Verwaltung",
    path: "/agents",
    area: "Operations",
    description: "Registrierung, Schwarm-Kommunikation, Verlaufsfilter sowie Kennzahlen zu Nachrichtenfenster, Approval-Ereignissen, SLA verletzt und Eskalationshinweisen.",
    statusLabel: "Live",
  },
  {
    icon: ShieldCheck,
    label: "Policy Engine",
    path: "/policies",
    area: "Governance",
    description: "Verbindliche Regeln, Prioritäten und Policy-Effekte bleiben direkt steuerbar.",
    statusLabel: "Live",
  },
  {
    icon: UserCog,
    label: "Rollen- und Rechteverwaltung",
    path: "/access",
    area: "Access",
    description: "Teams, Rollen und Berechtigungen sind pro Agent und Tool zuordenbar.",
    statusLabel: "Live",
  },
  {
    icon: BellRing,
    label: "Approval Workflow",
    path: "/approvals",
    area: "Human-in-the-loop",
    description: "Genehmigungsketten, Eskalationen und Benachrichtigungen sind produktiv angebunden.",
    statusLabel: "Live",
  },
  {
    icon: Fingerprint,
    label: "Audit Log",
    path: "/audit",
    area: "Traceability",
    description: "Governance- und Agentenereignisse bleiben filterbar und nachvollziehbar dokumentiert.",
    statusLabel: "Live",
  },
  {
    icon: Blocks,
    label: "Tool & Connector Layer",
    path: "/connectors",
    area: "Integrations",
    description: "Systemverbindungen und Betriebszustände sind sichtbar und verwaltbar angebunden.",
    statusLabel: "Live",
  },
  {
    icon: FileSearch,
    label: "Evaluation Layer",
    path: "/evaluations",
    area: "Validation",
    description: "Testfälle und Pre-Deployment-Prüfungen sind ausführbar und auswertbar vorhanden.",
    statusLabel: "Live",
  },
  {
    icon: Route,
    label: "Runtime Guardrails",
    path: "/guardrails",
    area: "Runtime safety",
    description: "Laufzeitverstöße, Datenschutzregeln und Auto-Stops sind operativ nutzbar.",
    statusLabel: "Live",
  },
  {
    icon: ChartColumn,
    label: "Observability & Cost Monitoring",
    path: "/observability",
    area: "Monitoring",
    description: "Kosten-, Latenz- und Fehlerindikatoren stehen als aktive Monitoring-Fläche bereit.",
    statusLabel: "Live",
  },
  {
    icon: KeyRound,
    label: "API-Schlüssel & Integration",
    path: "/integration",
    area: "Integration",
    description: "Eigene API-Schlüssel erzeugen und Agenten per Snippet anbinden.",
    statusLabel: "Live",
  },
  {
    icon: HelpCircle,
    label: "Hilfe & Dokumentation",
    path: "/help",
    area: "Support",
    description: "Schnellstart, Modulwegweiser, Tour-Neustart und Handbuchpfade stehen verständlich an einem Ort bereit.",
    statusLabel: "Guide",
  },
] as const;

const defaultMenuItem = menuItems[0];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 308;
const MIN_WIDTH = 248;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(86,120,255,0.14),transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_42%,#f8fafc_100%)] px-6">
        <div className="w-full max-w-xl rounded-[28px] border border-white/60 bg-white/90 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <Badge className="mb-5 rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-900">
            Agent Control Plane
          </Badge>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Sign in to access your AI-Agent-Governance- und Operations-Dashboard
            </h1>
            <p className="max-w-lg text-sm leading-6 text-slate-600">
              Zentralisiere Steuerung, Überwachung und Absicherung deiner KI-Agenten in einer präzise gestalteten Enterprise-Oberfläche.
            </p>
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Button
              size="lg"
              className="rounded-xl bg-slate-950 px-6 text-white shadow-lg shadow-slate-950/10 transition hover:bg-slate-800"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              Sign in
            </Button>
            <p className="text-xs leading-5 text-slate-500">
              Zugriff ist für authentifizierte Nutzer mit Governance-, Ops- oder Approver-Verantwortung vorgesehen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location) ?? defaultMenuItem;
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0 bg-transparent" disableTransition={isResizing}>
          <SidebarHeader className="h-20 justify-center border-b border-slate-200/70 px-4">
            <div className="flex w-full items-center gap-3 px-2 transition-all">
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    AI-Agent-Governance
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="truncate text-base font-semibold tracking-[-0.03em] text-slate-950">
                      Agent Control Plane
                    </span>
                    <Badge variant="secondary" className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] text-slate-600">
                      Ops Console
                    </Badge>
                  </div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-3 py-4">
            {!isCollapsed ? (
              <>
                <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Current surface
                    </p>
                    <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50">
                      {activeMenuItem.statusLabel}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{activeMenuItem.label}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                        {activeMenuItem.area}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{activeMenuItem.description}</p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-[0_10px_30px_rgba(16,185,129,0.10)]">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                    System readiness
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-950">Alle {menuItems.length} Module sind aktiv angebunden.</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                    Jede Navigationsfläche führt auf eine echte Produktseite mit Route, Datenbindung oder operativer Mutation.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-emerald-900">
                    Aktuelle Route: {activeMenuItem.label} · {activeMenuItem.area} · {activeMenuItem.description}
                  </p>
                </div>
              </>
            ) : null}

            <SidebarMenu className="space-y-1 px-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 rounded-xl border border-transparent px-3 text-[13px] font-medium transition-all ${
                        isActive
                          ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10 hover:bg-slate-900"
                          : "text-slate-600 hover:border-slate-200 hover:bg-white/80 hover:text-slate-950"
                      }`}
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
                        <div className="min-w-0">
                          <span className="block truncate">{item.label}</span>
                          <span className={`block truncate text-[10px] font-normal ${isActive ? "text-slate-200" : "text-slate-400"}`}>
                            {item.area}
                          </span>
                        </div>
                        <Badge
                          className={`rounded-full px-2 py-0 text-[10px] font-medium ${
                            isActive
                              ? "border border-white/20 bg-white/12 text-white hover:bg-white/12"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {item.statusLabel}
                        </Badge>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200/70 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/85 px-2 py-2 text-left shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center">
                  <Avatar className="h-10 w-10 shrink-0 border border-slate-200">
                    <AvatarFallback className="bg-slate-950 text-xs font-semibold text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-semibold leading-none text-slate-950">{user?.name || "User"}</p>
                    <p className="mt-1.5 truncate text-xs text-slate-500">{user?.email || "No email"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-xl border-slate-200">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer rounded-lg text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-[radial-gradient(circle_at_top,rgba(114,132,255,0.10),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f4f7fb_48%,#eef2f7_100%)]">
        <FirstRunTour userName={user?.name} />
        {isMobile ? (
          <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/70 bg-background/90 px-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-xl border border-slate-200 bg-white" />
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Module</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">{activeMenuItem.label}</p>
                  <Badge className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0 text-[10px] text-emerald-700 hover:bg-emerald-50">
                    {activeMenuItem.statusLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        <main className="min-h-screen flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-6 rounded-[28px] border border-slate-200/80 bg-white/80 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Current route</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{activeMenuItem.label}</h1>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-slate-400">{activeMenuItem.area}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{activeMenuItem.description}</p>
              </div>
              <Badge className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50">
                {activeMenuItem.statusLabel}
              </Badge>
            </div>
          </div>
          {children}
        </main>
      </SidebarInset>
    </>
  );
}
