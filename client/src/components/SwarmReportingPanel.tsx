import React from "react";
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

export function SwarmReportingPanel({
  swarm,
  selectedMetric,
  selectedLinkId,
  onSelectMetric,
  onSelectLink,
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
  onSelectMetric: (metric: SwarmReportingMetricKey) => void;
  onSelectLink: (linkId: number | null) => void;
}) {
  const stats = getSwarmReportingStats(swarm);
  const activeItems = getSwarmReportingDrilldownItems(swarm, selectedMetric);
  const activeMeta = metricMeta[selectedMetric];
  const [exportFallback, setExportFallback] = React.useState<{ type: "csv" | "pdf"; url: string; filename: string } | null>(null);
  const exportableSwarm = {
    ...swarm,
    name: swarm.name ?? `Schwarm ${swarm.id}`,
    objective: swarm.objective ?? "Keine Zielsetzung hinterlegt.",
  };

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

  const exportCsv = () => {
    try {
      const filename = `${exportableSwarm.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-report.csv`;
      const csv = buildSwarmReportCsv(exportableSwarm);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      triggerDownload(blob, filename, "csv");
    } catch (error) {
      console.error(error);
      toast.error("Der CSV-Report konnte nicht erstellt werden.");
    }
  };

  const exportPdf = async () => {
    try {
      const filename = `${exportableSwarm.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-report.pdf`;
      const blob = await buildSwarmReportPdfBlob(exportableSwarm);
      triggerDownload(blob, filename, "pdf");
    } catch (error) {
      console.error(error);
      toast.error("Der PDF-Report konnte nicht erzeugt werden.");
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-white/70 bg-white/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Schwarm-Reporting</p>
        <p className="text-[11px] text-slate-400" data-testid={`swarm-reporting-context-${swarm.id}`}>
          Aktiver Reporting-Kontext: {activeMeta.label} · {activeItems.length} betroffene Pfade
        </p>
      </div>
      <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="grid gap-2 xl:w-[220px]">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            onClick={exportCsv}
          >
            CSV exportieren
          </button>
          <button
            type="button"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            onClick={() => void exportPdf()}
          >
            PDF herunterladen
          </button>
          <p className="text-xs leading-5 text-slate-500">Der Report-Export erzeugt eigenständige CSV- und PDF-Dateien. Falls der automatische Download ausbleibt, bleibt ein direkter Fallback-Link sichtbar.</p>
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
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/90 p-3" data-testid={`swarm-reporting-drilldown-${swarm.id}`}>
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
    </div>
  );
}
