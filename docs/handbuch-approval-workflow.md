# Handbuch: Approval Workflow

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Approval Workflow  
**Zielgruppe:** Approver, Teamleitungen, Governance- und Operations-Verantwortliche  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Der **Approval Workflow** ist das Modul für kontrollierte Freigaben. Immer dann, wenn ein Agent eine kritische Aktion auslösen möchte oder ein Prozess menschliche Entscheidung braucht, kommt dieses Modul ins Spiel. Hier sehen Sie offene Freigaben, Eskalationen, Benachrichtigungen und mehrstufige Genehmigungsketten. Das Ziel ist einfach: **wichtige Entscheidungen sollen nicht im Verborgenen passieren, sondern nachvollziehbar geprüft und bewusst freigegeben werden**.[1] [2] [3]

Besonders in regulierten, sensiblen oder produktionsnahen Umgebungen ist dieses Modul einer der wichtigsten Sicherheitsanker der gesamten Plattform.

## 2. Wann Sie dieses Modul benutzen sollten

Sie nutzen den Approval Workflow immer dann, wenn eine Aktion nicht automatisch durchgeführt werden darf. Das kann zum Beispiel eine produktionsnahe Änderung, ein sensibler Datenzugriff, eine eskalierte Entscheidung oder eine Freigabe im Rahmen eines Schwarm-Prozesses sein. Auch Benachrichtigungen an bestimmte Rollen und mehrstufige Freigaben werden hier sichtbar.[1] [2]

| Situation | Rolle des Moduls |
| --- | --- |
| Ein Agent möchte eine kritische Aktion ausführen | Die Aktion wird einer Freigabe zugeführt. |
| Eine Entscheidung braucht mehrere Stufen | Die Genehmigungskette wird sichtbar abgearbeitet. |
| Eine Freigabe läuft zu lange | Eskalationen werden dokumentiert. |
| Eine Rolle soll gezielt informiert werden | Zustellungsinbox und Benachrichtigungen greifen. |

## 3. So ist die Oberfläche aufgebaut

Der Approval Workflow besteht aus mehreren operativen Bereichen. Ganz oben finden Sie die **rollenbasierte Zustellungsinbox**. Darunter folgen die **Filter- und Listenansichten für Freigaben**. Zusätzlich gibt es Bereiche für **gespeicherte Ansichten**, **Genehmigungsketten**, **Simulationen** und die Zuweisung von Ketten an reale Workflows. Das Modul ist also nicht nur eine Eingabemaske, sondern eine komplette Steuerzentrale für menschliche Freigaben.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Rollenbasierte Zustellungsinbox** | Zeigt Benachrichtigungen zu Reviews, Übergaben und Eskalationen | Zustellungen prüfen |
| **Freigabeliste mit Filtern** | Zeigt offene oder abgeschlossene Freigaben nach Status, Risiko und Eskalation | Freigaben suchen und eingrenzen |
| **Gespeicherte Ansichten** | Merkt häufig genutzte Filterkombinationen | Wiederkehrende Sicht laden |
| **Genehmigungsketten-Editor** | Definiert mehrstufige Freigabemuster | Neue Kette anlegen oder ändern |
| **Simulation** | Zeigt die Wirkung einer Kette vor dem Einsatz | Freigabepfad und Zeitverlauf testen |

## 4. Die Zustellungsinbox einfach erklärt

Im oberen Bereich werden Review-, Übergabe- oder Eskalationsnachrichten mit Zielrolle, aktuellem Owner und Eskalationsziel angezeigt. Dadurch können Freigabeverantwortliche schnell sehen, welche Vorgänge ihre Aufmerksamkeit brauchen. Die Filterung nach Rolle hilft besonders dann, wenn viele unterschiedliche Freigabearten parallel laufen.[1]

Wenn Sie im Alltag mit mehreren Rollen arbeiten, ist diese Inbox oft der schnellste Einstiegspunkt. Sie zeigt nicht nur **dass** etwas offen ist, sondern auch **für wen** und **wie dringend**.

## 5. Freigaben filtern und wiederfinden

Darunter liegt die eigentliche Arbeitsliste. Sie kann nach **Status**, **Risikolevel**, **Eskalationsstatus**, **Suchbegriff** und dem Merkmal **nur bearbeitbare Freigaben** gefiltert werden. Diese Filter sind besonders nützlich, wenn viele Vorgänge gleichzeitig laufen und nicht jede Freigabe gleich dringend ist.[1]

| Filter | Wofür er hilft |
| --- | --- |
| **Status** | Trennt offene, genehmigte, abgelehnte oder abgelaufene Vorgänge |
| **Risikolevel** | Hebt besonders kritische Fälle hervor |
| **Eskalationsstatus** | Zeigt, ob bereits eskaliert wurde |
| **Suche** | Findet Vorgänge über Titel, Kette oder Anforderer |
| **Nur bearbeitbare Freigaben** | Zeigt nur Vorgänge, bei denen jetzt wirklich eine Aktion möglich ist |

## 6. Ansichten speichern

Wenn Sie regelmäßig mit denselben Filtern arbeiten, können Sie eine **Ansicht speichern**. Das ist besonders praktisch für Teamleitungen, Approver oder Incident-Verantwortliche, die immer wieder ähnliche Vorgänge prüfen. So müssen Sie die gleiche Filterkombination nicht jedes Mal neu einstellen.[1]

Ein sinnvolles Beispiel ist eine gespeicherte Sicht für **kritische, offene Freigaben mit Eskalation**. Damit lässt sich morgens sehr schnell klären, welche Entscheidungen zuerst bearbeitet werden müssen.

## 7. Schritt für Schritt: Eine Freigabe bearbeiten

