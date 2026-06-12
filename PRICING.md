# Tarife & Preise (Agent Control Plane)

Gewähltes **4-Tier-Modell + Enterprise**. Quelle der Wahrheit für Limits:
`server/plans.ts`. Diese Datei ist die menschenlesbare Übersicht.

> Status: Limits werden **technisch durchgesetzt** (Agenten + API-Ereignisse).
> Tarifwechsel aktuell **ohne Zahlung** (Testbetrieb). Stripe-Anbindung folgt
> als Schritt 2b.

## Tiers

| Tier | Preis (mtl.) | Jährlich | Agenten | Ereignisse/Mon. | Audit | Nutzer | Highlights |
|---|---|---|---|---|---|---|---|
| **Free** | 0 € | – | 3 | 1.000 | 7 Tage | 1 | Doku-Support |
| **Starter** | 39 € | 390 € | 10 | 25.000 | 30 Tage | 1 | E-Mail-Support |
| **Team** ⭐ | 149 € | 1.490 € | 50 | 250.000 | 90 Tage | 5 | Guardrails, Evaluations, Approval-Ketten, Prio-Support |
| **Business** | 499 € | 4.990 € | 250 | 1,5 Mio. | 12 Mon. + Export | 20 | SSO, SLA-Reports, Rollen, Audit-Export |
| **Enterprise** | individuell | – | unbegrenzt | unbegrenzt | unbegrenzt | unbegrenzt | Self-Host/On-Prem, DPA/Compliance, dediziertes Onboarding, SLA |

⭐ = empfohlener Anker-Tarif (im UI hervorgehoben).
Hinweis: **Free = 3 Agenten** (statt 2), damit nach den 2 Beispiel-Agenten des
Starter-Sets noch Platz für einen eigenen bleibt.

## Abrechnungslogik (Begriffe)
- **API-Ereignis** = ein `policy-check`- oder `ingest`-Aufruf eines Agenten.
  (Approval-Status-Abfragen zählen nicht.)
- **Agenten** = registrierte Agenten im Workspace des Kunden.
- **Overage** (geplant): bei Überschreitung freundlicher Hinweis statt hartem
  Stopp; Ereignis-Limit ist „soft" (zählt weiter, markiert Überschreitung),
  Agenten-Limit ist „hard" (Anlegen wird blockiert).
- **Jahresrabatt**: ~2 Monate geschenkt (Jahrespreis = 10× Monatspreis).

## Durchsetzung (heute)
- **Agenten-Limit**: Anlegen über das Limit hinaus wird blockiert (klare Meldung).
- **Ereignis-Limit**: wird gezählt; Überschreitung wird im Dashboard
  „Abrechnung & Nutzung" markiert.
- **Inhaber/Demo** (DEFAULT_TENANT) = Enterprise (unbegrenzt).

## Noch offen (separate Schritte)
- **Stripe**: echte Bezahlung, Abos, Rechnungen (Schritt 2b).
- **Nutzer-Sitze / Rollen**: brauchen Team-Tenancy (Schritt 3).
- **SSO, SLA-Reports, DPA, Self-Host**: teils neue Features, teils Vertrag/Betrieb.

*Preise sind Startwerte zum Validieren – jederzeit in `server/plans.ts` anpassbar.*
