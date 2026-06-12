import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

function fmtLimit(value: number): string {
  return Number.isFinite(value) ? value.toLocaleString("de-DE") : "unbegrenzt";
}

function fmtPrice(value: number | null): string {
  if (value === null) return "individuell";
  if (value === 0) return "0 €";
  return `${value.toLocaleString("de-DE")} €`;
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const finite = Number.isFinite(max);
  const pct = finite && max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const over = finite && used > max;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "font-semibold text-destructive" : "font-medium"}>
          {used.toLocaleString("de-DE")} / {fmtLimit(max)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${over ? "bg-destructive" : "bg-primary"}`}
          style={{ width: `${finite ? Math.max(pct, used > 0 ? 4 : 0) : 2}%` }}
        />
      </div>
    </div>
  );
}

export default function Billing() {
  const utils = trpc.useUtils();
  const overviewQuery = trpc.billing.overview.useQuery();
  const plansQuery = trpc.billing.plans.useQuery();

  const selectMutation = trpc.billing.selectPlan.useMutation({
    onSuccess: () => {
      void utils.billing.overview.invalidate();
      toast.success("Tarif aktualisiert.");
    },
    onError: error => toast.error(error.message),
  });

  const overview = overviewQuery.data;
  const plans = plansQuery.data ?? [];
  const currentPlanId = overview?.plan.id;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Abrechnung & Nutzung</h1>
          <p className="text-sm text-muted-foreground">Dein aktueller Tarif, deine Nutzung und verfügbare Tarife.</p>
        </div>
      </div>

      {/* Current plan + usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Aktueller Tarif: {overview ? overview.plan.name : "…"}
          </CardTitle>
          <CardDescription>Nutzung im laufenden Monat{overview ? ` (${overview.usage.month})` : ""}.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {overviewQuery.isLoading || !overview ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Lädt …
            </div>
          ) : (
            <>
              <UsageBar label="Agenten" used={overview.usage.agents} max={overview.plan.maxAgents} />
              <UsageBar label="API-Ereignisse (Monat)" used={overview.usage.events} max={overview.plan.maxEventsPerMonth} />
              {(overview.agentLimitReached || overview.overEventLimit) && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {overview.agentLimitReached && "Agenten-Limit erreicht – neue Agenten benötigen ein Upgrade. "}
                    {overview.overEventLimit && "Ereignis-Limit überschritten – bitte Tarif upgraden. "}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Plan catalog */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlanId;
          const isEnterprise = plan.id === "enterprise";
          return (
            <Card key={plan.id} className={isCurrent ? "border-primary shadow-md" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  {plan.name}
                  {isCurrent && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">aktuell</span>
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-semibold text-foreground">{fmtPrice(plan.priceMonthlyEur)}</span>
                  {plan.priceMonthlyEur !== null && plan.priceMonthlyEur > 0 && (
                    <span className="text-muted-foreground"> /Monat</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>{fmtLimit(plan.maxAgents)} Agenten</li>
                  <li>{fmtLimit(plan.maxEventsPerMonth)} Ereignisse/Monat</li>
                  <li>{fmtLimit(plan.auditRetentionDays)} Tage Audit</li>
                  <li>{fmtLimit(plan.maxSeats)} Nutzer</li>
                  {plan.highlights.map((h: string) => (
                    <li key={h} className="flex items-center gap-1.5 text-foreground">
                      <Check className="h-3.5 w-3.5 text-primary" /> {h}
                    </li>
                  ))}
                </ul>
                {isEnterprise ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:sales@3333.tools?subject=Enterprise-Tarif">Kontakt aufnehmen</a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    disabled={isCurrent || selectMutation.isPending}
                    onClick={() => selectMutation.mutate({ planId: plan.id })}
                  >
                    {isCurrent ? "Aktueller Tarif" : "Wählen"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Hinweis: Tarifwechsel ist aktuell ohne Zahlung (Testbetrieb). Zahlungsanbindung folgt.
      </p>
    </div>
  );
}
