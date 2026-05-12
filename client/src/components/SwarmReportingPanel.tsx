import * as React from "react";
import {
  getSwarmReportingDrilldownItems,
  getSwarmReportingStats,
  type SwarmCommunicationLinkWithNames,
  type SwarmGovernanceForInsights,
  type SwarmReportingMetricKey,
} from "@/lib/swarm-insights";
import { buildSwarmReportCsv, buildSwarmReportPdfBlob } from "@/lib/swarm-report-export";
import { toast } from "sonner";

const metricMeta: Record<SwarmReportingMetricKey, { label: string; hint: (governance: SwarmGovernanceForInsights, escalatedLinks: number) => string }> = {
  messages: {
    label: "Nachrichtenfenster",
    hint: governance => `letzte ${governance.reportingWindowHours} Stunden`,
  },
  approvals: {
    label: "Approval-Ereignisse",
    hint: () => "Schwarmweite Freigaben im Zeitfenster",
  },
  sla: {
    label: "SLA verletzt",
    hint: governance => `Pfad älter als ${governance.slaMinutes} Minuten`,
  },
  response: {
    label: "Ø Reaktionsalter",
    hint: (_governance, escalatedLinks) => `${escalatedLinks} Pfade über Eskalationsgrenze`,
  },
};

type ExportHistoryEntry = {
  id: number;
  swarmId: number;
  format: "csv" | "pdf";
  triggerSource: "manual" | "approval" | "subscription";
  triggeredByLabel: string;
  requesterRole: "user" | "admin" | "system";
  reportWindowHours: number;
  communicationLinkCount: number;
  approvalMessageCount: number;
  overdueLinkCount: number;
  averageResponseMinutes: number;
  createdAt: number;
};

type DownloadApprovalEntry = {
  id: number;
  swarmId: number;
  format: "csv" | "pdf";
  requestStatus: "pending" | "approved" | "rejected" | "consumed";
  requiredRoleLabel: string;
  requestedByLabel: string;
  requestedBySystemRole: "user" | "admin";
  approvedByLabel: string | null;
  reason: string;
  sensitivityLabel: string;
  createdAt: number;
  resolvedAt: number | null;
};

type SubscriptionEntry = {
  id: number;
  swarmId: number;
  cadence: "daily" | "weekly" | "monthly";
  format: "csv" | "pdf";
  recipientRoleLabel: string;
  createdByLabel: string;
  isActive: boolean;
  nextRunAt: number;
  lastRunAt: number | null;
};

type AutonomyRunEntry = {
  id: number;
  swarmId: number;
  objective: string;
  context: string | null;
  priority: "standard" | "urgent" | "critical";
  status: "planned" | "running" | "awaiting_approval" | "blocked" | "paused" | "completed" | "cancelled" | "failed";
  governanceStatus: "clear" | "approval_required" | "blocked";
  requestedByLabel: string;
  requestedByRole: "user" | "admin" | "system";
  summary: string;
  startedAt: number | null;
  completedAt: number | null;
  createdAt: number;
  lastEventAt: number;
  steps: Array<{
    id: number;
    assignedAgentId: number;
    assignedAgentName: string;
    title: string;
    instructions: string;
    status: "pending" | "in_progress" | "completed" | "blocked" | "awaiting_input" | "skipped" | "cancelled";
    sequence: number;
    output: string | null;
    completedAt: number | null;
  }>;
  events: Array<{
    id: number;
    stepId: number | null;
    eventType: "planned" | "delegated" | "feedback" | "governance" | "paused" | "resumed" | "cancelled" | "completed" | "failed";
    actorLabel: string;
    detail: string;
    createdAt: number;
  }>;
};

function getMetricValue(metric: SwarmReportingMetricKey, stats: ReturnType<typeof getSwarmReportingStats>) {
  switch (metric) {
    case "messages":
      return `${stats.messageWindowCount}`;
    case "approvals":
      return `${stats.approvalMessages}`;
    case "sla":
      return `${stats.overdueLinks}`;
    case "response":
      return `${stats.averageResponseMinutes} min`;
  }
}

