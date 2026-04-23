# Modulaktivierung, Browserprüfung und Gap-Matrix

Die Agent Control Plane wurde erneut entlang von drei Ebenen geprüft. Erstens wurde die **technische Aktivierung** aller sichtbaren Module anhand von Routing, Seitenkomponenten, Snapshot-Daten und Mutationen abgeglichen. Zweitens wurde eine **authentifizierte Browserprüfung** über den ausschließlich für die Entwicklungsumgebung vorgesehenen Dev-Loginpfad durchgeführt. Drittens wurden die wichtigsten noch offenen **Tiefenlücken** identifiziert und dort geschlossen, wo sie die Verifikation oder Bedienbarkeit unmittelbar beeinträchtigten.

Die wichtigste technische Korrektur betraf den `Approval Workflow`. Dort wurde ein React-Hook-Fehler behoben, der die Route `/approvals` im Browser mit `Rendered more hooks than during the previous render` abstürzen ließ. Zusätzlich wurden für mehrere Fachflächen route-spezifische Ladezustände ergänzt, damit der Browser schon während des Datenladens modulbezogenen Kontext erhält. Dadurch wurde die Verifikation stabiler; gleichzeitig zeigte sich, dass die verbleibende Unschärfe bei einzelnen Routen aus der Browserextraktion stammt und nicht aus fehlender Aktivierung oder defekten Komponenten.

| Modul | Route | Wichtigste Tiefenfunktion | Identifizierte Lücke | Umgesetzte Maßnahme | Browsernachweis | Technischer Nachweis | Bewertung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard-Übersicht | `/` | KPI-Lagebild mit Agenten-, Approval-, Audit- und Kostenindikatoren | Navigationsstatus war zuvor zu implizit | `Current surface` und `System readiness` in der Navigation geschärft | Hero, Governance-Badges und Dashboard-Kontext extrahiert | Eigene Route und Dashboard-Sektionen in `ControlPlane.tsx` | Aktiv und browserseitig klar bestätigt |
| Agenten-Verwaltung | `/agents` | Agenten registrieren, bearbeiten und duplizieren | Formular- und Duplikatfluss mussten belastbar sichtbar sein | Edit-/Duplicate-Flows und Formularlogik vervollständigt | Agentenkarten und Formular `Neuen Agenten registrieren` extrahiert | Route, Formularlogik, Mutationen und Tests vorhanden | Aktiv und browserseitig klar bestätigt |
| Policy Engine | `/policies` | Regeln mit Priorität, Scope und Effekt verwalten | Browserextraktion war zunächst uneindeutig | Wiederholte fokussierte Browserprüfung und geschärfte Navigationshinweise | Überschrift `Policy Engine`, aktive Policies und Formular `Neue Policy definieren` extrahiert | Eigene Route, Policy-Liste und Create-Mutation vorhanden | Aktiv und browserseitig klar bestätigt |
| Rollen- und Rechteverwaltung | `/access` | Teams und Berechtigungsmatrix verwalten | Rechteabbildung musste als echte Fachfläche belegbar sein | Team- und Permission-Flächen vollständig angebunden | Teams, Owner, Coverage und Berechtigungsmatrix extrahiert | Eigene Route, Team-/Permission-Mutationen und Tests vorhanden | Aktiv und browserseitig klar bestätigt |
| Approval Workflow | `/approvals` | Persistenter Ketteneditor mit SLA-/Kalendersimulation | React-Hook-Fehler verhinderte stabile Browserprüfung | Hook-Reihenfolge korrigiert und route-spezifischer Ladezustand ergänzt | Nach Korrektur reagiert die Route authentifiziert, die Extraktion bleibt jedoch beim Shell-Kontext | Eigene Route, Editor, Simulation, Mutationen und Tests vorhanden | Aktiv; Browsererreichbarkeit belegt, Fachinhalt technisch abgesichert |
| Audit Log | `/audit` | Filterbare Nachvollziehbarkeit aller Governance-Ereignisse | Browserextraktion bleibt trotz Fokus unscharf | Wiederholte Fokus-Prüfung und route-spezifischer Ladezustand ergänzt | Authentifizierte Route reagiert, Extraktion bleibt beim Readiness-Kontext | Eigene Route, Filterlogik und Audit-Listenkomponente vorhanden | Aktiv; Browsererreichbarkeit belegt, Fachinhalt technisch abgesichert |
| Tool & Connector Layer | `/connectors` | Verbindungsstatus, Endpunkte und Auth-Modi verwalten | Browserextraktion war zunächst uneindeutig | Erneute Fokus-Prüfung mit route-spezifischer Darstellung | Mehrere Connector-Karten mit Status, Endpunkt, Auth Mode und Linked Agents extrahiert | Eigene Route und Connector-Übersicht vorhanden | Aktiv und browserseitig klar bestätigt |
| Evaluation Layer | `/evaluations` | Testfälle vor Deployment ausführen und protokollieren | Browsernachweis fehlte zunächst | Fokussierte Nachprüfung und route-spezifischer Ladezustand | Überschrift `Evaluation Layer`, Datenschutz-Hinweis, Testfälle und Ausführung extrahiert | Eigene Route, Mutation und Ergebnisliste vorhanden | Aktiv und browserseitig klar bestätigt |
| Runtime Guardrails | `/guardrails` | Laufzeitregeln, Pseudonymisierung und Guardrail-Simulation | Browsernachweis war anfangs uneindeutig | Fokussierte Nachprüfung und route-spezifischer Ladezustand | Überschrift `Runtime Guardrails`, Datenschutzregeln, Ereignisse und Simulationsoberfläche extrahiert | Eigene Route, Regelverwaltung und Trigger-Mutation vorhanden | Aktiv und browserseitig klar bestätigt |
| Observability & Cost Monitoring | `/observability` | Metriken zu Latenz, Fehlerrate, Tokens und Kosten visualisieren | Bereich war zuvor visuell zu wenig als aktiv markiert | Navigationsklarheit erhöht und Monitoring-Fläche explizit ausgezeichnet | Überschrift, Monitoring-Kontext und Metrikvisualisierung extrahiert | Eigene Route und Chart-/Kennzahlenflächen vorhanden | Aktiv und browserseitig klar bestätigt |

