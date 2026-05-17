# Handbuch: Dashboard-Übersicht

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Dashboard-Übersicht  
**Zielgruppe:** Neue Nutzer, Teamleitungen, Operations, Governance-Verantwortliche  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Die **Dashboard-Übersicht** ist der zentrale Einstieg in die Agent Control Plane. Dieses Modul zeigt nicht jedes Detail, sondern die **wichtigsten Signale auf einen Blick**. Genau deshalb ist es für neue Nutzer besonders wertvoll: Sie müssen nicht sofort verstehen, wie alle einzelnen Module im Detail funktionieren, sondern können sich zuerst ein Bild von der Gesamtlage machen. Sichtbar werden unter anderem aktive Agenten, ausstehende Freigaben, Audit-Signale, Kosten und kritische Guardrail-Ereignisse.[1] [2] [3]

Einfach gesagt beantwortet die Dashboard-Übersicht die Frage:

> **Wie steht es gerade insgesamt um unseren Agentenbetrieb?**

## 2. Wann Sie die Dashboard-Übersicht benutzen sollten

Die Dashboard-Übersicht ist fast immer der beste Startpunkt, wenn Sie die Plattform öffnen. Sie eignet sich besonders am Tagesanfang, vor einer Teamrunde, vor Governance-Entscheidungen oder immer dann, wenn Sie schnell einschätzen möchten, ob es akuten Handlungsbedarf gibt. Statt direkt in einzelne Fachmodule zu springen, erhalten Sie hier zuerst eine verdichtete Lageeinschätzung.[1] [2]

| Situation | Warum die Dashboard-Übersicht hilfreich ist |
| --- | --- |
| Arbeitsbeginn am Morgen | Sie sehen sofort, ob Agenten, Freigaben oder Risiken Aufmerksamkeit brauchen. |
| Vor einem Team- oder Lagegespräch | Sie erhalten eine gemeinsame Gesprächsgrundlage. |
| Bei Unsicherheit über die Gesamtlage | Das Modul zeigt die wichtigsten Prioritäten in kompakter Form. |
| Vor dem Wechsel in Detailmodule | Sie erkennen schneller, welches Modul als Nächstes relevant ist. |

## 3. So ist die Oberfläche aufgebaut

Die Dashboard-Übersicht ist bewusst klar gegliedert. Zuerst sehen Sie oben die wichtigsten Kennzahlen als kompakte Karten. Danach folgen visuelle Bereiche für **Gesundheitszustand und Kosten**, die **Status-Verteilung der Agenten**, die **ausstehenden Freigaben** und die **neuesten Audit-Signale**. Diese Reihenfolge ist sinnvoll, weil sie von der kompakten Management-Sicht schrittweise in konkrete Handlungsfelder führt.[1]

| Bereich | Wofür er gedacht ist | Typische Frage |
| --- | --- | --- |
| **Kennzahlenkarten** | Schnellüberblick über die wichtigsten Kernwerte | Wo gibt es sofortigen Handlungsbedarf? |
| **Agent Health & Cost Posture** | Kombination aus Kosten- und Leistungsbild | Welche Agenten fallen bei Kosten oder Latenz auf? |
| **Status-Verteilung** | Anteil gesunder, warnender, pausierter oder offline Agenten | Wie stabil ist der Betrieb insgesamt? |
| **Ausstehende Freigaben** | Liste offener Entscheidungen mit menschlicher Verantwortung | Welche Vorgänge warten auf eine Entscheidung? |
| **Neueste Audit-Signale** | Relevante Governance-, Approval- und Guardrail-Ereignisse | Welche Risiken oder besonderen Vorkommnisse sind zuletzt entstanden? |

## 4. Die vier Kennzahlenkarten einfach erklärt

Ganz oben sehen Sie vier kompakte Kennzahlenkarten. Diese Karten liefern einen sehr schnellen Überblick. Für neue Nutzer ist das besonders hilfreich, weil sie sofort verstehen können, welche Themen im System gerade eine größere Rolle spielen.[1]

