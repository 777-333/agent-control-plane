import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Compass, LifeBuoy, PlayCircle, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";

const handbookEntries = [
  {
    title: "Dashboard-Übersicht",
    route: "/",
    area: "Einstieg",
    summary: "Der beste Startpunkt für neue Nutzer. Hier sehen Sie Kennzahlen, offene Freigaben und aktuelle Audit-Signale auf einen Blick.",
    docPath: "docs/handbuch-dashboard-uebersicht.md",
  },
  {
    title: "Agenten-Verwaltung",
    route: "/agents",
    area: "Operations",
    summary: "Hier legen Sie Agenten oder Schwärme an, pflegen Zuständigkeiten und verfolgen Kommunikations- sowie Reporting-Pfade.",
    docPath: "docs/handbuch-agenten-verwaltung.md",
  },
  {
    title: "Policy Engine",
    route: "/policies",
    area: "Governance",
    summary: "Definiert, welche Aktionen erlaubt, verboten oder freigabepflichtig sind und wie stark eine Regel priorisiert wird.",
    docPath: "docs/handbuch-policy-engine.md",
  },
  {
    title: "Rollen- und Rechteverwaltung",
    route: "/access",
    area: "Security",
    summary: "Hier vergeben Sie Rollen, Teamzuständigkeiten und Tool-Berechtigungen für Nutzer und Agenten.",
    docPath: "docs/handbuch-rollen-und-rechteverwaltung.md",
  },
  {
    title: "Approval Workflow",
    route: "/approvals",
    area: "Human-in-the-loop",
    summary: "Steuert Freigabeketten, Eskalationen, Benachrichtigungen und Simulationen für kritische Agentenaktionen.",
    docPath: "docs/handbuch-approval-workflow.md",
  },
  {
    title: "Audit Log",
    route: "/audit",
    area: "Traceability",
    summary: "Zeigt nachvollziehbar, welche sicherheits- und governance-relevanten Ereignisse im Betrieb passiert sind.",
    docPath: "docs/handbuch-audit-log.md",
  },
  {
    title: "Tool & Connector Layer",
    route: "/connectors",
    area: "Integrationen",
    summary: "Macht sichtbar, welche Werkzeuge und Verbindungen ein Agent nutzen kann und in welchem Zustand sie sind.",
    docPath: "docs/handbuch-tool-und-connector-layer.md",
  },
  {
    title: "Evaluation Layer",
    route: "/evaluations",
    area: "Validation",
    summary: "Hilft Ihnen, Testfälle vor produktiven Änderungen auszuführen und Ergebnisse strukturiert zu bewerten.",
    docPath: "docs/handbuch-evaluation-layer.md",
  },
  {
    title: "Runtime Guardrails",
    route: "/guardrails",
    area: "Runtime safety",
    summary: "Sorgt für Alltagssicherheit durch Datenschutzregeln, automatische Stopps und kontrollierte Laufzeit-Schutzmechanismen.",
    docPath: "docs/handbuch-runtime-guardrails.md",
  },
  {
    title: "Observability & Cost Monitoring",
    route: "/observability",
    area: "Monitoring",
    summary: "Macht Kosten, Latenzen, Fehlerraten und operative Trends verständlich sichtbar.",
    docPath: "docs/handbuch-observability-und-cost-monitoring.md",
  },
] as const;

const quickStartSteps = [
  {
    title: "Mit dem Dashboard beginnen",
    text: "Öffnen Sie zuerst die Dashboard-Übersicht. Dort erkennen Sie sofort, ob Freigaben, Risiken oder Kosten heute besondere Aufmerksamkeit brauchen.",
  },
  {
    title: "Dann die Agenten prüfen",
    text: "Wechseln Sie anschließend in die Agenten-Verwaltung, wenn Sie neue Agenten anlegen, einen Schwarm konfigurieren oder Verantwortlichkeiten nachschärfen möchten.",
  },
  {
    title: "Offene Entscheidungen bearbeiten",
    text: "Sobald Freigaben oder Eskalationen sichtbar sind, ist der Approval Workflow die richtige Stelle für die nächste Bearbeitung.",
  },
  {
    title: "Bei Unsicherheit hierher zurückkehren",
    text: "Wenn Begriffe, Felder oder Module unklar sind, nutzen Sie diese Hilfe-Seite als Wegweiser zu Handbüchern und passenden Oberflächen.",
  },
] as const;

export default function HelpCenterPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Badge className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-700 hover:bg-sky-50">
              Hilfe & Dokumentation
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              Verständliche Orientierung für den täglichen Umgang mit der Agent Control Plane
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Diese Seite ist als einfacher Einstieg für Nutzer gedacht, die sich nicht jeden Fachbegriff merken möchten. Sie finden hier einen klaren Schnellstart, direkte Wege zu den Modulen und die passenden Handbücher aus dem Projekt.
            </p>
          </div>
          <div className="grid gap-3 rounded-[28px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600 lg:max-w-sm">
            <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <Compass className="mt-0.5 h-4 w-4 text-sky-600" />
              <div>
                <p className="font-semibold text-slate-950">Orientierung statt Fachjargon</p>
                <p className="mt-1 leading-6">Alle Hilfetexte sind auf Alltagssprache und schnelle Entscheidungen ausgelegt.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <BookOpen className="mt-0.5 h-4 w-4 text-sky-600" />
              <div>
                <p className="font-semibold text-slate-950">Direkter Bezug zur Oberfläche</p>
                <p className="mt-1 leading-6">Jede Karte führt zu einer echten Produktseite und nennt den Handbuchpfad im Projekt.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button className="h-11 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900" onClick={() => setLocation("/")}>
            Zum Dashboard
          </Button>
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-slate-700 hover:bg-slate-50"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("agent-control-plane:start-tour"));
            }}
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Starttour erneut öffnen
          </Button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <LifeBuoy className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Schnellstart für neue Nutzer</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Eine einfache Reihenfolge, mit der Sie sich in wenigen Minuten orientieren können.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {quickStartSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-slate-950">Wo finde ich welches Thema?</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Diese Übersicht verbindet die wichtigsten Module mit dem passenden Handbuch im Projekt.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {handbookEntries.map(entry => (
              <div key={entry.title} className="flex h-full flex-col rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{entry.title}</p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{entry.area}</p>
                  </div>
                  <Badge className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] text-slate-600 hover:bg-white">
                    Live
                  </Badge>
                </div>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{entry.summary}</p>
                <div className="mt-4 rounded-2xl border border-white/70 bg-white px-3 py-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Handbuchpfad</p>
                  <p className="mt-1 break-all text-xs leading-5 text-slate-600">{entry.docPath}</p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 h-10 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  onClick={() => setLocation(entry.route)}
                >
                  Modul öffnen
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
