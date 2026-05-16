# Handbuch: Audit Log

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Audit Log  
**Zielgruppe:** Governance-Verantwortliche, Teamleitungen, Revision, Operations  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Das **Audit Log** ist die nachvollziehbare Protokollspur der Agent Control Plane. Hier sehen Sie, welche Ereignisse stattgefunden haben, wann sie passiert sind, wie schwer sie eingestuft wurden und welcher Agent, Nutzer oder Systemprozess beteiligt war. Das Modul ist besonders wichtig, wenn Entscheidungen später erklärt, geprüft oder gegenüber anderen Stellen belegt werden müssen.[1] [2] [3]

Einfach gesagt beantwortet dieses Modul die Frage:

> **Was ist passiert, wer oder was war beteiligt und wie lässt sich der Vorgang später nachvollziehen?**

## 2. Wann Sie das Audit Log nutzen sollten

Das Audit Log ist immer dann hilfreich, wenn Sie einen Vorfall prüfen, eine Entscheidung nachvollziehen, ein Verhalten erklären oder eine bestimmte Aktivität wiederfinden möchten. Auch bei Unklarheiten im Betrieb ist dieses Modul oft die schnellste Informationsquelle. Es zeigt nicht nur Fehlersituationen, sondern auch normale, wichtige Governance-Ereignisse.[1] [2]

| Situation | Nutzen des Audit Logs |
| --- | --- |
| Eine Entscheidung soll später belegt werden | Die Ereigniskette bleibt nachvollziehbar. |
| Ein Vorfall muss untersucht werden | Relevante Einträge lassen sich filtern. |
| Ein Team fragt, warum etwas blockiert wurde | Die Protokollspur liefert den Kontext. |
| Governance-Prozesse sollen überprüft werden | Relevante Kategorien und Schweregrade sind sichtbar. |

## 3. So ist die Oberfläche aufgebaut

Die Oberfläche besteht aus einem Filterbereich, einer Ereignisliste und einem Abschnitt für gespeicherte Ansichten. So können Sie zuerst die relevante Sicht eingrenzen und dann gezielt mit den passenden Einträgen arbeiten. Die Liste ist bewusst filterbar aufgebaut, weil ein Audit Log im Alltag nur dann nützlich ist, wenn man nicht in allen Einträgen gleichzeitig suchen muss.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Filterleiste** | Eingrenzung nach Schweregrad, Kategorie, Akteur und Suchbegriff | Relevante Ereignisse finden |
| **Ereignisliste** | Anzeige der gefilterten Audit-Einträge | Einzelne Fälle prüfen |
| **Gespeicherte Ansichten** | Häufig genutzte Filterkombinationen ablegen | Wiederkehrende Sicht laden |

## 4. Die wichtigsten Filter einfach erklärt

Damit Sie schnell zur passenden Information kommen, können Sie das Audit Log nach mehreren Kriterien filtern. Diese Filter sind besonders hilfreich, wenn viele Ereignisse gleichzeitig sichtbar sind.[1]

| Filter | Bedeutung |
| --- | --- |
| **Schweregrad** | Trennt unkritische, warnende und kritische Einträge |
| **Kategorie** | Gruppiert Ereignisse nach Themenbereichen |
| **Akteur** | Unterscheidet Agent, Nutzer und System |
| **Suche** | Findet Einträge über Titel, Detailtext, Agent oder Referenz |

## 5. So lesen Sie einen Audit-Eintrag

Jeder Eintrag zeigt einen Titel, eine Beschreibung, den Schweregrad, den betroffenen Agenten, die Kategorie, den Akteurstyp und eine Zeitangabe. Dadurch können Sie einen Vorgang in wenigen Sekunden grob einordnen. Wenn Sie mehrere ähnliche Einträge sehen, helfen vor allem Kategorie und Akteurstyp dabei, den Vorgang richtig zu gruppieren.[1]