| Kennzahl | Einfach erklärt | Warum sie wichtig ist |
| --- | --- | --- |
| **Aktive Agenten** | Wie viele Agenten aktuell im Betrieb sind | Zeigt die aktuelle Betriebsgröße |
| **Ausstehende Freigaben** | Wie viele kritische Aktionen auf menschliche Entscheidung warten | Zeigt offenen Governance-Bedarf |
| **Audit-Events** | Wie viele sicherheits- oder governance-relevante Signale dokumentiert wurden | Zeigt Auffälligkeiten und Nachvollziehbarkeit |
| **Monatliche Kosten** | Aggregierte API- und Laufzeitkosten | Zeigt die wirtschaftliche Seite des Betriebs |

Wenn zum Beispiel die Zahl der **ausstehenden Freigaben** ungewöhnlich hoch ist, kann das ein Hinweis darauf sein, dass Entscheidungen stocken oder ein bestimmter Prozess zu viele manuelle Prüfungen erzeugt.

## 5. Agent Health & Cost Posture verstehen

Im linken Analysebereich wird die Verbindung von **Kosten** und **Latenz** pro priorisiertem Agenten sichtbar gemacht. Das ist wichtig, weil ein Agent nicht nur fachlich korrekt arbeiten soll, sondern auch in einem sinnvollen Verhältnis von Reaktionsgeschwindigkeit und Kosten stehen muss. Dieser Bereich hilft daher vor allem bei der Frage, ob einzelne Agenten betriebswirtschaftlich oder technisch aus dem Rahmen fallen.[1] [3]

Für nichttechnische Nutzer genügt meist ein einfacher Blick: Wenn ein Agent im Vergleich zu anderen deutlich auffälliger wirkt, lohnt sich der Wechsel in das Modul **Observability & Cost Monitoring**.

## 6. Status-Verteilung richtig lesen

Rechts daneben zeigt ein Diagramm die **operative Verteilung der Agentenzustände**. Typischerweise werden Agenten als **Healthy**, **Warning**, **Paused** oder **Offline** dargestellt. Zusätzlich wird ein durchschnittlicher Latenzwert eingeblendet. Diese Kombination ist hilfreich, weil sie nicht nur einzelne Agenten, sondern das Gesamtbild des Betriebs sichtbar macht.[1]

| Status | Einfach erklärt | Bedeutung im Alltag |
| --- | --- | --- |
| **Healthy** | Der Agent arbeitet im normalen Rahmen | Kein akuter Handlungsbedarf |
| **Warning** | Es gibt Auffälligkeiten oder Vorwarnsignale | Beobachtung oder Prüfung sinnvoll |
| **Paused** | Der Agent ist bewusst gestoppt | Betrieb läuft nicht aktiv weiter |
| **Offline** | Der Agent ist aktuell nicht verfügbar | Möglicher technischer oder organisatorischer Klärungsbedarf |

Wenn der Anteil von **Warning** oder **Offline** steigt, ist das meist ein Zeichen dafür, dass Sie tiefer in andere Module schauen sollten, etwa in **Agenten-Verwaltung**, **Runtime Guardrails** oder **Tool & Connector Layer**.[1] [2]

## 7. Ausstehende Freigaben bearbeiten und priorisieren

Im Bereich **Ausstehende Freigaben** sehen Sie offene Entscheidungen mit menschlicher Verantwortung. Pro Eintrag werden Titel, Zusammenfassung, betroffener Agent, Risiko-Level und Zeitbezug angezeigt. Für den Alltag ist das besonders nützlich, weil Freigaben nicht nur „offen“ sind, sondern auch priorisiert verstanden werden müssen.[1]

Ein sinnvoller Ablauf ist, zuerst die Freigaben mit hohem oder kritischem Risiko anzusehen. Danach prüfen Sie, welcher Agent betroffen ist und wie lange die Freigabe bereits offen ist. Falls Sie tiefer arbeiten müssen, wechseln Sie anschließend in das Modul **Approval Workflow**.

## 8. Neueste Audit-Signale einfach verstehen

Im Bereich **Neueste Audit-Signale** werden aktuelle Governance-, Approval- und Guardrail-Ereignisse angezeigt. Zu jedem Ereignis sehen Sie Titel, Beschreibung, Kategorie, Schweregrad und Zeitbezug. Dieser Bereich ist wertvoll, weil er keine vollständige Protokollsuche ersetzt, aber sehr schnell zeigt, welche relevanten Signale zuletzt entstanden sind.[1]

