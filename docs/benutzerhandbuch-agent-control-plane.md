# Benutzerhandbuch: Agent Control Plane

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Zielgruppe:** Fachanwender, Teamleitungen, Operations-, Governance- und Freigabe-Verantwortliche  
**Stand:** 16. Mai 2026

## 1. Willkommen

Die **Agent Control Plane** ist ein Werkzeug, mit dem Unternehmen ihre KI-Agenten nicht nur starten, sondern **verständlich steuern, überwachen und absichern** können. Das Programm hilft dabei, einzelne Agenten, ganze Agenten-Schwärme, Freigaben, Regeln, Protokolle, Datenschutz, Verbindungen und Kosten an einem Ort zusammenzuführen. Die Oberfläche ist deshalb wie ein zentrales Dashboard aufgebaut: zuerst der Überblick, danach die operative Arbeit, anschließend Regeln, Kontrolle und Monitoring.[1] [2] [3]

Dieses Handbuch ist bewusst **einfach und kundenfreundlich** geschrieben. Es richtet sich also nicht nur an technisch erfahrene Personen, sondern auch an Menschen, die das Thema erst kennenlernen. Sie müssen keine Entwicklerkenntnisse mitbringen. Wichtiger ist, zu verstehen, **welches Modul wofür da ist**, **wann man es benutzt** und **welche Schritte im Alltag sinnvoll sind**.[1] [2]

## 2. Wofür dieses Tool gedacht ist

Die Agent Control Plane unterstützt Teams, die KI-Agenten produktiv einsetzen möchten, aber dabei nicht auf Übersicht und Kontrolle verzichten wollen. Statt Agenten „im Hintergrund einfach laufen zu lassen“, schafft das Tool einen klaren Betriebsrahmen: Wer darf was tun, welche Aktionen sind erlaubt oder freigabepflichtig, welche Vorfälle sind kritisch, welche Regeln gelten und wie lassen sich Entscheidungen später nachvollziehen?[1] [3]

| Nutzen im Alltag | Was das für Sie bedeutet |
| --- | --- |
| **Zentrale Übersicht** | Sie sehen wichtige Signale und Risiken auf einen Blick. |
| **Klare Zuständigkeiten** | Teams, Rollen und Rechte bleiben nachvollziehbar geregelt. |
| **Sichere Freigaben** | Kritische Aktionen laufen nicht unkontrolliert, sondern über definierte Prüfpfade. |
| **Nachvollziehbarkeit** | Ereignisse und Entscheidungen bleiben im Audit-Kontext sichtbar. |
| **Besseres Monitoring** | Leistung, Fehler und Kosten können laufend beobachtet werden. |

## 3. So ist die Anwendung aufgebaut

Die Navigation der Anwendung folgt einer klaren Reihenfolge. Sie beginnt mit dem Überblick und führt anschließend in die Module für operative Arbeit, Governance, Sicherheit und Monitoring. Dadurch müssen Nutzer nicht erst rätseln, wo eine Aufgabe hingehört. Die Benennung der Module ist in der Oberfläche bereits sprechend angelegt und wird in diesem Handbuch genauso verwendet.[1] [2]

| Route | Modul | Einfach erklärt |
| --- | --- | --- |
| `/` | **Dashboard-Übersicht** | Der Startpunkt für die allgemeine Lage: Kennzahlen, Risiken, Kosten und Statussignale. |
| `/agents` | **Agenten-Verwaltung** | Hier legen Sie Agenten und Schwärme an, beobachten Kommunikation und steuern Reporting. |
| `/policies` | **Policy Engine** | Hier definieren Sie Regeln dafür, was erlaubt, verboten oder freigabepflichtig ist. |
| `/access` | **Rollen- und Rechteverwaltung** | Hier verwalten Sie Teams, Rollen und Zugriffsrechte. |
| `/approvals` | **Approval Workflow** | Hier bearbeiten Sie Freigaben, Eskalationen und Genehmigungsketten. |
| `/audit` | **Audit Log** | Hier finden Sie die nachvollziehbare Protokollspur. |
| `/connectors` | **Tool & Connector Layer** | Hier sehen Sie, welche Systeme angebunden sind und wie stabil sie laufen. |
| `/evaluations` | **Evaluation Layer** | Hier prüfen Sie Agenten vor dem Einsatz mit Testfällen und Qualitätskriterien. |
| `/guardrails` | **Runtime Guardrails** | Hier sichern Sie den laufenden Betrieb gegen Risiken, Datenschutzprobleme und Grenzverletzungen ab. |
| `/observability` | **Observability & Cost Monitoring** | Hier beobachten Sie Leistung, Fehler, Kosten und Nutzungstrends. |

## 4. Empfohlener Einstieg für neue Nutzer

Wer das Tool zum ersten Mal nutzt, sollte nicht sofort in allen Bereichen gleichzeitig arbeiten. Sinnvoller ist ein schrittweiser Einstieg. Zuerst lohnt sich ein Blick in die **Dashboard-Übersicht**, damit Sie ein Gefühl für die Gesamtlage bekommen. Danach empfiehlt sich die **Agenten-Verwaltung**, weil dort die operative Basis gelegt wird. Anschließend folgen Regeln, Rechte und Freigaben. Erst wenn diese Grundlagen stehen, werden Monitoring und vertiefte Betriebsprüfung besonders wertvoll.[1] [3]

