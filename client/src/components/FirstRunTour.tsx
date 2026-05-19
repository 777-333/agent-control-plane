import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Compass, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const TOUR_STORAGE_KEY = "agent-control-plane:first-run-tour-completed";
const TOUR_EVENT_NAME = "agent-control-plane:start-tour";

const tourSteps = [
  {
    title: "Mit dem Dashboard starten",
    description:
      "Das Dashboard ist Ihre Lageübersicht. Hier sehen Sie offene Freigaben, auffällige Audit-Signale und die wichtigsten Kennzahlen für den laufenden Betrieb.",
    route: "/",
    actionLabel: "Dashboard öffnen",
    icon: LayoutDashboard,
    toneClass: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    title: "Danach die Agenten prüfen",
    description:
      "In der Agenten-Verwaltung legen Sie neue Agenten oder ganze Schwärme an und sehen, wer fachlich verantwortlich ist.",
    route: "/agents",
    actionLabel: "Agenten-Verwaltung öffnen",
    icon: Users,
    toneClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    title: "Freigaben aktiv bearbeiten",
    description:
      "Wenn ein Prozess eine menschliche Entscheidung braucht, wechseln Sie in den Approval Workflow. Dort sehen Sie Ketten, Eskalationen und Benachrichtigungen.",
    route: "/approvals",
    actionLabel: "Approval Workflow öffnen",
    icon: ShieldCheck,
    toneClass: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    title: "Hilfe jederzeit wiederfinden",
    description:
      "Auf der Hilfe-&-Dokumentation-Seite finden Sie den Schnellstart, Modul-Erklärungen und die Pfade zu allen Handbüchern im Projekt.",
    route: "/help",
    actionLabel: "Hilfe-Seite öffnen",
    icon: Compass,
    toneClass: "border-violet-200 bg-violet-50 text-violet-700",
  },
] as const;

type FirstRunTourProps = {
  userName?: string | null;
};

export default function FirstRunTour({ userName }: FirstRunTourProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = useMemo(() => tourSteps[stepIndex] ?? tourSteps[0], [stepIndex]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasCompletedTour = window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    if (!hasCompletedTour) {
      setIsOpen(true);
    }

    const handleStartTour = () => {
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener(TOUR_EVENT_NAME, handleStartTour);
    return () => window.removeEventListener(TOUR_EVENT_NAME, handleStartTour);
  }, []);

  const finishTour = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
    setIsOpen(false);
  };

  const goToStepRoute = () => {
    if (location !== currentStep.route) {
      setLocation(currentStep.route);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={next => {
      setIsOpen(next);
      if (!next && typeof window !== "undefined") {
        window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
      }
    }}>
      <DialogContent className="max-w-2xl rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
        <div className="rounded-t-[28px] bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.22),transparent_35%),linear-gradient(135deg,#0f172a_0%,#172554_54%,#1e293b_100%)] px-6 py-6 text-white">
          <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white hover:bg-white/10">
            Starttour für Erstnutzer
          </Badge>
          <DialogHeader className="mt-4 text-left">
            <DialogTitle className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Willkommen{userName ? `, ${userName}` : ""} — so finden Sie sich schnell zurecht
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-xl text-sm leading-7 text-slate-200">
              Diese kurze Tour zeigt Ihnen die vier wichtigsten Stationen für den Einstieg. Sie können jeden Schritt direkt öffnen und die Tour später über die Hilfe-Seite erneut starten.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-3">
              {tourSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === stepIndex;

                return (
                  <button
                    key={step.title}
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                      isActive ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                    }`}
                    onClick={() => setStepIndex(index)}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${isActive ? "border-white/15 bg-white/10 text-white" : step.toneClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className={`mt-1 text-xs leading-5 ${isActive ? "text-slate-200" : "text-slate-500"}`}>Schritt {index + 1} von {tourSteps.length}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{currentStep.title}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Orientierungsschritt {stepIndex + 1}</p>
                </div>
                <Badge className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:bg-white">
                  {location === currentStep.route ? "Bereits geöffnet" : "Empfohlene Station"}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{currentStep.description}</p>
              <div className="mt-5 rounded-2xl border border-white/70 bg-white px-4 py-4 text-sm leading-6 text-slate-600 shadow-sm">
                Öffnen Sie diesen Bereich direkt aus der Tour, wenn Sie sich die Oberfläche sofort ansehen möchten. Sie verlieren dabei keinen Schritt und können danach hier weitergehen.
              </div>
              <Button className="mt-5 h-11 rounded-2xl bg-slate-950 px-5 text-white hover:bg-slate-900" onClick={goToStepRoute}>
                {currentStep.actionLabel}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-4 sm:justify-between">
          <Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50" onClick={finishTour}>
            Später schließen
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(current => Math.max(current - 1, 0))}
            >
              Zurück
            </Button>
            {stepIndex < tourSteps.length - 1 ? (
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-900" onClick={() => setStepIndex(current => Math.min(current + 1, tourSteps.length - 1))}>
                Weiter
              </Button>
            ) : (
              <Button className="rounded-2xl bg-slate-950 text-white hover:bg-slate-900" onClick={finishTour}>
                Tour abschließen
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
