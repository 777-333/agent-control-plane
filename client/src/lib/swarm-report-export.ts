import { jsPDF } from "jspdf";
import { getSwarmReportingDrilldownItems, getSwarmReportingStats, type SwarmCommunicationLinkWithNames, type SwarmGovernanceForInsights, type SwarmReportingMetricKey } from "@/lib/swarm-insights";

export type ExportableSwarmReport = {
  id: number;
  name: string;
  objective: string;
  governance: SwarmGovernanceForInsights;
  communicationLinks: SwarmCommunicationLinkWithNames[];
};

function escapeCsv(value: string | number) {
  const normalized = String(value).replaceAll('"', '""');
  return /[";,\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

export function buildSwarmReportCsv(swarm: ExportableSwarmReport, now = Date.now()) {
  const stats = getSwarmReportingStats(swarm, now);
  const rows = [
    ["Schwarm", swarm.name],
    ["Zielsetzung", swarm.objective],
    ["Reporting-Fenster (Stunden)", swarm.governance.reportingWindowHours],
    ["SLA-Minuten", swarm.governance.slaMinutes],
    ["Eskalation ab Minuten", swarm.governance.escalationAfterMinutes],
    ["Nachrichtenfenster", stats.messageWindowCount],
    ["Approval-Ereignisse", stats.approvalMessages],
    ["SLA verletzt", stats.overdueLinks],
    ["Eskalierte Pfade", stats.escalatedLinks],
    ["Ø Reaktionsalter (Min.)", stats.averageResponseMinutes],
    [],
    ["Metrik", "Kommunikationspfad", "Wert", "Beschreibung"],
  ];

  const metricRows = (["messages", "approvals", "sla", "response"] as SwarmReportingMetricKey[]).flatMap(metric =>
    getSwarmReportingDrilldownItems(swarm, metric, now).map(item => [
      metric,
      item.title,
      item.valueLabel,
      item.description,
    ]),
  );

  return [...rows, ...metricRows]
    .map(row => row.map(cell => escapeCsv(cell ?? "")).join(";"))
    .join("\n");
}

export function buildSwarmReportHtml(swarm: ExportableSwarmReport, now = Date.now()) {
  const stats = getSwarmReportingStats(swarm, now);
  const sections = (["messages", "approvals", "sla", "response"] as SwarmReportingMetricKey[])
    .map(metric => {
      const title = metric === "messages"
        ? "Nachrichtenfenster"
        : metric === "approvals"
          ? "Approval-Ereignisse"
          : metric === "sla"
            ? "SLA verletzt"
            : "Ø Reaktionsalter";
      const items = getSwarmReportingDrilldownItems(swarm, metric, now);
      const body = items.length
        ? `<table><thead><tr><th>Kommunikationspfad</th><th>Wert</th><th>Beschreibung</th></tr></thead><tbody>${items
            .map(item => `<tr><td>${item.title}</td><td>${item.valueLabel}</td><td>${item.description}</td></tr>`)
            .join("")}</tbody></table>`
        : `<p>Für diese Kennzahl liegen aktuell keine betroffenen Kommunikationspfade vor.</p>`;
      return `<section><h2>${title}</h2>${body}</section>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <title>Schwarm-Report – ${swarm.name}</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; padding: 32px; color: #0f172a; }
      h1, h2 { margin: 0 0 12px; }
      p { margin: 0 0 10px; line-height: 1.5; }
      .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 20px 0 28px; }
      .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 14px 16px; }
      table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      th, td { border: 1px solid #e2e8f0; text-align: left; padding: 10px; font-size: 14px; vertical-align: top; }
      th { background: #f8fafc; }
      section { margin-top: 24px; }
      @media print { body { padding: 16px; } }
    </style>
  </head>
  <body>
    <h1>Schwarm-Report: ${swarm.name}</h1>
    <p>${swarm.objective}</p>
    <div class="summary">
      <div class="card"><strong>Nachrichtenfenster</strong><br/>${stats.messageWindowCount}</div>
      <div class="card"><strong>Approval-Ereignisse</strong><br/>${stats.approvalMessages}</div>
      <div class="card"><strong>SLA verletzt</strong><br/>${stats.overdueLinks}</div>
      <div class="card"><strong>Ø Reaktionsalter</strong><br/>${stats.averageResponseMinutes} Min.</div>
    </div>
    ${sections}
  </body>
</html>`;
}

export async function buildSwarmReportPdfBlob(swarm: ExportableSwarmReport, now = Date.now()) {
  const stats = getSwarmReportingStats(swarm, now);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed = 24) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addWrappedText = (text: string, size = 11, weight: "normal" | "bold" = "normal") => {
    doc.setFont("helvetica", weight);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * (size + 4));
    doc.text(lines, margin, y);
    y += lines.length * (size + 4) + 4;
  };

  addWrappedText(`Schwarm-Report: ${swarm.name}`, 18, "bold");
  addWrappedText(swarm.objective, 11, "normal");
  y += 4;
  addWrappedText(`Nachrichtenfenster: ${stats.messageWindowCount} | Approval-Ereignisse: ${stats.approvalMessages} | SLA verletzt: ${stats.overdueLinks} | Ø Reaktionsalter: ${stats.averageResponseMinutes} Min.`, 11, "bold");
  y += 6;

  for (const metric of ["messages", "approvals", "sla", "response"] as SwarmReportingMetricKey[]) {
    const title = metric === "messages"
      ? "Nachrichtenfenster"
      : metric === "approvals"
        ? "Approval-Ereignisse"
        : metric === "sla"
          ? "SLA verletzt"
          : "Ø Reaktionsalter";
    ensureSpace(32);
    addWrappedText(title, 14, "bold");
    const items = getSwarmReportingDrilldownItems(swarm, metric, now);
    if (items.length === 0) {
      addWrappedText("Für diese Kennzahl liegen aktuell keine betroffenen Kommunikationspfade vor.", 11, "normal");
      continue;
    }
    for (const item of items) {
      ensureSpace(44);
      addWrappedText(`${item.title} — ${item.valueLabel}`, 11, "bold");
      addWrappedText(item.description, 10, "normal");
      y += 2;
    }
    y += 4;
  }

  return doc.output("blob");
}

export async function downloadSwarmReportPdf(swarm: ExportableSwarmReport, now = Date.now()) {
  const blob = await buildSwarmReportPdfBlob(swarm, now);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${swarm.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-report.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
  return blob;
}