| Reihenfolge | Modul | Warum dieser Schritt zuerst oder danach sinnvoll ist |
| --- | --- | --- |
| **1** | Dashboard-Übersicht | Sie verstehen zuerst die Gesamtlage. |
| **2** | Agenten-Verwaltung | Hier entsteht die operative Grundlage. |
| **3** | Policy Engine | Regeln werden festgelegt, bevor Risiken entstehen. |
| **4** | Rollen- und Rechteverwaltung | Zuständigkeiten und Zugriffe werden sauber verteilt. |
| **5** | Approval Workflow | Kritische Aktionen erhalten einen kontrollierten Freigabepfad. |
| **6** | Audit Log | Entscheidungen und Ereignisse bleiben nachvollziehbar. |
| **7** | Tool & Connector Layer | Anbindungen und Systemzugriffe werden sichtbar geprüft. |
| **8** | Evaluation Layer | Agenten werden vor dem Einsatz getestet. |
| **9** | Runtime Guardrails | Der laufende Betrieb wird aktiv abgesichert. |
| **10** | Observability & Cost Monitoring | Leistung, Kosten und Fehlerbilder werden dauerhaft beobachtet. |

## 5. Wie dieses Handbuch aufgebaut ist

Dieses Dokument ist die **zentrale Einstiegshilfe**. Es erklärt das Gesamtwerkzeug, die Navigationslogik und den empfohlenen Arbeitsablauf. Die eigentlichen Detailanleitungen werden **modulweise** gepflegt. Dadurch bleibt jedes Kapitel übersichtlich und kann einfacher erweitert werden, wenn neue Funktionen hinzukommen.[1] [3]

| Dokument | Inhalt | Status |
| --- | --- | --- |
| **`docs/benutzerhandbuch-agent-control-plane.md`** | Zentrale Einführung und Modulübersicht | aktiv |
| **`docs/handbuch-agenten-verwaltung.md`** | Ausführliche Bedienungsanleitung für die Agenten-Verwaltung | aktiv |
| **Weitere Modulhandbücher** | Detaillierte Schritt-für-Schritt-Anleitungen pro Modul | werden modulweise ergänzt |

## 6. Was Sie in den Modulhandbüchern finden werden

Jedes Modulhandbuch folgt möglichst derselben Logik. Zuerst wird erklärt, **wofür das Modul gedacht ist**. Danach folgt eine einfache Beschreibung der sichtbaren Bereiche in der Oberfläche. Anschließend kommen **Schritt-für-Schritt-Anleitungen**, **Praxisbeispiele** und kurze Hinweise dazu, wann ein Modul im Alltag besonders nützlich ist. Ziel ist nicht, technische Details in den Vordergrund zu stellen, sondern echte Arbeitsabläufe verständlich zu machen.[2] [3]

> **Grundidee dieses Handbuchs:** Nicht „Wie funktioniert der Code?“, sondern „Wie benutze ich dieses Werkzeug sicher, verständlich und sinnvoll im Alltag?“

## 7. Typischer Arbeitsablauf im Alltag

Ein realistischer Arbeitsablauf beginnt oft damit, dass ein Team neue Agenten oder einen neuen Schwarm vorbereitet. Danach werden Regeln und Rechte definiert. Kritische Aufgaben laufen anschließend über Freigaben. Alle wichtigen Ereignisse bleiben im Audit Log sichtbar. Vor produktiven Änderungen werden Agenten getestet, während Guardrails und Monitoring den laufenden Betrieb absichern. Genau deshalb greifen die Module inhaltlich ineinander und sollten nicht als isolierte Einzelflächen verstanden werden.[1] [3]

| Alltagssituation | Passendes Modul |
| --- | --- |
| Ein neuer Agent soll eingerichtet werden | **Agenten-Verwaltung** |
| Eine Aktion soll nur mit Freigabe erlaubt sein | **Policy Engine** und **Approval Workflow** |
| Ein Team braucht Zugriff auf einen bestimmten Agenten | **Rollen- und Rechteverwaltung** |
| Eine Entscheidung muss später nachvollziehbar sein | **Audit Log** |
| Ein angebundenes System wirkt instabil | **Tool & Connector Layer** |
| Ein Agent soll vor dem Einsatz geprüft werden | **Evaluation Layer** |
| Ein Grenzwert wurde verletzt | **Runtime Guardrails** |
| Kosten oder Fehlerraten steigen auffällig | **Observability & Cost Monitoring** |

## 8. Nächste Schritte

Wenn Sie neu mit dem Tool arbeiten, beginnen Sie am besten mit dem Modul **Agenten-Verwaltung**, weil dort die wichtigsten Arbeitsobjekte entstehen. Danach sollten Sie direkt die **Policy Engine** und die **Rollen- und Rechteverwaltung** aufbauen, damit Agenten nicht ohne Regeln und ohne klare Verantwortlichkeiten arbeiten. Weitere Kapitel dieses Handbuchs werden modulweise ergänzt, damit daraus schrittweise eine vollständige, kundenfreundliche Bedienungsdokumentation für die gesamte Plattform entsteht.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
