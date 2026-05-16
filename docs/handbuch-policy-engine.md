# Handbuch: Policy Engine

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Policy Engine  
**Zielgruppe:** Fachanwender, Governance-Verantwortliche, Teamleitungen  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Die **Policy Engine** ist das Regelwerk der Agent Control Plane. Hier legen Sie fest, was ein Agent oder ein bestimmter Bereich **darf**, **nicht darf** oder **nur nach Freigabe** tun darf. Das Modul ist deshalb besonders wichtig, weil Agenten in der Praxis nicht nur nützlich, sondern auch kontrollierbar sein müssen. Ohne klare Regeln wäre schnell unklar, welche Aktionen zulässig sind und welche Vorgänge vorher geprüft werden müssen.[1] [2] [3]

Einfach gesagt beantwortet die Policy Engine immer dieselbe Frage:

> **Welche Aktion ist in welchem Kontext erlaubt, verboten oder freigabepflichtig?**

## 2. Wann Sie die Policy Engine nutzen sollten

Die Policy Engine kommt immer dann ins Spiel, wenn ein Agent nicht völlig frei arbeiten soll. Das betrifft zum Beispiel produktionsnahe Änderungen, sensible Kundendaten, Finanzprozesse, kritische Tool-Zugriffe oder teamübergreifende Systemaktionen. Auch dann, wenn mehrere Agenten oder Schwärme parallel arbeiten, ist ein sichtbares Regelwerk hilfreich, damit Entscheidungen nicht nur technisch, sondern auch organisatorisch sauber abgesichert sind.[1] [2]

| Situation | Warum eine Policy sinnvoll ist |
| --- | --- |
| Ein Agent soll nur in einer Testumgebung arbeiten | Die Umgebung lässt sich klar eingrenzen. |
| Ein Agent darf Produktionsschritte nicht selbst auslösen | Das Risiko wird sichtbar begrenzt. |
| Eine Aktion soll nur nach Freigabe laufen | Menschliche Kontrolle bleibt erhalten. |
| Ein bestimmtes Team oder ein Connector braucht Sonderregeln | Der Geltungsbereich wird sauber abgegrenzt. |

## 3. So ist die Oberfläche aufgebaut

Die Policy Engine besteht aus zwei Hauptbereichen. Auf der einen Seite sehen Sie die **aktiven Policies**, auf der anderen Seite können Sie **neue Policies anlegen**. Dadurch ist das Modul leicht verständlich: Links prüfen Sie, was bereits gilt, rechts ergänzen Sie neue Regeln.[1]

| Bereich | Bedeutung | Typische Aktion |
| --- | --- | --- |
| **Aktive Policies** | Zeigt bestehende Regeln inklusive Wirkung, Geltungsbereich und Priorität | Bestehende Regeln prüfen |
| **Neue Policy definieren** | Formular zur Erstellung einer neuen Regel | Neue Regel anlegen |

## 4. Die wichtigsten Begriffe einfach erklärt

Bevor Sie eine Policy anlegen, hilft ein kurzer Blick auf die zentralen Begriffe. Diese Begriffe tauchen direkt im Formular auf und sollten vor dem Speichern bewusst gewählt werden.[1]

| Feld | Einfach erklärt | Beispiel |
| --- | --- | --- |
| **Policy-Name** | Der verständliche Titel der Regel | Produktion nur mit Freigabe |
| **Scope Type** | Für wen oder was die Regel gilt | agent, team, connector oder global |
| **Scope Reference** | Die genaue Zuordnung innerhalb des Bereichs | Finance Sentinel |
| **Action Pattern** | Welche Aktion die Regel betrifft | deploy production |
| **Effect** | Was passieren soll | allowed, forbidden, approval_required |
| **Priorität** | Wie wichtig die Regel im Vergleich zu anderen ist | 100 |
| **Beschreibung** | Verständliche Erläuterung der Regel | Produktionsänderungen sind nur nach Finance-Freigabe zulässig. |

## 5. Schritt für Schritt: Eine neue Policy anlegen

Wenn Sie eine neue Regel erstellen möchten, beginnen Sie mit einem klaren Namen. Danach wählen Sie aus, **für wen** die Regel gelten soll. Im nächsten Schritt hinterlegen Sie die konkrete Referenz, also zum Beispiel einen bestimmten Agenten oder ein Team. Anschließend beschreiben Sie die betroffene Aktion über das Action Pattern. Danach legen Sie fest, ob diese Aktion erlaubt, verboten oder freigabepflichtig sein soll. Zum Schluss ergänzen Sie Priorität und Beschreibung und speichern die Policy.[1]

Dieser Ablauf ist besonders wichtig, weil eine gute Regel nicht nur technisch korrekt, sondern auch für andere Menschen verständlich sein muss. Eine Policy sollte daher immer so formuliert sein, dass auch Teamleitungen, Freigabeverantwortliche oder neue Mitarbeitende schnell nachvollziehen können, **warum** sie existiert.

