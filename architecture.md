# Architektur und UI-System

## Informationsarchitektur

Die Anwendung wird als internes Enterprise-Dashboard mit persistenter Seitenleiste aufgebaut. Die Navigation folgt der mentalen Logik operativer Governance-Arbeit: zuerst Überblick, dann operative Steuerung, dann Regeln, dann Kontrolle, dann Monitoring.

| Route | Modul | Zweck |
|---|---|---|
| `/` | **Dashboard-Übersicht** | KPI-Überblick, Kosten, Freigaben, Audit-Signale, Guardrail-Status |
| `/agents` | **Agenten-Verwaltung** | Agenten registrieren, konfigurieren und überwachen |
| `/policies` | **Policy Engine** | Regeln definieren und priorisieren |
| `/access` | **Rollen- und Rechteverwaltung** | Nutzer, Teams, Rollen und Tool-Rechte verwalten |
| `/approvals` | **Approval Workflow** | Kritische Aktionen prüfen und freigeben |
| `/audit` | **Audit Log** | Filterbare Protokollierung und Nachvollziehbarkeit |
| `/connectors` | **Tool & Connector Layer** | Verbindungen und Systemzugriffe verwalten |
| `/evaluations` | **Evaluation Layer** | Testfälle und Compliance-Prüfungen verwalten |
| `/guardrails` | **Runtime Guardrails** | Laufzeitverstöße, Auto-Stops und Limits überwachen |
| `/observability` | **Observability & Cost Monitoring** | Echtzeitmetriken, Trends, Kosten und Fehlerbilder analysieren |

## Domänenmodell

Die Plattform wird auf wenigen klaren Kernentitäten aufgebaut. Ein **Agent** gehört optional einem Team, kann mit mehreren Tools verbunden sein und unterliegt mehreren Policies. Eine **Policy** definiert, ob eine Aktion erlaubt, verboten oder freigabepflichtig ist. Eine konkrete **Agent Action** ist ein Laufzeitereignis, das von einem Agenten ausgelöst wird und auf Policies geprüft werden kann. Daraus entstehen **Approvals**, **Audit Events** und **Guardrail Events**. Zusätzlich existieren **Connectoren** für Systemzugriffe, **Evaluations** mit Testfällen und **Metrik-Snapshots** für die operative Beobachtung.

## Datenbanktabellen für den ersten Build

| Tabelle | Zweck | Wichtige Felder |
|---|---|---|
| `teams` | Organisationseinheiten | `id`, `name`, `slug`, `description` |
| `agents` | Registrierte KI-Agenten | `id`, `name`, `slug`, `description`, `status`, `riskLevel`, `ownerUserId`, `teamId`, `model`, `environment`, `lastHeartbeatAt` |
| `connectors` | Systemverbindungen | `id`, `name`, `type`, `status`, `endpointLabel`, `authMode`, `lastSyncAt` |
| `agentConnectors` | Zuordnung Agent ↔ Connector | `id`, `agentId`, `connectorId`, `permissionScope`, `mode` |
| `policies` | Regeldefinitionen | `id`, `name`, `scopeType`, `scopeRef`, `actionPattern`, `effect`, `priority`, `isActive`, `description` |
| `teamMemberships` | Nutzer ↔ Team | `id`, `userId`, `teamId`, `roleLabel` |
| `agentPermissions` | Berechtigungen je Nutzer/Team für Agenten | `id`, `agentId`, `subjectType`, `subjectRef`, `permissionLevel` |
| `approvals` | Freigabevorgänge | `id`, `agentId`, `actionId`, `status`, `requestedByUserId`, `approverUserId`, `summary`, `requestedAt`, `resolvedAt` |
| `agentActions` | Ausgeführte oder blockierte Agentenaktionen | `id`, `agentId`, `connectorId`, `actionType`, `status`, `riskLevel`, `estimatedCostUsd`, `tokenUsage`, `summary`, `createdAt` |
| `auditEvents` | Vollständige Protokollspur | `id`, `agentId`, `actionId`, `severity`, `category`, `title`, `detail`, `actorType`, `actorRef`, `createdAt` |
| `evaluations` | Testläufe pro Agent | `id`, `agentId`, `name`, `status`, `score`, `policyPassRate`, `summary`, `executedAt` |
| `evaluationCases` | Einzelne Testfälle | `id`, `evaluationId`, `name`, `expectedOutcome`, `actualOutcome`, `status` |
| `guardrailEvents` | Laufzeitschutz und Auto-Stops | `id`, `agentId`, `actionId`, `triggerType`, `status`, `thresholdLabel`, `detail`, `createdAt` |
| `metricSnapshots` | Kennzahlen für Monitoring | `id`, `agentId`, `latencyMs`, `errorRate`, `apiCostUsd`, `tokenUsage`, `windowLabel`, `capturedAt` |

## API-Struktur

Die Serverlogik wird in klar getrennten tRPC-Routern organisiert. Ein `dashboard`-Router liefert aggregierte Kennzahlen. Ein `agents`-Router verwaltet Agenten und ihre Statusdaten. Ein `policies`-Router kapselt Policy-Daten. Weitere Router bedienen `access`, `approvals`, `audit`, `connectors`, `evaluations`, `guardrails` und `observability`. Für den ersten Build werden Lesen, Anlegen und Statusaktualisierung der wichtigsten Objekte priorisiert. So bleibt die API modular und erweiterbar.

## UI-System

Die Plattform erhält eine helle, kühle und präzise UI-Sprache. Der Hintergrund bleibt weich und neutral, Kartenflächen leicht abgestuft, Text kontrastreich und Akzentfarben zurückhaltend. Primäraktionen sollen souverän und ruhig wirken, nicht laut. Erfolg, Warnung und Risiko werden über kontrollierte Farbsignale vermittelt. Typografisch wird mit klarer Sans-Serif, deutlichen Größenstufen und starker Informationshierarchie gearbeitet.

## Layout-Prinzipien

Die vorhandene DashboardLayout-Komponente wird als strukturelle Basis genutzt und auf die Produktnavigation umgestellt. Die Seiten folgen einem modularen Aufbau aus Header-Bereich, primären KPIs, Analyseblöcken, operativen Listen und Detailkarten. Auf Mobilgeräten bleibt die Navigation kompakt, während auf größeren Bildschirmen die Anwendung als dichtes, aber ruhiges Command Center wirkt.

## MVP-Interaktionen

Im ersten Release soll der Nutzer mehrere glaubwürdige Kernabläufe durchspielen können. Dazu zählen das Anlegen eines Agenten, das Bearbeiten einer Policy, das Auslösen einer freigabepflichtigen Aktion, die Genehmigung oder Ablehnung im Approval Workflow, die Sichtbarkeit dieser Entscheidung im Audit Log sowie die Spiegelung im Guardrail- und Monitoring-Bereich. Diese Interaktionen sind wichtiger als eine vollständige Tiefe jedes Einzelmoduls, weil sie den Produktwert als zusammenhängendes Governance-System demonstrieren.
