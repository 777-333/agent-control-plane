import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createDefaultSimulationSignals, createEmptyApprovalStageDraft, getLaneLabel, moveStageToDropZone, reorderApprovalChainStages, simulateApprovalChain, simulateApprovalTimeline, type ApprovalChainStageDraft } from "@/lib/approval-chain-editor";
import { Loader2, Shield, Activity, BellRing, BrainCircuit, FileSearch, Blocks, UserCog, Fingerprint, ChartNoAxesCombined, Waypoints, Sparkles, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

function timeAgo(timestamp: number) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  return `vor ${Math.round(hours / 24)} Tg.`;
}

function useSnapshot() {
  return trpc.controlPlane.snapshot.useQuery(undefined, {
    staleTime: 0,
    refetchInterval: 8_000,
    refetchOnWindowFocus: false,
  });
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-[28px] border border-slate-200/70 bg-white/75 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">Lade Governance- und Operations-Daten …</span>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
      Die Daten konnten nicht geladen werden. Bitte prüfe die Serververbindung und versuche es erneut.
    </div>
  );
}

function Surface({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm ${className}`}>
      {children}
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-slate-950 md:text-[2rem]">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Surface className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">{icon}</div>
      </div>
    </Surface>
  );
}

function ModuleBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneMap = {
    neutral: "border-slate-200 bg-slate-100 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}>{label}</span>;
}

function TwoColumnGrid({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">{left}{right}</div>;
}

function useCreateAgentForm() {
  return useState<{
    name: string;
    description: string;
    team: string;
    owner: string;
    model: string;
    environment: "production" | "staging" | "development";
  }>({
    name: "",
    description: "",
    team: "Finance Operations",
    owner: "",
    model: "gpt-4.1",
    environment: "production",
  });
}

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useSnapshot();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const stats = data.dashboard.stats;
  const pieData = [
    { name: "Healthy", value: data.dashboard.agentStatusDistribution.healthy, color: "#0f172a" },
    { name: "Warning", value: data.dashboard.agentStatusDistribution.warning, color: "#f59e0b" },
    { name: "Paused", value: data.dashboard.agentStatusDistribution.paused, color: "#64748b" },
    { name: "Offline", value: data.dashboard.agentStatusDistribution.offline, color: "#ef4444" },
  ];
  const costTrend = data.metrics.map(item => ({ name: item.agentName.split(" ")[0], cost: item.apiCostUsd, latency: item.latencyMs }));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Control Center"
        title="Dashboard-Übersicht"
        description="Zentrale Lageübersicht für aktive Agenten, ausstehende Freigaben, Audit-Signale, Kosten und kritische Guardrail-Ereignisse."
        actions={<Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">Live posture</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Aktive Agenten" value={String(stats.activeAgents)} hint="Agenten mit aktivem Betriebszustand" icon={<BrainCircuit className="h-5 w-5" />} />
        <MetricCard label="Ausstehende Freigaben" value={String(stats.pendingApprovals)} hint="Kritische Aktionen warten auf Entscheidung" icon={<BellRing className="h-5 w-5" />} />
        <MetricCard label="Audit-Events" value={String(stats.auditEvents)} hint="Dokumentierte sicherheitsrelevante Signale" icon={<Fingerprint className="h-5 w-5" />} />
        <MetricCard label="Monatliche Kosten" value={formatCurrency(stats.totalCost)} hint="Aggregierte API- und Laufzeitkosten" icon={<ChartNoAxesCombined className="h-5 w-5" />} />
      </div>

      <TwoColumnGrid
        left={
          <Surface className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">Agent Health & Cost Posture</p>
                <p className="mt-1 text-sm text-slate-500">Kosten und Latenz pro priorisiertem Agenten.</p>
              </div>
              <ModuleBadge label={`${formatNumber(stats.totalTokens)} Tokens`} />
            </div>
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={costTrend}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cost" stroke="#0f172a" fill="url(#colorCost)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Surface>
        }
        right={
          <Surface className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-950">Status-Verteilung</p>
                <p className="mt-1 text-sm text-slate-500">Operative Verteilung der Agentenzustände.</p>
              </div>
              <ModuleBadge label={`${stats.avgLatency} ms Ø`} tone="warning" />
            </div>
            <div className="mt-2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={68} outerRadius={100} paddingAngle={5}>
                    {pieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-950">{item.value}</span>
                </div>
              ))}
            </div>
          </Surface>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Ausstehende Freigaben</p>
              <p className="mt-1 text-sm text-slate-500">Entscheidungen mit menschlicher Verantwortung.</p>
            </div>
            <ModuleBadge label={`${data.dashboard.pendingApprovals.length} offen`} tone="warning" />
          </div>
          <div className="mt-5 space-y-3">
            {data.dashboard.pendingApprovals.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
                  </div>
                  <ModuleBadge label={item.riskLevel} tone={item.riskLevel === "critical" ? "danger" : "warning"} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.agentName}</span>
                  <span>{timeAgo(item.requestedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Neueste Audit-Signale</p>
              <p className="mt-1 text-sm text-slate-500">Relevante Governance-, Approval- und Guardrail-Ereignisse.</p>
            </div>
            <ModuleBadge label={`${stats.errorRate}% Fehler`} tone="danger" />
          </div>
          <div className="mt-5 space-y-3">
            {data.dashboard.recentAuditEvents.map(event => (
              <div key={event.id} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                  <ModuleBadge label={event.severity} tone={event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "success"} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{event.category}</span>
                  <span>{timeAgo(event.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function AgentsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const createMutation = trpc.agents.create.useMutation({
    onSuccess: async () => {
      toast.success("Agent erfolgreich registriert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const [form, setForm] = useCreateAgentForm();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operations"
        title="Agenten-Verwaltung"
        description="Registriere Agenten, konfiguriere Modell- und Umgebungsparameter und überwache den operativen Gesundheitszustand in Echtzeit."
        actions={<ModuleBadge label={`${data.agents.length} registriert`} />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Aktive Agentenflotte</p>
          <div className="mt-5 grid gap-4">
            {data.agents.map(agent => (
              <div key={agent.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">{agent.name}</h3>
                      <ModuleBadge label={agent.status} tone={agent.status === "healthy" ? "success" : agent.status === "warning" ? "warning" : "danger"} />
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{agent.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {agent.tools.map(tool => <ModuleBadge key={tool} label={tool} />)}
                    </div>
                  </div>
                  <div className="grid min-w-[230px] gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <div className="flex justify-between"><span>Team</span><span className="font-medium text-slate-950">{agent.team}</span></div>
                    <div className="flex justify-between"><span>Owner</span><span className="font-medium text-slate-950">{agent.owner}</span></div>
                    <div className="flex justify-between"><span>Modell</span><span className="font-medium text-slate-950">{agent.model}</span></div>
                    <div className="flex justify-between"><span>Policy Mode</span><span className="font-medium text-slate-950">{agent.policyMode}</span></div>
                    <div className="flex justify-between"><span>Heartbeat</span><span className="font-medium text-slate-950">{timeAgo(agent.lastHeartbeat)}</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Neuen Agenten registrieren</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">Lege eine neue Instanz für das Dashboard an und verknüpfe sie später mit Policies, Tool-Zugriffen und Guardrails.</p>
          <div className="mt-5 space-y-4">
            <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none ring-0 placeholder:text-slate-400" placeholder="Agentenname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="min-h-[108px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Team" value={form.team} onChange={e => setForm({ ...form, team: e.target.value })} />
              <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Owner" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
              <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Modell" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
              <select className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none" value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value as "production" | "staging" | "development" })}>
                <option value="production">production</option>
                <option value="staging">staging</option>
                <option value="development">development</option>
              </select>
            </div>
            <Button
              className="h-11 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-900"
              disabled={createMutation.isPending}
              onClick={() => {
                if (!form.name || !form.description || !form.owner) {
                  toast.error("Bitte vervollständige Name, Beschreibung und Owner.");
                  return;
                }
                createMutation.mutate(form);
                setForm({ name: "", description: "", team: form.team, owner: "", model: form.model, environment: form.environment });
              }}
            >
              {createMutation.isPending ? "Registrierung läuft …" : "Agent registrieren"}
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function PoliciesPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const createMutation = trpc.policies.create.useMutation({
    onSuccess: async () => {
      toast.success("Policy erfolgreich erstellt");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const [form, setForm] = useState({
    name: "",
    scopeType: "agent",
    scopeRef: "Finance Sentinel",
    actionPattern: "",
    effect: "approval_required" as "allowed" | "forbidden" | "approval_required",
    priority: 100,
    description: "",
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Governance"
        title="Policy Engine"
        description="Definiere, welche Aktionen ein Agent erlaubt, verboten oder freigabepflichtig ausführen darf. Priorität, Geltungsbereich und Policy-Effekt bleiben explizit sichtbar."
      />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Aktive Policies</p>
          <div className="mt-5 space-y-3">
            {data.policies.map(policy => (
              <div key={policy.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-950">{policy.name}</h3>
                      <ModuleBadge
                        label={policy.effect}
                        tone={policy.effect === "allowed" ? "success" : policy.effect === "forbidden" ? "danger" : "warning"}
                      />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{policy.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ModuleBadge label={`Scope: ${policy.scopeType}`} />
                      <ModuleBadge label={`Ref: ${policy.scopeRef}`} />
                      <ModuleBadge label={`Action: ${policy.actionPattern}`} />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Priorität <span className="font-semibold text-slate-950">{policy.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Neue Policy definieren</p>
          <div className="mt-5 space-y-4">
            <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Policy-Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div className="grid gap-4 md:grid-cols-2">
              <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.scopeType} onChange={e => setForm({ ...form, scopeType: e.target.value })}>
                <option value="agent">agent</option>
                <option value="team">team</option>
                <option value="connector">connector</option>
                <option value="global">global</option>
              </select>
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Scope Reference" value={form.scopeRef} onChange={e => setForm({ ...form, scopeRef: e.target.value })} />
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Action Pattern" value={form.actionPattern} onChange={e => setForm({ ...form, actionPattern: e.target.value })} />
              <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.effect} onChange={e => setForm({ ...form, effect: e.target.value as typeof form.effect })}>
                <option value="allowed">allowed</option>
                <option value="forbidden">forbidden</option>
                <option value="approval_required">approval_required</option>
              </select>
            </div>
            <input type="number" className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
            <textarea className="min-h-[108px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Beschreibung" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <Button
              className="h-11 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-900"
              disabled={createMutation.isPending}
              onClick={() => {
                if (!form.name || !form.actionPattern || !form.description) {
                  toast.error("Bitte vervollständige Name, Action Pattern und Beschreibung.");
                  return;
                }
                createMutation.mutate(form);
                setForm({ ...form, name: "", actionPattern: "", description: "", priority: 100 });
              }}
            >
              {createMutation.isPending ? "Policy wird erstellt …" : "Policy speichern"}
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function AccessPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const teamMutation = trpc.access.createTeam.useMutation({
    onSuccess: async () => {
      toast.success("Team angelegt");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const permissionMutation = trpc.access.createPermission.useMutation({
    onSuccess: async () => {
      toast.success("Berechtigung gespeichert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const [teamForm, setTeamForm] = useState({ name: "", owner: "", coverage: "" });
  const [permissionForm, setPermissionForm] = useState({
    subject: "",
    subjectType: "user" as "user" | "team",
    agentName: "Finance Sentinel",
    permissionLevel: "viewer" as "viewer" | "operator" | "approver" | "admin",
    toolScope: "",
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Security" title="Rollen- und Rechteverwaltung" description="Verwalte Nutzer, Teams und Berechtigungen pro Agent und Tool mit expliziter Zuordnung von Viewer-, Operator-, Approver- und Admin-Rechten." />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Teams</p>
          <div className="mt-5 space-y-3">
            {data.access.teams.map(team => (
              <div key={team.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{team.name}</p>
                    <p className="mt-1 text-sm text-slate-600">Owner: {team.owner}</p>
                  </div>
                  <ModuleBadge label={`${team.members} Members`} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Coverage: {team.coverage}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Neues Team</p>
            <div className="mt-4 grid gap-3">
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Teamname" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} />
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Owner" value={teamForm.owner} onChange={e => setTeamForm({ ...teamForm, owner: e.target.value })} />
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Coverage" value={teamForm.coverage} onChange={e => setTeamForm({ ...teamForm, coverage: e.target.value })} />
              <Button className="h-11 rounded-2xl bg-slate-950 text-white hover:bg-slate-900" disabled={teamMutation.isPending} onClick={() => {
                if (!teamForm.name || !teamForm.owner || !teamForm.coverage) {
                  toast.error("Bitte alle Teamfelder ausfüllen.");
                  return;
                }
                teamMutation.mutate(teamForm);
                setTeamForm({ name: "", owner: "", coverage: "" });
              }}>Team anlegen</Button>
            </div>
          </div>
        </Surface>
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Berechtigungen pro Agent und Tool</p>
          <div className="mt-5 space-y-3">
            {data.access.permissions.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.subject}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.subjectType} · {item.agentName}</p>
                  </div>
                  <ModuleBadge label={item.permissionLevel} tone={item.permissionLevel === "admin" ? "danger" : item.permissionLevel === "approver" ? "warning" : "success"} />
                </div>
                <p className="mt-3 text-sm text-slate-500">Tool Scope: {item.toolScope}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Neue Berechtigung</p>
            <div className="mt-4 grid gap-3">
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Subject" value={permissionForm.subject} onChange={e => setPermissionForm({ ...permissionForm, subject: e.target.value })} />
              <div className="grid gap-3 md:grid-cols-2">
                <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={permissionForm.subjectType} onChange={e => setPermissionForm({ ...permissionForm, subjectType: e.target.value as "user" | "team" })}>
                  <option value="user">user</option>
                  <option value="team">team</option>
                </select>
                <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={permissionForm.permissionLevel} onChange={e => setPermissionForm({ ...permissionForm, permissionLevel: e.target.value as "viewer" | "operator" | "approver" | "admin" })}>
                  <option value="viewer">viewer</option>
                  <option value="operator">operator</option>
                  <option value="approver">approver</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Agent Name" value={permissionForm.agentName} onChange={e => setPermissionForm({ ...permissionForm, agentName: e.target.value })} />
              <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Tool Scope" value={permissionForm.toolScope} onChange={e => setPermissionForm({ ...permissionForm, toolScope: e.target.value })} />
              <Button className="h-11 rounded-2xl bg-slate-950 text-white hover:bg-slate-900" disabled={permissionMutation.isPending} onClick={() => {
                if (!permissionForm.subject || !permissionForm.agentName || !permissionForm.toolScope) {
                  toast.error("Bitte alle Berechtigungsfelder ausfüllen.");
                  return;
                }
                permissionMutation.mutate(permissionForm);
                setPermissionForm({ ...permissionForm, subject: "", toolScope: "" });
              }}>Berechtigung speichern</Button>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function ApprovalsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const createEmptyChainForm = () => ({
    id: null as number | null,
    name: "",
    description: "",
    escalationMode: "serial" as "serial" | "parallel" | "auto_escalate",
    stages: [createEmptyApprovalStageDraft()],
  });
  const [chainForm, setChainForm] = useState(createEmptyChainForm);
  const [approvalChainSelections, setApprovalChainSelections] = useState<Record<number, number>>({});
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);
  const [dropStageIndex, setDropStageIndex] = useState<number | null>(null);
  const [simulationSignals, setSimulationSignals] = useState(createDefaultSimulationSignals);
  const [simulationMinute, setSimulationMinute] = useState(0);

  const resolveMutation = trpc.approvals.resolve.useMutation({
    onSuccess: async () => {
      toast.success("Freigabestufe aktualisiert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const escalateMutation = trpc.approvals.escalate.useMutation({
    onSuccess: async () => {
      toast.success("Stufe eskaliert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const notifyMutation = trpc.approvals.notify.useMutation({
    onSuccess: result => {
      toast.success(result.delivered ? "Benachrichtigung ausgelöst" : "Benachrichtigung konnte nicht zugestellt werden");
    },
  });
  const createChainMutation = trpc.approvals.createChain.useMutation({
    onSuccess: async () => {
      toast.success("Genehmigungskette gespeichert");
      setChainForm(createEmptyChainForm());
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const updateChainMutation = trpc.approvals.updateChain.useMutation({
    onSuccess: async () => {
      toast.success("Genehmigungskette aktualisiert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const assignChainMutation = trpc.approvals.assignChain.useMutation({
    onSuccess: async () => {
      toast.success("Genehmigungskette dem Workflow zugewiesen");
      await utils.controlPlane.snapshot.invalidate();
    },
  });

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const loadChain = (chain: (typeof data.approvalChains)[number]) => {
    setChainForm({
      id: chain.id,
      name: chain.name,
      description: chain.description,
      escalationMode: chain.escalationMode,
      stages: chain.stages.map(stage => ({
        stageName: stage.stageName,
        requiredRole: stage.requiredRole,
        defaultApproverLabel: stage.defaultApproverLabel,
        stageMode: stage.stageMode ?? "serial",
        laneKey: (stage.laneKey as "main" | "parallel-a" | "parallel-b" | "branch-a" | "branch-b" | undefined) ?? "main",
        branchSourceStageOrder: stage.branchSourceStageOrder ?? null,
        branchLabel: stage.branchLabel ?? "",
        branchField: stage.branchField ?? "riskLevel",
        branchOperator: stage.branchOperator ?? "always",
        branchValue: stage.branchValue ?? "",
        quorumMode: stage.quorumMode ?? "all",
        quorumTarget: stage.quorumTarget ?? 1,
        slaMinutes: stage.slaMinutes,
        escalationAfterMinutes: stage.escalationAfterMinutes,
        escalationTargetLabel: stage.escalationTargetLabel,
      })),
    });
  };

  const updateStage = (stageIndex: number, updater: (stage: ApprovalChainStageDraft) => ApprovalChainStageDraft) => {
    setChainForm(current => ({
      ...current,
      stages: current.stages.map((stage, index) => (index === stageIndex ? updater(stage) : stage)),
    }));
  };

  const simulationPreview = useMemo(() => simulateApprovalChain(chainForm.stages, simulationSignals), [chainForm.stages, simulationSignals]);
  const timelinePreview = useMemo(() => simulateApprovalTimeline(chainForm.stages, simulationSignals), [chainForm.stages, simulationSignals]);
  const simulationDuration = useMemo(() => timelinePreview.reduce((max, stage) => Math.max(max, stage.endMinute), 0), [timelinePreview]);

  const saveChain = () => {
    const payload = {
      name: chainForm.name,
      description: chainForm.description,
      escalationMode: chainForm.escalationMode,
      stages: chainForm.stages,
    };

    if (!payload.name.trim() || !payload.description.trim() || payload.stages.some(stage => !stage.stageName.trim() || !stage.defaultApproverLabel.trim() || !stage.escalationTargetLabel.trim())) {
      toast.error("Bitte fülle Name, Beschreibung und alle Stufenfelder vollständig aus.");
      return;
    }

    if (chainForm.id) {
      updateChainMutation.mutate({ id: chainForm.id, ...payload });
      return;
    }

    createChainMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Human-in-the-loop" title="Approval Workflow" description="Kritische Agentenaktionen werden mit Benachrichtigung, mehrstufigen Genehmigungsketten, Eskalationsregeln und persistenten Freigabemustern zur menschlichen Freigabe geführt." />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="p-6">
          <div className="grid gap-4">
            {data.approvals.map(item => {
              const currentStage = item.stages.find(stage => stage.order === item.currentStageOrder);
              const isActionable = item.status === "pending" && currentStage && (currentStage.status === "pending" || currentStage.status === "escalated");

              return (
                <div key={item.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
                  <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-slate-950">{item.title}</h3>
                          <ModuleBadge label={item.status} tone={item.status === "pending" ? "warning" : item.status === "approved" ? "success" : "danger"} />
                          <ModuleBadge label={item.chainName} />
                          <ModuleBadge label={`Escalation ${item.escalationStatus}`} tone={item.escalationStatus === "escalated" ? "warning" : item.escalationStatus === "resolved" ? "success" : "neutral"} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <ModuleBadge label={item.agentName} />
                          <ModuleBadge label={`Requested by ${item.requestedBy}`} />
                          <ModuleBadge label={timeAgo(item.requestedAt)} />
                        </div>
                      </div>
                      {isActionable ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              className="h-11 min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700"
                              value={approvalChainSelections[item.id] ?? item.chainId}
                              onChange={event =>
                                setApprovalChainSelections(current => ({
                                  ...current,
                                  [item.id]: Number(event.target.value),
                                }))
                              }
                            >
                              {data.approvalChains.map(chain => (
                                <option key={chain.id} value={chain.id}>
                                  {chain.name}
                                </option>
                              ))}
                            </select>
                            <Button
                              variant="outline"
                              className="rounded-xl border-slate-300"
                              disabled={assignChainMutation.isPending}
                              onClick={() =>
                                assignChainMutation.mutate({
                                  approvalId: item.id,
                                  chainId: approvalChainSelections[item.id] ?? item.chainId,
                                })
                              }
                            >
                              Kette anwenden
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button className="rounded-xl bg-slate-950 text-white hover:bg-slate-900" disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate({ approvalId: item.id, decision: "approved", note: `Stufe ${currentStage.name} bestätigt.` })}>Approve stage</Button>
                            <Button variant="outline" className="rounded-xl border-slate-300" disabled={resolveMutation.isPending} onClick={() => resolveMutation.mutate({ approvalId: item.id, decision: "rejected", note: `Stufe ${currentStage.name} abgelehnt.` })}>Reject workflow</Button>
                            <Button variant="outline" className="rounded-xl border-slate-300" disabled={escalateMutation.isPending} onClick={() => escalateMutation.mutate({ approvalId: item.id, reason: `Manuelle Eskalation für ${currentStage.name}.` })}>Escalate</Button>
                            <Button variant="outline" className="rounded-xl border-slate-300" disabled={notifyMutation.isPending} onClick={() => notifyMutation.mutate({ approvalTitle: `${item.title} · ${currentStage.name}`, severity: item.riskLevel })}>Notify</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Approver: {item.approver || currentStage?.ownerLabel || "–"}</div>
                      )}
                    </div>
                    <div className="grid gap-3 xl:grid-cols-3">
                      {item.stages.map(stage => (
                        <div key={stage.id} className={`rounded-2xl border px-4 py-4 ${stage.order === item.currentStageOrder && item.status === "pending" ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-900"}`}>
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold">{stage.order}. {stage.name}</p>
                            <ModuleBadge label={stage.status} tone={stage.status === "approved" ? "success" : stage.status === "rejected" ? "danger" : stage.status === "escalated" ? "warning" : "neutral"} />
                          </div>
                          <div className={`mt-3 space-y-2 text-sm ${stage.order === item.currentStageOrder && item.status === "pending" ? "text-slate-200" : "text-slate-600"}`}>
                            <p>Owner: {stage.ownerLabel}</p>
                            <p>Role: {stage.requiredRole}</p>
                            <p>SLA: {stage.slaMinutes} Min · Escalation: {stage.escalationAfterMinutes} Min</p>
                            <p>Target: {stage.escalationTarget}</p>
                            {stage.note ? <p>Note: {stage.note}</p> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Persistente Genehmigungsketten</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Benutzer können eigene Freigabemuster mit Eskalationslogik definieren, speichern und später erneut verwenden.</p>
              </div>
              <Button variant="outline" className="rounded-xl border-slate-300" onClick={() => setChainForm(createEmptyChainForm())}>Neue Kette</Button>
            </div>
            <div className="mt-5 space-y-3">
              {data.approvalChains.map(chain => (
                <button key={chain.id} className={`w-full rounded-2xl border px-4 py-4 text-left transition ${chainForm.id === chain.id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"}`} onClick={() => loadChain(chain)}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{chain.name}</p>
                    <ModuleBadge label={`${chain.stages.length} stages`} tone={chain.stages.length > 2 ? "warning" : "neutral"} />
                  </div>
                  <p className={`mt-2 text-sm leading-6 ${chainForm.id === chain.id ? "text-slate-200" : "text-slate-600"}`}>{chain.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ModuleBadge label={chain.escalationMode} tone="neutral" />
                    <ModuleBadge label={`Aktualisiert ${timeAgo(chain.updatedAt)}`} tone="neutral" />
                  </div>
                </button>
              ))}
            </div>
          </Surface>

          <Surface className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Genehmigungsketten-Editor</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Erstelle oder bearbeite mehrstufige Freigabemuster mit Rollen, Standard-Ownern, SLA und Eskalationszielen.</p>
              </div>
              <ModuleBadge label={chainForm.id ? "Bearbeiten" : "Neu"} tone={chainForm.id ? "warning" : "success"} />
            </div>
            <div className="mt-5 space-y-4">
              <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Name der Genehmigungskette" value={chainForm.name} onChange={e => setChainForm({ ...chainForm, name: e.target.value })} />
              <textarea className="min-h-[108px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Beschreibung und Einsatzzweck" value={chainForm.description} onChange={e => setChainForm({ ...chainForm, description: e.target.value })} />
              <select className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={chainForm.escalationMode} onChange={e => setChainForm({ ...chainForm, escalationMode: e.target.value as "serial" | "parallel" | "auto_escalate" })}>
                <option value="serial">serial</option>
                <option value="parallel">parallel</option>
                <option value="auto_escalate">auto_escalate</option>
              </select>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 text-xs leading-6 text-slate-600">
                Ziehe Stufen weiterhin vertikal für die Reihenfolge. Zusätzliche Drop-Zonen ordnen eine Stufe jetzt auch einem linearen Pfad, parallelen Reviews oder bedingten Verzweigungen zu.
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: "Linearer Pfad", description: "Standard-Reihenfolge für sequenzielle Freigaben.", stageMode: "serial" as const, laneKey: "main" as const },
                  { title: "Paralleler Pfad A", description: "Zusätzliche Freigabe parallel zum Hauptpfad.", stageMode: "parallel" as const, laneKey: "parallel-a" as const },
                  { title: "Paralleler Pfad B", description: "Zweiter paralleler Review-Strang.", stageMode: "parallel" as const, laneKey: "parallel-b" as const },
                  { title: "Bedingte Verzweigung", description: "Pfad für risiko- oder toolabhängige Sonderfreigaben.", stageMode: "branch" as const, laneKey: "branch-a" as const },
                ].map(zone => (
                  <div
                    key={zone.title}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                      event.preventDefault();
                      if (draggedStageIndex === null) return;
                      setChainForm(current => ({
                        ...current,
                        stages: moveStageToDropZone(current.stages, draggedStageIndex, {
                          stageMode: zone.stageMode,
                          laneKey: zone.laneKey,
                           branchSourceStageOrder: zone.stageMode === "branch" ? 1 : null,
                           branchLabel: zone.stageMode === "branch" ? "Nur bei Bedingung" : "",
                           branchField: zone.stageMode === "branch" ? "riskLevel" : undefined,

                        }),
                      }));
                      setDraggedStageIndex(null);
                      setDropStageIndex(null);
                    }}
                    className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 shadow-sm transition hover:border-slate-950 hover:bg-slate-50"
                  >
                    <p className="text-sm font-semibold text-slate-950">{zone.title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{zone.description}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {chainForm.stages.map((stage, index) => (
                  <div
                    key={`${chainForm.id ?? "new"}-${index}`}
                    draggable
                    onDragStart={() => {
                      setDraggedStageIndex(index);
                      setDropStageIndex(index);
                    }}
                    onDragOver={event => {
                      event.preventDefault();
                      setDropStageIndex(index);
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      if (draggedStageIndex === null) {
                        return;
                      }
                      setChainForm(current => ({
                        ...current,
                        stages: reorderApprovalChainStages(current.stages, draggedStageIndex, index),
                      }));
                      setDraggedStageIndex(null);
                      setDropStageIndex(null);
                    }}
                    onDragEnd={() => {
                      setDraggedStageIndex(null);
                      setDropStageIndex(null);
                    }}
                    className={`rounded-2xl border bg-slate-50 p-4 transition ${dropStageIndex === index ? "border-slate-950 ring-2 ring-slate-200" : "border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab rounded-xl border border-slate-200 bg-white p-2 text-slate-500 active:cursor-grabbing">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">Stufe {index + 1}</p>
                            <ModuleBadge label={getLaneLabel(stage.laneKey)} tone={stage.stageMode === "branch" ? "warning" : stage.stageMode === "parallel" ? "success" : "neutral"} />
                          </div>
                          <p className="text-xs text-slate-500">Drag-and-drop aktiviert</p>
                        </div>
                      </div>
                      {chainForm.stages.length > 1 ? (
                        <button className="text-xs font-medium text-slate-500 transition hover:text-rose-600" onClick={() => setChainForm({ ...chainForm, stages: chainForm.stages.filter((_, currentIndex) => currentIndex !== index) })}>
                          Entfernen
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm md:col-span-2" placeholder="Stage Name" value={stage.stageName} onChange={e => updateStage(index, item => ({ ...item, stageName: e.target.value }))} />
                        <select className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={stage.stageMode} onChange={e => updateStage(index, item => ({ ...item, stageMode: e.target.value as ApprovalChainStageDraft["stageMode"] }))}>
                          <option value="serial">serial</option>
                          <option value="parallel">parallel</option>
                          <option value="branch">branch</option>
                        </select>
                        <select className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={stage.laneKey} onChange={e => updateStage(index, item => ({ ...item, laneKey: e.target.value as ApprovalChainStageDraft["laneKey"] }))}>
                          <option value="main">main</option>
                          <option value="parallel-a">parallel-a</option>
                          <option value="parallel-b">parallel-b</option>
                          <option value="branch-a">branch-a</option>
                          <option value="branch-b">branch-b</option>
                        </select>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Required Role" value={stage.requiredRole} onChange={e => updateStage(index, item => ({ ...item, requiredRole: e.target.value }))} />
                        <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Standard Owner" value={stage.defaultApproverLabel} onChange={e => updateStage(index, item => ({ ...item, defaultApproverLabel: e.target.value }))} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <input type="number" className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="SLA in Minuten" value={stage.slaMinutes} onChange={e => updateStage(index, item => ({ ...item, slaMinutes: Number(e.target.value) }))} />
                        <input type="number" className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Eskalation nach Minuten" value={stage.escalationAfterMinutes} onChange={e => updateStage(index, item => ({ ...item, escalationAfterMinutes: Number(e.target.value) }))} />
                      </div>
                      <input className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Eskalationsziel" value={stage.escalationTargetLabel} onChange={e => updateStage(index, item => ({ ...item, escalationTargetLabel: e.target.value }))} />
                      {stage.stageMode === "parallel" ? (
                        <div className="grid gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 md:grid-cols-2 xl:grid-cols-3">
                          <select className="h-11 w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm" value={stage.quorumMode} onChange={e => updateStage(index, item => ({ ...item, quorumMode: e.target.value as ApprovalChainStageDraft["quorumMode"] }))}>
                            <option value="all">all</option>
                            <option value="majority">majority</option>
                            <option value="minimum_count">minimum_count</option>
                            <option value="distinct_roles">distinct_roles</option>
                          </select>
                          <input type="number" min={1} className="h-11 w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm" placeholder="Quorum-Ziel" value={stage.quorumTarget} onChange={e => updateStage(index, item => ({ ...item, quorumTarget: Number(e.target.value) || 1 }))} />
                          <div className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-xs leading-5 text-slate-600">
                            Sammel-Gate öffnet erst, wenn das konfigurierte Quorum für die aktiven Parallelstufen erreicht ist.
                          </div>
                        </div>
                      ) : null}
                      {stage.stageMode === "branch" ? (
                         <div className="grid gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 md:grid-cols-2 xl:grid-cols-5">
                           <input type="number" className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm" placeholder="Quellstufe" value={stage.branchSourceStageOrder ?? 1} onChange={e => updateStage(index, item => ({ ...item, branchSourceStageOrder: Number(e.target.value) }))} />
                           <input className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm" placeholder="Branch Label" value={stage.branchLabel} onChange={e => updateStage(index, item => ({ ...item, branchLabel: e.target.value }))} />
                           <select className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm" value={stage.branchField} onChange={e => updateStage(index, item => ({ ...item, branchField: e.target.value as ApprovalChainStageDraft["branchField"] }))}>
                             <option value="riskLevel">riskLevel</option>
                             <option value="requestedBy">requestedBy</option>
                             <option value="agentName">agentName</option>
                             <option value="title">title</option>
                             <option value="summary">summary</option>
                             <option value="chainName">chainName</option>
                             <option value="escalationStatus">escalationStatus</option>
                           </select>
                           <select className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm" value={stage.branchOperator} onChange={e => updateStage(index, item => ({ ...item, branchOperator: e.target.value as ApprovalChainStageDraft["branchOperator"] }))}>
                             <option value="always">always</option>
                             <option value="equals">equals</option>
                             <option value="contains">contains</option>
                             <option value="greater_than">greater_than</option>
                             <option value="less_than">less_than</option>
                           </select>
                           <input className="h-11 w-full rounded-2xl border border-amber-200 bg-white px-4 text-sm" placeholder="Vergleichswert" value={stage.branchValue} onChange={e => updateStage(index, item => ({ ...item, branchValue: e.target.value }))} />
                         </div>

                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">Grafische Simulationsansicht</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Prüfe vor dem Speichern, welche Stufen auf Basis strukturierter Signale wirklich aktiviert werden und welche Branches übersprungen bleiben.</p>
                  </div>
                  <ModuleBadge label={`${simulationPreview.filter(stage => stage.reachable).length}/${simulationPreview.length} aktiv im Preview`} tone="neutral" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {Object.entries(simulationSignals).map(([key, value]) => (
                    <label key={key} className="grid gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                      {key}
                      <input
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-normal tracking-normal text-slate-700"
                        value={value}
                        onChange={event => setSimulationSignals(current => ({ ...current, [key]: event.target.value }))}
                      />
                    </label>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">Zeitfenster-Simulation</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">Bewege den Zeitpunkt, um SLA-Fristen, Eskalationen und aktive Stufen entlang des geplanten Pfads zu prüfen.</p>
                    </div>
                    <ModuleBadge label={`T+${simulationMinute} Min`} tone="success" />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <input type="range" min={0} max={Math.max(simulationDuration, 1)} value={Math.min(simulationMinute, Math.max(simulationDuration, 1))} onChange={event => setSimulationMinute(Number(event.target.value))} className="w-full accent-slate-950" />
                    <input type="number" min={0} max={Math.max(simulationDuration, 1)} value={simulationMinute} onChange={event => setSimulationMinute(Number(event.target.value) || 0)} className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm md:w-28" />
                  </div>
                  <div className="mt-4 space-y-3">
                    {timelinePreview.map(stage => {
                      const total = Math.max(simulationDuration, 1);
                      const left = `${(stage.startMinute / total) * 100}%`;
                      const width = `${(Math.max(stage.endMinute - stage.startMinute, 1) / total) * 100}%`;
                      const slaLeft = `${(stage.slaDeadlineMinute / total) * 100}%`;
                      const escalationLeft = `${(stage.escalationMinute / total) * 100}%`;
                      const isCurrent = stage.reachable && simulationMinute >= stage.startMinute && simulationMinute <= stage.endMinute;
                      const afterEscalation = stage.reachable && simulationMinute >= stage.escalationMinute;
                      const afterSla = stage.reachable && simulationMinute >= stage.slaDeadlineMinute;

                      return (
                        <div key={`${stage.order}-${stage.stageName}-timeline`} className={`rounded-2xl border px-4 py-4 ${stage.reachable ? "border-slate-200 bg-white" : "border-slate-200/80 bg-slate-100/70"}`}>
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-950">{stage.order}. {stage.stageName}</p>
                                <ModuleBadge label={getLaneLabel(stage.laneKey)} tone={stage.stageMode === "branch" ? "warning" : stage.stageMode === "parallel" ? "success" : "neutral"} />
                                <ModuleBadge label={stage.reachable ? (isCurrent ? "Jetzt aktiv" : "Geplant") : "Nicht aktiv"} tone={stage.reachable ? (isCurrent ? "success" : "neutral") : "neutral"} />
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{stage.reason}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {stage.quorumLabel ? <ModuleBadge label={stage.quorumLabel} tone="success" /> : null}
                              {afterSla ? <ModuleBadge label="SLA erreicht" tone="warning" /> : null}
                              {afterEscalation ? <ModuleBadge label="Eskalation fällig" tone="danger" /> : null}
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="relative h-3 rounded-full bg-slate-200">
                              <div className={`absolute top-0 h-3 rounded-full ${stage.reachable ? "bg-slate-950" : "bg-slate-300"}`} style={{ left, width }} />
                              <div className="absolute top-[-4px] h-5 w-[2px] bg-amber-500" style={{ left: slaLeft }} />
                              <div className="absolute top-[-4px] h-5 w-[2px] bg-rose-500" style={{ left: escalationLeft }} />
                              <div className="absolute top-[-6px] h-6 w-[2px] bg-sky-600" style={{ left: `${(Math.min(simulationMinute, total) / total) * 100}%` }} />
                            </div>
                            <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                              <span>Start: T+{stage.startMinute}</span>
                              <span>SLA: T+{stage.slaDeadlineMinute}</span>
                              <span>Eskalation: T+{stage.escalationMinute}</span>
                              <span>Ende: T+{stage.endMinute}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {simulationPreview.map(stage => (
                    <div key={`${stage.order}-${stage.stageName}`} className={`rounded-2xl border px-4 py-4 ${stage.reachable ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white"}`}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">{stage.order}. {stage.stageName}</p>
                            <ModuleBadge label={getLaneLabel(stage.laneKey)} tone={stage.stageMode === "branch" ? "warning" : stage.stageMode === "parallel" ? "success" : "neutral"} />
                            <ModuleBadge label={stage.reachable ? "Aktiv im Pfad" : "Übersprungen"} tone={stage.reachable ? "success" : "neutral"} />
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{stage.reason}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {stage.quorumLabel ? <ModuleBadge label={stage.quorumLabel} tone="success" /> : null}
                          {stage.branchMatched === true ? <ModuleBadge label="Branch erfüllt" tone="warning" /> : null}
                          {stage.branchMatched === false ? <ModuleBadge label="Branch nicht erfüllt" tone="neutral" /> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-xl border-slate-300" onClick={() => setChainForm({
                  ...chainForm,
                  stages: [...chainForm.stages, createEmptyApprovalStageDraft()],
                })}>Stufe hinzufügen</Button>
                <Button className="rounded-xl bg-slate-950 text-white hover:bg-slate-900" disabled={createChainMutation.isPending || updateChainMutation.isPending} onClick={saveChain}>{chainForm.id ? "Kette aktualisieren" : "Kette speichern"}</Button>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export function AuditPage() {
  const { data, isLoading, error } = useSnapshot();
  const [filter, setFilter] = useState("all");
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const filtered = data.auditEvents.filter(event => filter === "all" ? true : event.severity === filter);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Traceability"
        title="Audit Log"
        description="Vollständige, filterbare Protokollierung aller Agentenentscheidungen, Tool-Aufrufe und Governance-Ereignisse mit klarer zeitlicher Nachvollziehbarkeit."
        actions={
          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            {(["all", "info", "warning", "critical"] as const).map(option => (
              <button key={option} className={`rounded-xl px-3 py-2 text-xs font-medium ${filter === option ? "bg-slate-950 text-white" : "text-slate-600"}`} onClick={() => setFilter(option)}>
                {option}
              </button>
            ))}
          </div>
        }
      />
      <Surface className="p-6">
        <div className="space-y-3">
          {filtered.map(event => (
            <div key={event.id} className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                    <ModuleBadge label={event.severity} tone={event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "success"} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{event.detail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <ModuleBadge label={event.agentName} />
                    <ModuleBadge label={event.category} />
                    <ModuleBadge label={`${event.actorType}: ${event.actorRef}`} />
                  </div>
                </div>
                <div className="text-xs text-slate-500">{timeAgo(event.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

export function ConnectorsPage() {
  const { data, isLoading, error } = useSnapshot();
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Integrations" title="Tool & Connector Layer" description="Verwalte Systemverbindungen zu CRM, ERP, E-Mail, Browser und Datenbanken mit Status- und Zugriffsübersicht." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.connectors.map(connector => (
          <Surface key={connector.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950">{connector.name}</p>
                <p className="mt-1 text-sm text-slate-500">{connector.type}</p>
              </div>
              <ModuleBadge label={connector.status} tone={connector.status === "connected" ? "success" : connector.status === "degraded" ? "warning" : "danger"} />
            </div>
            <div className="mt-5 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex justify-between"><span>Endpoint</span><span className="font-medium text-slate-950">{connector.endpointLabel}</span></div>
              <div className="flex justify-between"><span>Auth Mode</span><span className="font-medium text-slate-950">{connector.authMode}</span></div>
              <div className="flex justify-between"><span>Linked Agents</span><span className="font-medium text-slate-950">{connector.linkedAgents}</span></div>
              <div className="flex justify-between"><span>Last Sync</span><span className="font-medium text-slate-950">{timeAgo(connector.lastSyncAt)}</span></div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function EvaluationsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const runMutation = trpc.evaluations.run.useMutation({
    onSuccess: async () => {
      toast.success("Pre-Deployment-Evaluation ausgeführt");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const [form, setForm] = useState({ agentId: 1, name: "", expectedOutcome: "" });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Validation" title="Evaluation Layer" description="Testfälle prüfen, Policy-Konformität messen und Agenten vor dem Deployment gegen definierte Kriterien validieren." />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {data.evaluations.map(item => (
              <div key={item.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.agentName}</p>
                  </div>
                  <ModuleBadge label={item.status} tone={item.status === "passed" ? "success" : item.status === "failed" ? "danger" : "warning"} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Score</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.score}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pass Rate</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.policyPassRate}%</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{item.summary}</p>
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Testfall definieren und vor Deployment ausführen</p>
          <div className="mt-5 grid gap-4">
            <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.agentId} onChange={e => setForm({ ...form, agentId: Number(e.target.value) })}>
              {data.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Testfallname" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <textarea className="min-h-[128px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Erwartetes Ergebnis" value={form.expectedOutcome} onChange={e => setForm({ ...form, expectedOutcome: e.target.value })} />
            <Button className="h-11 rounded-2xl bg-slate-950 text-white hover:bg-slate-900" disabled={runMutation.isPending} onClick={() => {
              if (!form.name || !form.expectedOutcome) {
                toast.error("Bitte Testfallname und erwartetes Ergebnis ausfüllen.");
                return;
              }
              runMutation.mutate(form);
              setForm({ ...form, name: "", expectedOutcome: "" });
            }}>Pre-Deployment-Check ausführen</Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function GuardrailsPage() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = useSnapshot();
  const triggerMutation = trpc.guardrails.trigger.useMutation({
    onSuccess: async () => {
      toast.success("Guardrail ausgelöst und Agent pausiert");
      await utils.controlPlane.snapshot.invalidate();
    },
  });
  const [form, setForm] = useState({ agentId: 1, triggerType: "cost_threshold", thresholdLabel: "Budget > 25 USD", detail: "" });
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Runtime safety" title="Runtime Guardrails" description="Live-Überwachung, automatische Stopps und Sichtbarkeit über Policy-Verstöße, Kostenlimits und Anomalien im Betrieb." />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface className="p-6">
          <div className="space-y-3">
            {data.guardrails.map(item => (
              <div key={item.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">{item.agentName}</p>
                      <ModuleBadge label={item.status} tone={item.status === "resolved" ? "success" : item.status === "monitoring" ? "warning" : "danger"} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ModuleBadge label={item.triggerType} />
                      <ModuleBadge label={item.thresholdLabel} />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">{timeAgo(item.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Guardrail simulieren</p>
          <div className="mt-5 grid gap-4">
            <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.agentId} onChange={e => setForm({ ...form, agentId: Number(e.target.value) })}>
              {data.agents.map(agent => <option key={agent.id} value={agent.id}>{agent.name}</option>)}
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" value={form.triggerType} onChange={e => setForm({ ...form, triggerType: e.target.value })}>
              <option value="policy_violation">policy_violation</option>
              <option value="cost_threshold">cost_threshold</option>
              <option value="tool_anomaly">tool_anomaly</option>
              <option value="latency_spike">latency_spike</option>
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm" placeholder="Threshold Label" value={form.thresholdLabel} onChange={e => setForm({ ...form, thresholdLabel: e.target.value })} />
            <textarea className="min-h-[128px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Detail" value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })} />
            <Button className="h-11 rounded-2xl bg-slate-950 text-white hover:bg-slate-900" disabled={triggerMutation.isPending} onClick={() => {
              if (!form.detail || !form.thresholdLabel) {
                toast.error("Bitte Threshold und Detail ausfüllen.");
                return;
              }
              triggerMutation.mutate(form);
              setForm({ ...form, detail: "" });
            }}>Guardrail auslösen</Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function ObservabilityPage() {
  const { data, isLoading, error } = useSnapshot();
  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const latencyData = data.metrics.map(item => ({ name: item.agentName.split(" ")[0], latency: item.latencyMs, errorRate: item.errorRate }));
  const costData = data.metrics.map(item => ({ name: item.agentName.split(" ")[0], cost: item.apiCostUsd, tokens: item.tokenUsage / 1000 }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Monitoring" title="Observability & Cost Monitoring" description="Echtzeit-Metriken zu Latenz, Fehlerrate, API-Kosten und Token-Verbrauch verdichten die operative Sicht auf Performance und Wirtschaftlichkeit." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Latenz und Fehlerrate</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyData}>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="latency" fill="#0f172a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
        <Surface className="p-6">
          <p className="text-sm font-semibold text-slate-950">Kosten und Token-Verbrauch</p>
          <div className="mt-6 h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costData}>
                <defs>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#334155" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#334155" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="cost" stroke="#334155" fill="url(#costGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </div>
      <Surface className="p-6">
        <div className="grid gap-4 md:grid-cols-3">
          {data.metrics.map(item => (
            <div key={item.id} className="rounded-[24px] border border-slate-200/80 bg-white px-5 py-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">{item.agentName}</p>
              <div className="mt-4 grid gap-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Latenz</span><span className="font-medium text-slate-950">{item.latencyMs} ms</span></div>
                <div className="flex justify-between"><span>Fehlerrate</span><span className="font-medium text-slate-950">{item.errorRate}%</span></div>
                <div className="flex justify-between"><span>API-Kosten</span><span className="font-medium text-slate-950">{formatCurrency(item.apiCostUsd)}</span></div>
                <div className="flex justify-between"><span>Tokens</span><span className="font-medium text-slate-950">{formatNumber(item.tokenUsage)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

function OverviewPill({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-700">{icon}</div>
        <div>
          <p className="text-sm font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const modules = useMemo(
    () => [
      { icon: <BrainCircuit className="h-4 w-4" />, title: "Agenten-Verwaltung", description: "Registrierung, Konfiguration und Status-Monitoring" },
      { icon: <Shield className="h-4 w-4" />, title: "Policy Engine", description: "Erlaubte, verbotene und freigabepflichtige Aktionen" },
      { icon: <BellRing className="h-4 w-4" />, title: "Approval Workflow", description: "Menschliche Freigabe für kritische Aktionen" },
      { icon: <Fingerprint className="h-4 w-4" />, title: "Audit Log", description: "Filterbare Nachvollziehbarkeit aller Ereignisse" },
      { icon: <Blocks className="h-4 w-4" />, title: "Tool & Connector Layer", description: "CRM-, ERP-, E-Mail-, Browser- und Datenbank-Verbindungen" },
      { icon: <Activity className="h-4 w-4" />, title: "Runtime Guardrails", description: "Live-Überwachung und automatisches Stoppen" },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <Surface className="overflow-hidden p-0">
        <div className="relative bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_38%),linear-gradient(135deg,#0f172a_0%,#111827_48%,#1e293b_100%)] px-6 py-8 md:px-8 md:py-10">
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_28%,transparent_72%,rgba(255,255,255,0.06))]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
            <div>
              <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/10">Elegant Enterprise Surface</Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">
                AI-Agent-Governance- und Operations-Dashboard
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Eine zentrale Plattform für Steuerung, Überwachung und Absicherung agentischer Systeme – mit Policy Engine, Approval Workflow, Audit Log, Runtime Guardrails und präzisem Kostenmonitoring.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ModuleBadge label="Governance-ready" tone="success" />
                <ModuleBadge label="Human-in-the-loop" tone="warning" />
                <ModuleBadge label="Auditierbar" tone="neutral" />
              </div>
            </div>
            <div className="grid gap-3">
              <OverviewPill icon={<Sparkles className="h-4 w-4" />} title="Executive visibility" description="Klar priorisierte Kennzahlen und Risikoindikatoren für operative Entscheidungen." />
              <OverviewPill icon={<Waypoints className="h-4 w-4" />} title="Policy to action traceability" description="Vom Regelwerk über die Aktion bis zur Freigabe bleibt jeder Schritt nachvollziehbar." />
              <OverviewPill icon={<ChartNoAxesCombined className="h-4 w-4" />} title="Cost-aware runtime operations" description="Kosten, Tokens, Latenz und Fehlerraten sind Teil derselben Steuerungsoberfläche." />
            </div>
          </div>
        </div>
      </Surface>
      <DashboardOverviewPage />
    </div>
  );
}