Wenn eine Freigabe offen ist, beginnen Sie am besten mit dem Lesen von Titel, Zusammenfassung, Agentenbezug und aktueller Stufe. Danach prüfen Sie das Risikolevel und den Eskalationsstatus. Wenn die Freigabe bei Ihrer Rolle liegt, treffen Sie eine Entscheidung. Je nach Prozess kann die Entscheidung die Freigabe abschließen oder an die nächste Stufe weitergeben. Genau das ist wichtig: Eine genehmigte Teilentscheidung bedeutet nicht immer das Ende des Gesamtprozesses, sondern manchmal nur den Übergang zur nächsten Freigabestufe.[1]

## 8. Eskalationen verstehen

Nicht jede Freigabe wird rechtzeitig bearbeitet. Deshalb unterstützt das Modul Eskalationen. Wenn ein Vorgang zu lange offen bleibt, kann er an ein höheres oder alternatives Eskalationsziel weitergegeben werden. Dadurch bleibt der Prozess handlungsfähig, auch wenn die ursprünglich zuständige Stelle nicht reagiert.[1] [3]

Für den Alltag bedeutet das: Eine Eskalation ist kein Fehler im System, sondern ein bewusst eingeplanter Sicherheits- und Betriebsmechanismus.

## 9. Genehmigungsketten einfach erklärt

Ein besonders starker Teil des Moduls ist der **Genehmigungsketten-Editor**. Hier können Sie definieren, aus wie vielen Stufen eine Freigabe besteht, welche Rolle jede Stufe braucht, wann eskaliert wird und in welcher Reihenfolge der Prozess läuft. Die Ketten können einfach seriell, parallel oder verzweigt aufgebaut sein.[1] [3]

| Kettenart | Einfach erklärt | Wann sinnvoll |
| --- | --- | --- |
| **serial** | Eine Stufe nach der anderen | Klassische mehrstufige Freigaben |
| **parallel** | Mehrere Stufen laufen gleichzeitig | Wenn mehrere Parteien gleichzeitig entscheiden sollen |
| **branch** | Der Pfad verzweigt sich je nach Bedingung | Wenn Risiko oder Kontext unterschiedliche Wege erfordern |

## 10. Schritt für Schritt: Neue Genehmigungskette anlegen

Wenn Sie eine neue Kette aufbauen möchten, beginnen Sie mit Name, Beschreibung und Eskalationsmodus. Danach definieren Sie die einzelnen Stufen. Für jede Stufe werden Rollen, Standard-Owner, SLA, Eskalationszeit und Eskalationsziel festgelegt. Anschließend speichern Sie die Kette. Wichtig ist, dass alle Stufen vollständig ausgefüllt sind, sonst wird das Speichern zu Recht blockiert.[1]

Wer neu mit dem Modul arbeitet, sollte zuerst mit einer **einfachen seriellen Kette** beginnen. Verzweigungen und parallele Pfade eignen sich eher dann, wenn der Standardprozess bereits klar verstanden ist.

## 11. Simulation und Kalenderprofile

Das Modul enthält zusätzlich eine **Simulation**, mit der Sie prüfen können, wie eine Genehmigungskette voraussichtlich abläuft. Dabei spielen auch Zeitlogiken eine Rolle, etwa Geschäftszeiten, SLA-Vorgaben oder Feiertage. So sehen Sie nicht nur den logischen Freigabepfad, sondern auch den erwartbaren zeitlichen Verlauf.[1] [3]

Das ist besonders nützlich, wenn ein Prozess zwar formal richtig aussieht, aber in der Praxis zu langsam wäre. Die Simulation hilft also dabei, Freigaben nicht nur regelkonform, sondern auch alltagstauglich zu gestalten.

## 12. Praxisbeispiel

Stellen Sie sich vor, ein Agent möchte eine sensible produktionsnahe Änderung auslösen. Dafür wird eine dreistufige Kette angelegt: zuerst **Finance Review**, dann **Legal Confirmation**, danach **Executive Approval**. Jede Stufe hat ihre eigene SLA und ein Eskalationsziel. Wenn die zweite Stufe nicht rechtzeitig reagiert, wird an das festgelegte Eskalationsziel weitergegeben. In der Oberfläche sehen Approver die Zustellung, filtern offene Vorgänge, treffen Entscheidungen und verfolgen, wie der Fall zur nächsten Stufe weiterläuft.[1] [3]

Dieses Beispiel zeigt, warum der Approval Workflow mehr ist als nur ein „Freigabe-Button“: Er bildet echte Entscheidungsprozesse ab.

## 13. Empfehlungen für den Alltag

Arbeiten Sie im ersten Schritt mit wenigen, verständlichen Ketten. Benennen Sie Stufen so, dass sofort klar ist, wer zuständig ist. Prüfen Sie regelmäßig gespeicherte Ansichten und Eskalationsmuster. Und wenn ein Prozess immer wieder eskaliert, ist das ein guter Hinweis darauf, dass SLA, Verantwortlichkeiten oder Kettenlogik angepasst werden sollten.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Mit einfachen Ketten starten | Der Prozess bleibt verständlich. |
| Rollen klar benennen | Zuständigkeiten sind schneller erkennbar. |
| Ansichten speichern | Wiederkehrende Arbeitsabläufe werden schneller. |
| Simulation nutzen | Problematische Ketten werden früh erkannt. |

## 14. Zusammenfassung

Der Approval Workflow ist das Modul für **kontrollierte Entscheidungen mit menschlicher Beteiligung**. Er verbindet Zustellungsinbox, Freigabeliste, Eskalationssteuerung und Genehmigungsketten in einer Oberfläche. Wer kritische Agentenaktionen sicher steuern möchte, sollte dieses Modul aktiv pflegen und nicht nur als Ausnahmefall betrachten, sondern als festen Bestandteil des Betriebs.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