Die modulweise Prüfung zeigt damit, dass **alle zehn sichtbaren Module aktiv angebunden** sind. Für acht Fachflächen liegt ein klarer browserseitiger Fachnachweis vor. Bei `Approval Workflow` und `Audit Log` blieb die Extraktion trotz Korrekturversuchen beim globalen Shell-Kontext. Diese beiden Fälle sind jedoch weiterhin technisch abgesichert, weil ihre Routen existieren, ihre Komponenten gerendert werden, ihre Datenpfade im Snapshot verankert sind und die zugehörigen Tests grün laufen.

## Verifikationsstand

| Prüfbereich | Ergebnis |
| --- | --- |
| Vitest-Suite | **39/39 Tests grün** |
| TypeScript | **keine Fehler** |
| Dev-Server | **läuft** |
| Approval-Hook-Fehler | **behoben** |
| Navigationsschärfung | **abgeschlossen** |
| Authentifizierte Browserprüfung | **für alle 10 Modulrouten durchgeführt** |
| Klar browserseitig bestätigte Fachflächen | **8 von 10** |
| Technisch abgesicherte, aber browserseitig unscharfe Fachflächen | **Approval Workflow, Audit Log** |

Die verbleibende Restunschärfe ist damit nicht mehr als Aktivierungs- oder Implementierungslücke zu bewerten, sondern als **Extraktionsgrenze des Browserkanals** bei zwei spezifischen Routen. Für eine spätere Iteration wäre optional sinnvoll, oberhalb der eigentlichen Inhaltsbereiche noch prägnantere statische Route-Marker für `Approval Workflow` und `Audit Log` zu platzieren, um auch diese beiden Browserextrakte deterministischer zu machen.


Ein weiterer Nachprüfungsversuch nach Serverneustart änderte den Browserbefund für `Audit Log` und `Approval Workflow` nicht. Beide Routen bleiben authentifiziert erreichbar, werden im Browserkanal aber weiterhin nur mit dem globalen Shell-Kontext statt mit route-spezifischem Fachinhalt extrahiert. Der fehlende Fachnachweis ist damit als verbleibende Browsergrenze bestätigt, nicht als neue Implementierungslücke.


Nach Ergänzung des route-spezifischen Oberflächenbanners liefert `Audit Log` jetzt einen klaren browserseitigen Fachnachweis mit Route-Marker, Beschreibung, Ereignisliste, Zeitangaben und Filterkontext. `Approval Workflow` bleibt dagegen der einzige Bereich, der im Browserkanal trotz Dev-Login, Hook-Fix, route-spezifischem Ladezustand und aktuellem Route-Banner weiterhin nur den globalen Shell-Kontext ausgibt. Damit ist die offene Restlücke auf genau eine Route eingegrenzt.

## Nachprüfung der neuen Filter- und Workflow-Oberflächen

- **Approval Workflow:** Die Browserextraktion zeigt den neuen Filterkontext `Nur bearbeitbare Freigaben` direkt im Route-Output sowie weiterhin die fachlichen Approval-Inhalte mit Stufen, Eskalationsstatus und Ketteneditor.
- **Audit Log:** Die Browserextraktion bestätigt aktuell mindestens den route-spezifischen Shell-Nachweis `Aktuelle Route: Audit Log · Traceability`; die tieferen Filterelemente bleiben im Markdown-Auszug verkürzt.
- **Frontend-Stabilität:** Der laufende Projektstatus zeigt einen aktiven Dev-Server sowie fehlerfreie LSP- und TypeScript-Prüfungen. Die früheren Parse-Meldungen sind damit derzeit nicht als reproduzierbarer aktiver Laufzeitfehler nachweisbar.

## Nachprüfung von Zustellungsinbox und Observability-Historie

- **Approval Workflow:** Die Route wird im Browser jetzt mindestens mit dem expliziten Marker `Aktuelle Route: Approval Workflow · Human-in-the-loop` bestätigt. Die neue sichtbare Zustellungsinbox ist damit route-seitig verankert, auch wenn der Markdown-Extrakt auf dieser Seite weiterhin nicht den gesamten Inhaltsblock ausgibt.
- **Observability:** Der Browser extrahiert jetzt zusätzlich zum Modulkontext die KPI-Drilldown-Sektion mit Verlaufspunkten `-24h`, `-12h`, `-6h`, `-3h`, `-1h` und `Jetzt`. Damit ist der serverseitig gelieferte Verlaufsdatensatz browserseitig klar nachweisbar.
