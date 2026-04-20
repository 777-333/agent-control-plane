# Produktstruktur: Agent Control Plane

## Produktpositionierung

Die Anwendung ist eine elegante, professionelle Web-Plattform zur zentralen **Steuerung**, **Überwachung** und **Absicherung** von KI-Agenten. Sie verbindet Governance, Operations, Freigabeprozesse und Beobachtbarkeit in einer einzigen Oberfläche. Der erste Build wird als hochwertiges internes Unternehmens-Dashboard konzipiert, mit klarer Seitenstruktur, realistischen Datenmodellen und einem überzeugenden Bedienfluss.

## Produktlogik

Die Plattform organisiert sich um vier Kernobjekte: **Agenten**, **Policies**, **Aktionen** und **Verantwortung**. Agenten führen Aufgaben aus, Policies definieren ihre Grenzen, Aktionen erzeugen operative Ereignisse, und Verantwortung wird über Rollen, Teams, Freigaben und Auditierbarkeit abgebildet. Daraus entsteht ein System, das nicht nur den Zustand eines Agenten anzeigt, sondern seine Einsetzbarkeit in einem kontrollierten Unternehmensrahmen beweisbar macht.

## Verbindliche Produktmodule

| Modul | Ziel | Zentrale Inhalte im ersten Build |
|---|---|---|
| **Dashboard-Übersicht** | Gesamtlage auf einen Blick | KPI-Karten, Kostenübersicht, Agentenstatus, Freigaben, Risiko- und Audit-Signale |
| **Agenten-Verwaltung** | Agenten operativ verwalten | Registrierte Agenten, Konfiguration, Tool-Zuweisung, Deployment-Status, Health-Status |
| **Policy Engine** | Regeln maschinenlesbar definieren | Policies mit Geltungsbereich, Priorität, Status, erlaubten/verbotenen/freigabepflichtigen Aktionen |
| **Rollen- und Rechteverwaltung** | Verantwortlichkeiten kontrollieren | Nutzer, Teams, Rollen, Berechtigungen pro Agent und Tool |
| **Approval Workflow** | Kritische Aktionen kontrolliert freigeben | Warteschlange, Prioritäten, Entscheidungsdetails, Genehmigungsstatus, Eskalationen |
| **Audit Log** | Nachvollziehbarkeit herstellen | Vollständige Event-Historie mit Filtern, Schweregrad, Actor, Agent, Tool und Policy-Bezug |
| **Tool & Connector Layer** | Systemanbindungen sichtbar und steuerbar machen | CRM, ERP, E-Mail, Browser, Datenbanken und Verbindungsstatus |
| **Evaluation Layer** | Agenten vor Live-Betrieb testen | Testfälle, Regelkonformität, Erfolgsquote, Risikohinweise |
| **Runtime Guardrails** | Agenten im Betrieb live absichern | Guardrail-Status, Auto-Stop-Ereignisse, Kostenlimits, Policy-Verletzungen |
| **Observability & Cost Monitoring** | Leistung und Wirtschaftlichkeit messen | Latenz, Fehlerrate, Token-Verbrauch, API-Kosten, Trendkarten |

## Nutzergruppen

| Nutzergruppe | Primärer Bedarf | Typische Oberfläche |
|---|---|---|
| **Operations Lead** | Überblick über Zustand, Kosten und Risiken | Dashboard-Übersicht, Agenten-Verwaltung, Monitoring |
| **Governance / Compliance** | Richtlinien, Auditierbarkeit und Nachvollziehbarkeit | Policy Engine, Audit Log, Runtime Guardrails |
| **Team Lead / Approver** | Kritische Aktionen prüfen und freigeben | Approval Workflow, Benachrichtigungen, Aktionseinzelansicht |
| **Administrator** | Nutzer, Teams, Rollen und Connectoren verwalten | Rollen- und Rechteverwaltung, Tool & Connector Layer |
| **Evaluator / QA** | Agenten vor Live-Schaltung testen | Evaluation Layer, Testberichte, Policy-Konformität |

## MVP-Zuschnitt

Der erste umsetzbare Build wird nicht als rein statische Präsentationsseite angelegt, sondern als funktionale Produktdemo mit realistischen Datenstrukturen und interaktiven Oberflächen. Der MVP umfasst deshalb ein vollständiges Dashboard-Gerüst, persistente Kernentitäten in der Datenbank, tRPC-Verfahren für Lesen und Schreiben sowie Seiten für alle zehn verbindlichen Module. Die Tiefe der Module wird im ersten Schritt auf einen überzeugenden Kernfluss fokussiert: Agent anlegen, Policy zuweisen, kritische Aktion erzeugen, Freigabe bearbeiten, Audit-Eintrag sehen und Auswirkungen im Monitoring nachvollziehen.

## UX- und Designrichtung

Die Plattform erhält eine bewusst ruhige, präzise und hochwertige Dashboard-Ästhetik. Das visuelle System soll auf klarer Typografie, großzügigem Weißraum, differenzierten Oberflächen, subtilen Schatten und einer kontrollierten Farbpalette beruhen. Die Informationsdichte darf hoch sein, muss aber über Komposition, Gruppierung und Priorisierung jederzeit verständlich bleiben. Die Oberfläche soll wirken, als sei sie für ein anspruchsvolles Enterprise-Produkt entworfen worden – nicht wie ein generisches Admin-Template.

## Kernfluss des Produkts

Ein Administrator registriert einen Agenten und verknüpft ihn mit ausgewählten Tools. Danach definiert das Governance-Team Regeln in der Policy Engine. Der Agent führt eine kritische Aktion aus, die durch eine Policy als freigabepflichtig markiert ist. Diese Aktion erscheint im Approval Workflow und wird von einer verantwortlichen Person geprüft. Unabhängig vom Ergebnis wird der komplette Vorgang im Audit Log dokumentiert. Gleichzeitig fließen Kosten, Latenz und Fehlerdaten in das Monitoring-Dashboard ein. Vor einem Deployment kann derselbe Agent zusätzlich über den Evaluation Layer gegen definierte Testfälle geprüft werden.

## Umsetzungsprinzip für den ersten Build

Die technische Umsetzung orientiert sich an einem sauberen Trennmodell zwischen Präsentation, Geschäftslogik und Datenhaltung. Die UI wird als Dashboard mit persistenter Navigation aufgebaut. Die API bildet die Kernobjekte explizit ab. Die Datenbank speichert Agenten, Policies, Approvals, Audit-Events, Connectoren, Evaluations und Metriken. Für den ersten Build arbeiten wir mit plausiblen Seed-Daten, echter Persistenz für Kernobjekte und einer UX, die bereits wie ein produktionsnahes Control Center wirkt.
