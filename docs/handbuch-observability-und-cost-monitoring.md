# Handbuch: Observability & Cost Monitoring

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Observability & Cost Monitoring  
**Zielgruppe:** Operations, Teamleitungen, Controlling, Governance  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

**Observability & Cost Monitoring** ist das Modul für laufende Sichtbarkeit auf Leistung, Fehler und Wirtschaftlichkeit. Hier sehen Sie in verdichteter Form, wie sich Agenten im Betrieb verhalten, wie hoch ihre Latenz ist, wie sich Fehlerraten entwickeln und welche API-Kosten oder Token-Mengen anfallen. Das Modul ist besonders wichtig, weil ein Agent nicht nur fachlich richtig arbeiten, sondern auch **stabil, effizient und wirtschaftlich sinnvoll** laufen sollte.[1] [2] [3]

Einfach gesagt beantwortet dieses Modul die Frage:

> **Wie gesund, wie teuer und wie stabil arbeitet unser Agentenbetrieb gerade?**

## 2. Welche Kennzahlen hier im Mittelpunkt stehen

Die Oberfläche bündelt vier zentrale Metrikarten: **Latenz**, **Fehlerrate**, **API-Kosten** und **Token-Verbrauch**. Diese Kennzahlen ergänzen sich gegenseitig. Eine gute Leistung nützt wenig, wenn die Kosten aus dem Ruder laufen. Umgekehrt ist ein kostengünstiger Betrieb nur dann hilfreich, wenn Fehler und Reaktionszeiten im akzeptablen Bereich bleiben.[1]

| Kennzahl | Einfach erklärt | Warum sie wichtig ist |
| --- | --- | --- |
| **Latenz** | Wie schnell ein Agent reagiert | Zeigt die operative Reaktionsfähigkeit |
| **Fehlerrate** | Wie oft etwas schiefgeht | Zeigt Stabilität und Zuverlässigkeit |
| **API-Kosten** | Welche laufenden Kosten entstehen | Hilft bei Budget- und Wirtschaftlichkeitsfragen |
| **Token-Verbrauch** | Wie intensiv Modelle genutzt werden | Gibt Hinweise auf Nutzungsmuster und Kostenentwicklung |

## 3. So ist die Oberfläche aufgebaut

Das Modul ist als Monitoring-Fläche aufgebaut. Zunächst werden Agenten und zentrale Metriken sichtbar gemacht. Danach folgen Diagramme und Verlaufsdaten, mit denen sich Trends und Auffälligkeiten erkennen lassen. Ein ausgewählter Agent kann genauer betrachtet werden, sodass nicht nur das Gesamtsystem, sondern auch einzelne Problemfälle oder Kostenverursacher greifbar werden.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Gesamtübersicht** | Verdichtete Sicht auf mehrere Agenten | Lage einschätzen |
| **Diagramme** | Vergleich und Entwicklung von Kennzahlen | Trends erkennen |
| **Agentenauswahl** | Fokussierung auf einen konkreten Agenten | Einzelanalyse durchführen |
| **Metrikumschaltung** | Auswahl des betrachteten Schwerpunkts | Tiefer in Latenz, Fehler, Kosten oder Tokens einsteigen |

## 4. Die Diagramme einfach verstehen

Im Modul werden Kennzahlen nicht nur als Zahlen, sondern auch als Diagramme dargestellt. Das hilft besonders dann, wenn sich eine Entwicklung nicht an einem einzelnen Wert, sondern erst über mehrere Zeitfenster zeigt. Ein Agent kann zum Beispiel im Moment noch „akzeptabel“ wirken, obwohl seine Fehlerrate oder seine Kosten schrittweise steigen. Genau hier liegt der Vorteil der Visualisierung.[1]

## 5. Schritt für Schritt: Einen auffälligen Agenten prüfen

Wenn Sie einen Agenten genauer prüfen möchten, wählen Sie ihn zunächst in der Übersicht aus. Danach betrachten Sie zuerst die Latenz und die Fehlerrate. Wenn dort Auffälligkeiten sichtbar sind, wechseln Sie zu den Kosten und dem Token-Verbrauch. Anschließend prüfen Sie den zeitlichen Verlauf, um zu erkennen, ob es sich um eine einmalige Spitze oder eine anhaltende Entwicklung handelt. Dieses Vorgehen ist im Alltag besonders nützlich, weil es technische und wirtschaftliche Fragen in einer logischen Reihenfolge verbindet.[1]

## 6. Wann Sie besonders auf Kosten achten sollten

Die Kennzahl **API-Kosten** ist nicht nur für Controlling oder Management interessant. Auch operative Teams profitieren davon, weil steigende Kosten oft mit Änderungen im Verhalten eines Agenten, mit erhöhtem Anfragevolumen oder mit ineffizienten Mustern zusammenhängen. Kosten sind deshalb kein reines Finanzthema, sondern ein Betriebsindikator.[1] [3]

## 7. Fehlerrate und Latenz gemeinsam lesen

Viele Nutzer schauen zuerst nur auf die Latenz. In der Praxis ist es aber sinnvoll, **Latenz und Fehlerrate gemeinsam** zu lesen. Ein schneller Agent mit hoher Fehlerrate ist genauso problematisch wie ein stabiler Agent, der zu langsam reagiert. Erst die Kombination beider Werte zeigt, ob ein Agent betrieblich wirklich gesund arbeitet.[1]

## 8. Praxisbeispiel

Ein Team stellt fest, dass ein Agent zwar weiterhin Antworten liefert, Nutzer aber zunehmend unzufrieden sind. Im Modul **Observability & Cost Monitoring** wird der Agent ausgewählt. Die Latenz ist angestiegen, gleichzeitig zeigt die Fehlerrate eine leichte, aber konstante Verschlechterung. Danach wird auf die Kosten- und Token-Sicht gewechselt und sichtbar, dass die Nutzung ebenfalls wächst. Damit ist klar: Das Problem ist nicht nur ein subjektives Gefühl, sondern eine messbare Entwicklung, die sowohl technisch als auch wirtschaftlich relevant ist.[1] [3]

## 9. Empfehlungen für den Alltag

Im Alltag sollten Monitoring-Werte nicht isoliert gelesen werden. Wenn Auffälligkeiten entstehen, lohnt sich zusätzlich der Blick in **Tool & Connector Layer**, **Runtime Guardrails**, **Audit Log** und **Agenten-Verwaltung**. So wird klarer, ob die Ursache eher in einer instabilen Anbindung, einem Schutzereignis, einem Governance-Vorfall oder im Agentenverhalten selbst liegt.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Nicht nur den aktuellen Wert betrachten | Trends werden besser sichtbar. |
| Latenz und Fehlerrate gemeinsam lesen | Die technische Lage wird realistischer bewertet. |
| Kosten mit Token-Verbrauch zusammen sehen | Wirtschaftliche Treiber werden verständlicher. |
| Mit anderen Modulen abgleichen | Ursachen lassen sich besser eingrenzen. |

## 10. Zusammenfassung

Observability & Cost Monitoring ist das Modul für **laufende Transparenz über Leistung, Stabilität und Kosten**. Es hilft dabei, Agentenbetrieb nicht nur zu beobachten, sondern Auffälligkeiten früh zu erkennen und in einen fachlich nutzbaren Zusammenhang zu bringen. Wer Agenten dauerhaft verantwortungsvoll betreiben möchte, sollte dieses Modul regelmäßig als Teil der Betriebsroutine nutzen.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