Gerade für Teamleitungen ist das hilfreich: Statt das gesamte Audit Log zu durchsuchen, erkennen sie hier sofort, ob in letzter Zeit etwas Kritisches passiert ist.

## 9. Schritt für Schritt: So nutzen neue Nutzer das Dashboard sinnvoll

Wenn Sie neu in der Plattform sind, beginnen Sie zuerst mit den vier Kennzahlenkarten. Dadurch verstehen Sie die grobe Gesamtlage. Danach betrachten Sie die Status-Verteilung, um ein Gefühl für die Stabilität des Betriebs zu bekommen. Anschließend prüfen Sie die ausstehenden Freigaben, weil dort häufig konkrete Entscheidungen warten. Zum Schluss werfen Sie einen Blick auf die neuesten Audit-Signale. So arbeiten Sie sich von der größten Übersicht Schritt für Schritt in die wichtigsten Prioritäten hinein.[1] [2]

| Empfohlene Reihenfolge | Was Sie dabei lernen |
| --- | --- |
| **1. Kennzahlenkarten lesen** | Wie groß und wie belastet der Betrieb gerade ist |
| **2. Status-Verteilung prüfen** | Ob der Gesamtzustand stabil oder auffällig ist |
| **3. Freigaben ansehen** | Wo menschliche Entscheidungen gebraucht werden |
| **4. Audit-Signale lesen** | Welche aktuellen Risiken oder besonderen Ereignisse vorliegen |
| **5. In Detailmodule wechseln** | Welches Modul für die nächste Analyse geeignet ist |

## 10. Praxisbeispiel

Stellen Sie sich vor, Sie öffnen die Plattform morgens zum ersten Mal an einem Arbeitstag. Im Dashboard sehen Sie, dass die Zahl der **ausstehenden Freigaben** erhöht ist. Gleichzeitig zeigt die Status-Verteilung mehrere Agenten im Bereich **Warning**. In den neuesten Audit-Signalen erscheinen aktuelle Governance- oder Guardrail-Hinweise. Damit wissen Sie schon nach kurzer Zeit: Heute sollten zuerst die Freigaben und die auffälligen Agenten geprüft werden. Der nächste sinnvolle Schritt ist dann der Wechsel in **Approval Workflow**, **Agenten-Verwaltung** oder **Runtime Guardrails** – je nachdem, welches Signal im Dashboard am stärksten auffällt.[1] [2] [3]

## 11. Empfehlungen für den Alltag

Die Dashboard-Übersicht sollte nicht isoliert betrachtet werden. Sie ist am wertvollsten als **Einstieg und Wegweiser** in die anderen Module. Wenn Sie hier Auffälligkeiten sehen, sollten Sie danach bewusst in das passende Detailmodul wechseln. Genau dadurch erfüllt die Übersicht ihre eigentliche Aufgabe: nicht jede Frage selbst zu beantworten, sondern die richtigen nächsten Schritte sichtbar zu machen.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Das Dashboard immer zuerst öffnen | Sie gewinnen schnell ein Gesamtbild. |
| Nicht nur auf Kosten schauen | Freigaben, Audit-Signale und Statusbild sind genauso wichtig. |
| Auffälligkeiten sofort in Detailmodulen prüfen | Probleme werden schneller richtig eingeordnet. |
| Das Dashboard als Tages- und Lageansicht nutzen | Die Plattform wird deutlich einfacher bedienbar. |

## 12. Zusammenfassung

Die Dashboard-Übersicht ist das Modul für den **schnellen, verständlichen Gesamteinstieg** in die Agent Control Plane. Sie zeigt die wichtigsten Kennzahlen, Zustände, offenen Entscheidungen und aktuellen Signale in einer verdichteten Form. Gerade für Nutzer, die sich noch nicht tief mit dem System auskennen, ist dieses Modul der beste Startpunkt, weil es Orientierung schafft und direkt auf die relevanten Folgeschritte hinweist.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