function getRunTone(status: AutonomyRunEntry["status"], governanceStatus: AutonomyRunEntry["governanceStatus"]) {
  if (status === "blocked" || status === "failed" || governanceStatus === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "awaiting_approval" || status === "paused" || governanceStatus === "approval_required") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border-indigo-200 bg-indigo-50 text-indigo-700";
}

export function SwarmReportingPanel({
  swarm,
  selectedMetric,
  selectedLinkId,
  currentUserRole = "user",
  exportHistory = [],
  downloadApprovals = [],
  subscriptions = [],
  autonomyRuns = [],
  timeAgo = timestamp => `${Math.max(0, Math.round((Date.now() - timestamp) / (1000 * 60)))} min`,
  isRequestPending = false,
  isApprovalPending = false,
  isSubscriptionPending = false,
  isAutonomyRunPending = false,
  isAutonomyActionPending = false,
  onSelectMetric,
  onSelectLink,
  onRequestDownload = async () => ({ status: "approved" as const }),
  onResolveDownloadApproval = async () => undefined,
  onCreateSubscription = async () => undefined,
  onCreateAutonomyRun = async () => undefined,
  onControlAutonomyRun = async () => undefined,
}: {
  swarm: {
    id: number;
    name?: string;
    objective?: string;
    communicationLinks: SwarmCommunicationLinkWithNames[];
    governance: SwarmGovernanceForInsights;
  };
  selectedMetric: SwarmReportingMetricKey;
  selectedLinkId: number | null;
  currentUserRole?: "user" | "admin";
  exportHistory?: ExportHistoryEntry[];
  downloadApprovals?: DownloadApprovalEntry[];
  subscriptions?: SubscriptionEntry[];
  autonomyRuns?: AutonomyRunEntry[];
  timeAgo?: (timestamp: number) => string;
  isRequestPending?: boolean;
  isApprovalPending?: boolean;
  isSubscriptionPending?: boolean;
  isAutonomyRunPending?: boolean;
  isAutonomyActionPending?: boolean;
  onSelectMetric: (metric: SwarmReportingMetricKey) => void;
  onSelectLink: (linkId: number | null) => void;
  onRequestDownload?: (payload: { format: "csv" | "pdf"; reason: string }) => Promise<{ status: "approved" | "pending" }>;
  onResolveDownloadApproval?: (payload: { approvalId: number; decision: "approved" | "rejected" }) => Promise<void>;
  onCreateSubscription?: (payload: {
    cadence: "daily" | "weekly" | "monthly";
    format: "csv" | "pdf";
    recipientRoleLabel: string;
    startImmediately: boolean;
  }) => Promise<void>;
  onCreateAutonomyRun?: (payload: {
    objective: string;
    context?: string;
    priority: "standard" | "urgent" | "critical";
  }) => Promise<void>;
  onControlAutonomyRun?: (payload: {
    runId: number;
    action: "pause" | "resume" | "cancel" | "approve";
  }) => Promise<void>;
}) {
  const stats = getSwarmReportingStats(swarm);
  const activeItems = getSwarmReportingDrilldownItems(swarm, selectedMetric);
  const activeMeta = metricMeta[selectedMetric];
  const [exportFallback, setExportFallback] = React.useState<{ type: "csv" | "pdf"; url: string; filename: string } | null>(null);
  const [exportReason, setExportReason] = React.useState("Governance-Review des Schwarm-Reportings");
  const [subscriptionCadence, setSubscriptionCadence] = React.useState<"daily" | "weekly" | "monthly">("weekly");
  const [subscriptionFormat, setSubscriptionFormat] = React.useState<"csv" | "pdf">("pdf");
  const [recipientRoleLabel, setRecipientRoleLabel] = React.useState("operations_lead");
  const [startImmediately, setStartImmediately] = React.useState(true);
  const [autonomyObjective, setAutonomyObjective] = React.useState("");
  const [autonomyContext, setAutonomyContext] = React.useState("");
  const [autonomyPriority, setAutonomyPriority] = React.useState<"standard" | "urgent" | "critical">("standard");
  const exportableSwarm = {
    ...swarm,
    name: swarm.name ?? `Schwarm ${swarm.id}`,
    objective: swarm.objective ?? "Keine Zielsetzung hinterlegt.",
  };

  React.useEffect(() => () => {
    if (exportFallback?.url) {
      URL.revokeObjectURL(exportFallback.url);
    }
  }, [exportFallback]);

  const triggerDownload = (blob: Blob, filename: string, type: "csv" | "pdf") => {
    if (exportFallback?.url) {
      URL.revokeObjectURL(exportFallback.url);
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    setExportFallback({ type, url, filename });
    if (typeof anchor.click !== "function") {
      toast.error(`Der ${type.toUpperCase()}-Download konnte nicht automatisch gestartet werden. Nutzen Sie den direkten Fallback-Link.`);
      return;
    }
    anchor.click();
    toast.info(`Falls der ${type.toUpperCase()}-Download nicht startet, nutzen Sie den direkten Fallback-Link.`);
  };

  const startApprovedDownload = async (format: "csv" | "pdf") => {
    const filename = `${exportableSwarm.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-report.${format}`;
    if (format === "csv") {
      const csv = buildSwarmReportCsv(exportableSwarm);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerDownload(blob, filename, "csv");
      return;
    }
    const blob = await buildSwarmReportPdfBlob(exportableSwarm);
    triggerDownload(blob, filename, "pdf");
  };

  const handleRequestDownload = async (format: "csv" | "pdf") => {
    try {
      const sanitizedReason = exportReason.trim();
      if (sanitizedReason.length < 6) {
        toast.error("Bitte begründen Sie den Report-Download mit mindestens 6 Zeichen.");
        return;
      }
      const result = await onRequestDownload({ format, reason: sanitizedReason });
      if (result.status === "pending") {
        toast.info("Der Download wurde als sensibler Report registriert und wartet auf eine Freigabe.");
        return;
      }
      await startApprovedDownload(format);
    } catch (error) {
      console.error(error);
      toast.error(`Der ${format.toUpperCase()}-Report konnte nicht vorbereitet werden.`);
    }
  };

  const handleCreateSubscription = async () => {
    const trimmedRecipient = recipientRoleLabel.trim();
    if (trimmedRecipient.length < 2) {
      toast.error("Bitte hinterlegen Sie eine Empfängerrolle oder ein Zielteam für das Abo.");
      return;
    }
    try {
      await onCreateSubscription({
        cadence: subscriptionCadence,
        format: subscriptionFormat,
        recipientRoleLabel: trimmedRecipient,
        startImmediately,
      });
      toast.success("Governance-Report-Abo gespeichert.");
    } catch (error) {
      console.error(error);
      toast.error("Das Governance-Report-Abo konnte nicht gespeichert werden.");
    }
  };

  const handleCreateAutonomyRun = async () => {
    const trimmedObjective = autonomyObjective.trim();
    const trimmedContext = autonomyContext.trim();
    if (trimmedObjective.length < 12) {
      toast.error("Bitte hinterlegen Sie ein Ziel mit mindestens 12 Zeichen für den autonomen Schwarmauftrag.");
      return;
    }
    try {
      await onCreateAutonomyRun({
        objective: trimmedObjective,
        context: trimmedContext.length > 0 ? trimmedContext : undefined,
        priority: autonomyPriority,
      });
      setAutonomyObjective("");
      setAutonomyContext("");
      setAutonomyPriority("standard");
      toast.success("Autonomer Schwarmauftrag angelegt.");
    } catch (error) {
      console.error(error);
      toast.error("Der autonome Schwarmauftrag konnte nicht angelegt werden.");
    }
  };

  const handleAutonomyAction = async (runId: number, action: "pause" | "resume" | "cancel" | "approve") => {
    try {
      await onControlAutonomyRun({ runId, action });
      toast.success(action === "approve" ? "Governance-Freigabe erteilt" : action === "cancel" ? "Autonomer Lauf beendet" : action === "pause" ? "Autonomer Lauf pausiert" : "Autonomer Lauf fortgesetzt");
    } catch (error) {
      console.error(error);
      toast.error("Die Aktion für den autonomen Schwarmauftrag konnte nicht ausgeführt werden.");
    }
  };

  const pendingApprovals = downloadApprovals.filter(item => item.requestStatus === "pending");
  const recentHistory = exportHistory.slice(0, 4);
  const recentAutonomyRuns = autonomyRuns.slice(0, 4);

  return (
    <div className="mt-4 min-w-0 overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Schwarm-Reporting</p>
        <p className="text-[11px] text-slate-400" data-testid={`swarm-reporting-context-${swarm.id}`}>
          Aktiver Reporting-Kontext: {activeMeta.label} · {activeItems.length} betroffene Pfade
        </p>
      </div>
      <div className="mt-3 flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {(Object.keys(metricMeta) as SwarmReportingMetricKey[]).map(metric => {
            const meta = metricMeta[metric];
            const selected = metric === selectedMetric;
            return (
              <button
                key={metric}
                type="button"
                aria-pressed={selected}
                className={`rounded-2xl border px-3 py-3 text-left transition ${selected ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-100 bg-slate-50 hover:border-slate-200"}`}
                onClick={() => onSelectMetric(metric)}
              >
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{meta.label}</p>
                <p className={`mt-2 text-xl font-semibold ${metric === "sla" ? "text-amber-700" : "text-slate-950"}`}>{getMetricValue(metric, stats)}</p>
                <p className="mt-1 text-xs text-slate-500">{meta.hint(swarm.governance, stats.escalatedLinks)}</p>
              </button>
            );
          })}
        </div>
        <div className="grid min-w-0 gap-2 xl:w-full xl:max-w-[280px] xl:flex-none">
          <textarea
            className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            value={exportReason}
            onChange={event => setExportReason(event.target.value)}
            placeholder="Begründung für den Report-Download"
          />
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
            onClick={() => void handleRequestDownload("csv")}
            disabled={isRequestPending}
          >
            CSV exportieren
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60"
            onClick={() => void handleRequestDownload("pdf")}
            disabled={isRequestPending}
          >
            PDF herunterladen
          </button>
          <p className="text-xs leading-5 text-slate-500">Sensible Schwärme erzeugen zuerst einen serverseitigen Freigabeantrag. Genehmigte Downloads werden revisionssicher in der Export-Historie protokolliert.</p>
          {exportFallback ? (
            <a
              href={exportFallback.url}
              download={exportFallback.filename}
              className="text-xs font-medium text-indigo-600 underline-offset-4 hover:underline"
              data-testid={`swarm-export-fallback-${swarm.id}`}
            >
              {exportFallback.type.toUpperCase()} direkt herunterladen
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-4 min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 p-3" data-testid={`swarm-reporting-drilldown-${swarm.id}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Drilldown</p>
            <p className="mt-1 text-sm text-slate-600">{activeMeta.label} zeigt die aktuell betroffenen Kommunikationspfade.</p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-slate-500 transition hover:text-slate-700"
            onClick={() => onSelectLink(null)}
          >
            Auswahl zurücksetzen
          </button>
        </div>
        <div className="mt-3 grid gap-2">
          {activeItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">
              Für diese Kennzahl liegen aktuell keine betroffenen Kommunikationspfade vor.
            </div>
          ) : (
            activeItems.map(item => {
              const selected = item.linkId === selectedLinkId;
              return (
                <button
                  key={`${selectedMetric}-${item.linkId}`}
                  type="button"
                  aria-label={`Kommunikationspfad ${item.title}`}
                  aria-pressed={selected}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${selected ? "border-indigo-300 bg-indigo-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  onClick={() => onSelectLink(item.linkId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.severity === "danger" ? "text-rose-600" : item.severity === "warning" ? "text-amber-700" : item.severity === "success" ? "text-emerald-700" : "text-slate-700"}`}>{item.valueLabel}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">Kommunikationspfad</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Export-Historie</p>
              <p className="mt-1 text-sm text-slate-600">Zeitstempel, Auslöser und Kennzahlen der letzten serverseitig registrierten Schwarm-Reports.</p>
            </div>
            <span className="text-xs text-slate-500">{exportHistory.length} Einträge</span>
          </div>
          <div className="mt-3 grid gap-2">
            {recentHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Noch keine serverseitigen Report-Exporte registriert.</div>
            ) : recentHistory.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-950">{item.format.toUpperCase()} · {item.triggerSource}</p>
                  <p className="text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">Ausgelöst von {item.triggeredByLabel} · Rolle {item.requesterRole}</p>
                <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Fenster: {item.reportWindowHours} h</span>
                  <span>Pfade: {item.communicationLinkCount}</span>
                  <span>Approvals: {item.approvalMessageCount}</span>
                  <span>SLA verletzt: {item.overdueLinkCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Download-Freigaben</p>
            <p className="mt-1 text-sm text-slate-600">Sensible CSV-/PDF-Downloads werden serverseitig beantragt und von Admin-Rollen freigegeben.</p>
          </div>
          <div className="mt-3 grid gap-2">
            {downloadApprovals.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Aktuell keine sensiblen Download-Anträge.</div>
            ) : downloadApprovals.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.format.toUpperCase()} · {item.requestStatus}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.requestedByLabel} · benötigt Rolle {item.requiredRoleLabel}</p>
                  </div>
                  <p className="text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{item.reason}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.sensitivityLabel}</p>
                {item.requestStatus === "pending" && currentUserRole === "admin" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-60"
                      disabled={isApprovalPending}
                      onClick={() => void onResolveDownloadApproval({ approvalId: item.id, decision: "approved" })}
                    >
                      Freigeben
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-60"
                      disabled={isApprovalPending}
                      onClick={() => void onResolveDownloadApproval({ approvalId: item.id, decision: "rejected" })}
                    >
                      Ablehnen
                    </button>
                  </div>
                ) : null}
                {item.approvedByLabel ? <p className="mt-2 text-xs text-slate-500">Bearbeitet durch {item.approvedByLabel}</p> : null}
              </div>
            ))}
            {pendingApprovals.length > 0 && currentUserRole !== "admin" ? (
              <p className="text-xs text-amber-700">Offene sensible Downloads warten auf eine Admin-Freigabe. Nach Genehmigung kann derselbe Export erneut gestartet werden.</p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-4 min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 p-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Governance-Report-Abos</p>
          <p className="mt-1 text-sm text-slate-600">Zeitgesteuerte Reports werden serverseitig registriert und bei Fälligkeit automatisch in die Export-Historie geschrieben.</p>
        </div>
        <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
            <select className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900" value={subscriptionCadence} onChange={event => setSubscriptionCadence(event.target.value as "daily" | "weekly" | "monthly") }>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
              <option value="monthly">Monatlich</option>
            </select>
            <select className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900" value={subscriptionFormat} onChange={event => setSubscriptionFormat(event.target.value as "csv" | "pdf") }>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
            <input className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900" value={recipientRoleLabel} onChange={event => setRecipientRoleLabel(event.target.value)} placeholder="Empfängerrolle oder Zielteam" />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <input type="checkbox" checked={startImmediately} onChange={event => setStartImmediately(event.target.checked)} />
              Erste Ausführung sofort vormerken
            </label>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
              disabled={isSubscriptionPending}
              onClick={() => void handleCreateSubscription()}
            >
              Governance-Abo speichern
            </button>
          </div>
          <div className="grid gap-2">
            {subscriptions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Noch keine automatischen Governance-Reports registriert.</div>
            ) : subscriptions.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{item.cadence} · {item.format.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500">Empfänger: {item.recipientRoleLabel} · erstellt von {item.createdByLabel}</p>
                  </div>
                  <p className="text-xs text-slate-400">{item.isActive ? "aktiv" : "pausiert"}</p>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Nächster Lauf: {timeAgo(item.nextRunAt)}</span>
                  <span>Letzter Lauf: {item.lastRunAt ? timeAgo(item.lastRunAt) : "noch keiner"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 min-w-0 rounded-2xl border border-slate-100 bg-slate-50/90 p-3" data-testid={`swarm-autonomy-panel-${swarm.id}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Autonomer Agenten-Schwarm</p>
            <p className="mt-1 text-sm text-slate-600">Der Schwarm zerlegt Ziele in Teilaufgaben, delegiert sie an Mitglieder und dokumentiert Governance-relevante Rückmeldungen im Ereignisverlauf.</p>
          </div>
          <span className="text-xs text-slate-500">{autonomyRuns.length} Läufe</span>
        </div>
        <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
            <textarea
              className="min-h-[96px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              value={autonomyObjective}
              onChange={event => setAutonomyObjective(event.target.value)}
              placeholder="Ziel des autonomen Schwarmauftrags, z. B. Incident analysieren, Kommunikationspfade priorisieren und Abschlussstatus erzeugen"
            />
            <textarea
              className="min-h-[88px] rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              value={autonomyContext}
              onChange={event => setAutonomyContext(event.target.value)}
              placeholder="Kontext, Risiken oder zusätzliche Vorgaben für die autonome Abarbeitung"
            />
            <select className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900" value={autonomyPriority} onChange={event => setAutonomyPriority(event.target.value as "standard" | "urgent" | "critical") }>
              <option value="standard">Standard</option>
              <option value="urgent">Dringend</option>
              <option value="critical">Kritisch</option>
            </select>
            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
              disabled={isAutonomyRunPending}
              onClick={() => void handleCreateAutonomyRun()}
            >
              Autonomen Schwarmauftrag starten
            </button>
            <p className="text-xs leading-5 text-slate-500">Sensible Ziele werden automatisch in den Governance-Status „Freigabe erforderlich“ oder „blockiert“ überführt. Admins können solche Läufe anschließend kontrolliert freigeben.</p>
          </div>
          <div className="grid gap-3">
            {recentAutonomyRuns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Für diesen Schwarm wurden noch keine autonomen Aufträge gestartet.</div>
            ) : recentAutonomyRuns.map(run => (
              <div key={run.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">Autonomer Lauf #{run.id}</p>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] ${getRunTone(run.status, run.governanceStatus)}`}>{run.status}</span>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-600">{run.priority}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{run.objective}</p>
                    {run.context ? <p className="mt-1 text-xs leading-5 text-slate-500">{run.context}</p> : null}
                    <p className="mt-2 text-xs text-slate-500">Angelegt von {run.requestedByLabel} · Rolle {run.requestedByRole} · letztes Signal {timeAgo(run.lastEventAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {run.status === "awaiting_approval" && currentUserRole === "admin" ? (
                      <button type="button" className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 disabled:opacity-60" disabled={isAutonomyActionPending} onClick={() => void handleAutonomyAction(run.id, "approve")}>Freigeben</button>
                    ) : null}
                    {run.status === "running" ? (
                      <button type="button" className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 disabled:opacity-60" disabled={isAutonomyActionPending} onClick={() => void handleAutonomyAction(run.id, "pause")}>Pausieren</button>
                    ) : null}
                    {run.status === "paused" || run.status === "planned" ? (
                      <button type="button" className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 disabled:opacity-60" disabled={isAutonomyActionPending} onClick={() => void handleAutonomyAction(run.id, "resume")}>Fortsetzen</button>
                    ) : null}
                    {!["completed", "cancelled"].includes(run.status) ? (
                      <button type="button" className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-60" disabled={isAutonomyActionPending} onClick={() => void handleAutonomyAction(run.id, "cancel")}>Stoppen</button>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Governance & Zusammenfassung</p>
                  <p className="mt-2 text-sm text-slate-700">{run.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">Governance-Status: {run.governanceStatus} · Schritte: {run.steps.length} · Ereignisse: {run.events.length}</p>
                </div>
                <div className="mt-3 grid min-w-0 gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Delegationsplan</p>
                    <div className="mt-2 grid gap-2">
                      {run.steps.map(step => (
                        <div key={step.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{step.sequence}. {step.title}</p>
                              <p className="mt-1 text-xs text-slate-500">Zugewiesen an {step.assignedAgentName}</p>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-600">{step.status}</span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-500">{step.instructions}</p>
                          {step.output ? <p className="mt-2 text-xs leading-5 text-slate-600">{step.output}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ereignisverlauf</p>
                    <div className="mt-2 grid gap-2">
                      {run.events.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500">Noch keine Rückmeldungen für diesen autonomen Lauf.</div>
                      ) : run.events.slice(-5).reverse().map(event => (
                        <div key={event.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{event.eventType}</p>
                            <p className="text-xs text-slate-400">{timeAgo(event.createdAt)}</p>
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-900">{event.actorLabel}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{event.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
