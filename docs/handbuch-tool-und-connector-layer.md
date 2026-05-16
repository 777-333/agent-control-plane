# Handbuch: Tool & Connector Layer

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Tool & Connector Layer  
**Zielgruppe:** Operations, Integrationsverantwortliche, Teamleitungen  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Der **Tool & Connector Layer** zeigt Ihnen, welche Systeme, Dienste oder Schnittstellen mit der Agent Control Plane verbunden sind. Dazu gehören zum Beispiel CRM-, ERP-, E-Mail-, Browser- oder Datenbankverbindungen. Das Modul macht sichtbar, **welche Verbindung existiert**, **wie ihr Zustand ist**, **wie sie authentifiziert wird** und **welche Agenten daran hängen**.[1] [2] [3]

Dieses Modul ist wichtig, weil Agenten in der Praxis nur dann sinnvoll arbeiten können, wenn ihre Verbindungen zu den benötigten Systemen stabil und kontrollierbar sind.

## 2. Wann Sie dieses Modul nutzen sollten

Sie öffnen dieses Modul immer dann, wenn Sie prüfen möchten, ob eine Anbindung verfügbar ist, ob ein Connector problemfrei läuft oder ob ein Agent mit dem richtigen System verbunden ist. Auch bei Betriebsstörungen lohnt sich ein Blick hierher, weil Status, letzte Synchronisation und Authentifizierungsart direkt sichtbar sind.[1] [2]

| Situation | Nutzen des Moduls |
| --- | --- |
| Ein Agent kann nicht wie erwartet arbeiten | Sie prüfen zuerst die Verbindung zu den benötigten Systemen. |
| Eine Schnittstelle wirkt instabil | Der Connector-Status zeigt erste Hinweise. |
| Sie möchten wissen, wie ein System angebunden ist | Endpoint und Auth Mode sind sichtbar. |
| Sie möchten die betroffenen Agenten nachvollziehen | Linked Agents geben schnellen Überblick. |

## 3. So ist die Oberfläche aufgebaut

Die Oberfläche zeigt Connectoren als übersichtliche Karten. Jede Karte enthält den Namen des Connectors, seinen Typ, den Status und mehrere Detailwerte. Dadurch können auch nichttechnische Nutzer schnell erkennen, ob ein System grundsätzlich gesund wirkt oder näher geprüft werden sollte.[1]

| Kartenelement | Bedeutung |
| --- | --- |
| **Name** | Bezeichnung der Verbindung |
| **Typ** | Art des Systems oder Connectors |
| **Status** | Technischer Zustand der Verbindung |
| **Endpoint** | Zielsystem oder Endpunktbeschreibung |
| **Auth Mode** | Art der Authentifizierung |
| **Linked Agents** | Anzahl der angebundenen Agenten |
| **Last Sync** | Zeitpunkt der letzten Synchronisation |

## 4. Die Statuswerte einfach erklärt

Der Status eines Connectors ist der schnellste Gesundheitsindikator im Modul. In der Oberfläche werden verschiedene Zustände farblich markiert. Dadurch erkennen Sie sofort, ob eine Verbindung stabil läuft oder Aufmerksamkeit braucht.[1]

| Status | Einfach erklärt | Bedeutung im Alltag |
| --- | --- | --- |
| **connected** | Die Verbindung läuft | Normaler Betriebszustand |
| **degraded** | Die Verbindung läuft eingeschränkt | Beobachtung oder Prüfung sinnvoll |
| **disconnected** | Die Verbindung ist nicht aktiv | Betrieb kann beeinträchtigt sein |

## 5. Schritt für Schritt: Einen Connector prüfen

Wenn Sie einen Connector prüfen möchten, beginnen Sie mit dem Status. Danach sehen Sie sich den Typ und den Endpoint an, um den fachlichen Bezug zu verstehen. Anschließend prüfen Sie den Auth Mode und die Anzahl der angebundenen Agenten. Zum Schluss betrachten Sie den Wert **Last Sync**, um einzuschätzen, wie aktuell die Verbindung ist. Dieser Ablauf ist hilfreich, weil er zuerst die Betriebsfrage beantwortet und danach den Kontext liefert.[1]

## 6. Authentifizierung einfach verstehen

Das Feld **Auth Mode** zeigt, wie sich die Verbindung gegenüber dem Zielsystem anmeldet. Für Fachanwender muss dabei nicht jeder technische Standard im Detail bekannt sein. Wichtig ist vor allem, dass hier sichtbar bleibt, **dass** eine Verbindung kontrolliert abgesichert ist und nicht „einfach offen“ arbeitet. Gerade bei sensiblen Geschäftssystemen ist dieser Überblick ein wichtiger Teil der Governance.[1] [3]

## 7. Praxisbeispiel

Stellen Sie sich vor, ein Agent liefert plötzlich keine neuen Informationen aus dem CRM. Im Tool & Connector Layer öffnen Sie die Karte des CRM-Connectors. Dort sehen Sie, ob der Status noch **connected** ist oder bereits **degraded**. Danach prüfen Sie **Last Sync**, um zu erkennen, ob die Verbindung seit längerer Zeit keine Aktualisierung mehr hatte. Über **Linked Agents** sehen Sie außerdem, wie viele Agenten von dieser Anbindung betroffen sein könnten. Damit haben Sie in kurzer Zeit eine erste fachliche Einschätzung der Lage.[1] [2]

## 8. Empfehlungen für den Alltag

In der Praxis lohnt es sich, den Connector-Bereich regelmäßig zusammen mit dem Monitoring zu betrachten. Der Tool & Connector Layer zeigt vor allem den Zustand einzelner Anbindungen, während **Observability & Cost Monitoring** stärker auf Leistung, Fehler und Wirtschaftlichkeit schaut. Wer beide Module kombiniert nutzt, erkennt technische und operative Probleme deutlich schneller.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Zuerst den Status lesen | Sie erkennen sofort, ob Handlungsbedarf besteht. |
| Last Sync nicht übersehen | Veraltete Datenlagen werden schneller erkannt. |
| Linked Agents mitdenken | Der mögliche betriebliche Einfluss wird klarer. |
| Mit Monitoring kombinieren | Betriebsprobleme werden umfassender sichtbar. |

## 9. Zusammenfassung

Der Tool & Connector Layer ist das Modul für **sichtbare Systemanbindungen und ihren Betriebszustand**. Es hilft Ihnen, Abhängigkeiten zwischen Agenten und angeschlossenen Systemen verständlich einzuordnen. Gerade für nichttechnische Nutzer ist das wertvoll, weil Verbindungsprobleme nicht abstrakt bleiben, sondern als klare Status- und Kontextinformation in der Oberfläche erscheinen.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