Die Zeitangabe ist ebenfalls wichtig. In vielen Fällen geht es nicht nur darum, **dass** etwas passiert ist, sondern auch **wann** und in welcher Reihenfolge.

## 6. Schritt für Schritt: Einen Vorfall prüfen

Wenn Sie einen Vorfall nachvollziehen möchten, beginnen Sie mit dem Schweregrad. Danach wählen Sie – wenn sinnvoll – eine passende Kategorie oder einen Akteurstyp. Anschließend geben Sie einen Suchbegriff ein, zum Beispiel einen Agentennamen oder ein Schlagwort aus dem Vorgang. Danach lesen Sie die gefilterten Einträge in zeitlicher Abfolge. So entsteht aus einzelnen Meldungen eine zusammenhängende Geschichte.[1]

Gerade bei komplexeren Fällen ist dieses Vorgehen hilfreicher als das ungefilterte Durchscrollen aller Ereignisse.

## 7. Gespeicherte Ansichten nutzen

Im Audit Log können Sie häufig genutzte Filterkombinationen als **Ansicht speichern**. Das ist besonders nützlich für wiederkehrende Prüfungen, zum Beispiel für Incident Reviews, Approval Traceability oder Connector-bezogene Governance-Fälle. Eine gespeicherte Ansicht spart Zeit und sorgt dafür, dass Teams immer wieder mit derselben fachlichen Sicht auf die Daten schauen.[1]

| Beispiel für eine gespeicherte Ansicht | Wofür sie gut ist |
| --- | --- |
| **Kritische Governance-Ereignisse** | Schnelle Prüfung ernster Fälle |
| **Agentenereignisse eines Fachbereichs** | Bereichsspezifische Nachverfolgung |
| **Approval Traceability** | Rückblick auf Freigabeentscheidungen |
| **Connector Review** | Prüfung von Anbindungs- oder Tool-bezogenen Ereignissen |

## 8. Praxisbeispiel

Angenommen, ein Team möchte verstehen, warum eine kritische Aktion eines Agenten nicht wie erwartet weiterlief. Im Audit Log filtern Sie zunächst nach **warning** oder **critical**, wählen die passende Kategorie und suchen nach dem Namen des betroffenen Agenten. Anschließend prüfen Sie die zugehörigen Einträge, zum Beispiel Governance-Hinweise, Freigabeereignisse oder Systemsignale. So lässt sich Schritt für Schritt nachvollziehen, welche Entscheidung oder welcher Schutzmechanismus den Prozess beeinflusst hat.[1] [3]

## 9. Empfehlungen für den Alltag

Das Audit Log ist besonders stark, wenn Sie es nicht nur im Problemfall öffnen, sondern auch für regelmäßige Reviews nutzen. Gespeicherte Ansichten helfen dabei, typische Prüfroutinen zu standardisieren. Außerdem lohnt es sich, Einträge immer zusammen mit den Modulen **Approval Workflow**, **Runtime Guardrails** und **Agenten-Verwaltung** zu betrachten, weil dort oft der operative Ursprung eines Audit-Falls liegt.[1] [2] [3]

| Empfehlung | Warum sie hilfreich ist |
| --- | --- |
| Regelmäßig mit Filtern arbeiten | Die Sicht bleibt fokussiert. |
| Ansichten für wiederkehrende Fälle speichern | Prüfungen werden schneller und konsistenter. |
| Schweregrad und Kategorie gemeinsam lesen | Fälle lassen sich besser einordnen. |
| Audit nie isoliert betrachten | Der Zusammenhang zu anderen Modulen bleibt erhalten. |

## 10. Zusammenfassung

Das Audit Log ist das Modul für **Nachvollziehbarkeit, Prüfung und Rückblick**. Es macht sichtbar, welche Ereignisse im Betrieb wirklich passiert sind und hilft dabei, diese strukturiert einzuordnen. Wer mit Agenten sicher und verantwortungsvoll arbeiten möchte, sollte dieses Modul als festen Bestandteil der täglichen oder wöchentlichen Kontrolle nutzen.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