## 6. So wählen Sie den richtigen Geltungsbereich

Viele Fehler entstehen nicht durch die eigentliche Regel, sondern durch einen unklaren Geltungsbereich. Deshalb sollten Sie vor dem Speichern überlegen, ob die Regel für einen einzelnen Agenten, ein Team, einen Connector oder die gesamte Plattform gelten soll.[1]

| Scope Type | Wann er sinnvoll ist | Beispiel |
| --- | --- | --- |
| **agent** | Wenn nur ein bestimmter Agent betroffen ist | Finance Sentinel |
| **team** | Wenn ein ganzes Team dieselbe Regel braucht | Finance Operations |
| **connector** | Wenn eine Regel an ein System oder Tool gebunden ist | CRM Connector |
| **global** | Wenn die Regel grundsätzlich für alle gelten soll | Kein direkter Einzelbezug |

## 7. Was die drei Effekte bedeuten

Die Auswahl im Feld **Effect** ist der wichtigste Teil der Policy. Sie entscheidet darüber, wie das System auf eine passende Aktion reagiert.[1] [2]

| Effect | Bedeutung im Alltag | Wann sinnvoll |
| --- | --- | --- |
| **allowed** | Die Aktion ist erlaubt | Für unkritische, freigegebene Standardfälle |
| **forbidden** | Die Aktion ist verboten | Für klare Ausschlüsse und harte Grenzen |
| **approval_required** | Die Aktion braucht vorab eine Freigabe | Für sensible oder kontrollbedürftige Vorgänge |

In vielen Unternehmenssituationen ist **approval_required** der beste Startpunkt. So bleibt der Prozess produktiv, aber riskante Aktionen laufen nicht unkontrolliert durch.

## 8. Praxisbeispiel

Ein gutes Beispiel ist ein Agent namens **Finance Sentinel**, der kritische Finanzvorgänge beobachtet. Das Team möchte verhindern, dass dieser Agent produktionsnahe Änderungen eigenständig auslöst. Dafür wird eine Policy angelegt mit dem Namen **Produktion nur mit Freigabe**. Als Scope Type wird **agent** gewählt, als Scope Reference **Finance Sentinel**. Das Action Pattern beschreibt die betroffene Aktivität, etwa **deploy production**. Als Effect wird **approval_required** gewählt. In der Beschreibung wird festgehalten, dass produktionsnahe Finanzänderungen nur nach Freigabe zulässig sind.[1] [2]

Das Ergebnis ist ein Regelwerk, das sowohl für Fachanwender als auch für Freigabeverantwortliche sofort verständlich bleibt.

## 9. Bestehende Policies richtig lesen

Im Bereich **Aktive Policies** sehen Sie alle bereits vorhandenen Regeln. Dort werden Name, Effekt, Beschreibung, Geltungsbereich, Referenz, Aktionsmuster und Priorität sichtbar dargestellt. So erkennen Sie schnell, welche Regeln bereits existieren und ob neue Policies wirklich noch nötig sind oder ob eine ähnliche Regel schon vorhanden ist.[1]

Gerade in wachsenden Teams ist diese Übersicht wichtig. Sie verhindert, dass dieselbe Regel mehrfach in leicht unterschiedlicher Form angelegt wird.

## 10. Empfehlungen für den Alltag

In der Praxis lohnt es sich, Policies lieber **klar und nachvollziehbar** als zu allgemein zu schreiben. Beginnen Sie mit wenigen, wichtigen Regeln und erweitern Sie sie schrittweise. Wenn Sie unsicher sind, ob eine Aktion erlaubt oder verboten sein soll, ist **approval_required** oft die sinnvollste Zwischenstufe. So bleibt der Betrieb handlungsfähig, ohne auf menschliche Kontrolle zu verzichten.[1] [3]

| Empfehlung | Warum sie hilfreich ist |
| --- | --- |
| Regeln klar benennen | Andere verstehen sofort den Zweck der Policy. |
| Beschreibung nicht weglassen | Die Regel bleibt auch später nachvollziehbar. |
| Mit wenigen Kernregeln starten | Das Regelwerk bleibt übersichtlich. |
| Bei Unsicherheit Freigabe nutzen | Risiko bleibt kontrollierbar. |

## 11. Zusammenfassung

Die Policy Engine ist das Modul für **klare Regeln und kontrollierte Agentenaktionen**. Sie hilft dabei, Verantwortlichkeiten sichtbar zu machen, Risiken zu begrenzen und sensible Vorgänge in einen nachvollziehbaren Rahmen zu setzen. Wer das Tool sicher nutzen möchte, sollte dieses Modul früh einrichten und regelmäßig prüfen, ob die vorhandenen Regeln noch zum tatsächlichen Betrieb passen.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
