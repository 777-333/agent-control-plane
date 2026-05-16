# Handbuch: Runtime Guardrails

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Runtime Guardrails  
**Zielgruppe:** Operations, Governance, Datenschutz- und Sicherheitsverantwortliche  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Die **Runtime Guardrails** schützen den laufenden Betrieb. Während andere Module Regeln definieren oder Freigaben organisieren, greifen Guardrails dort, wo ein Agent bereits aktiv ist und ein Risiko, eine Grenzverletzung oder ein auffälliges Verhalten entsteht. Das Modul macht sichtbar, welche Schutzereignisse ausgelöst wurden, warum sie ausgelöst wurden und welche Folgen das für den betroffenen Agenten hat.[1] [2] [3]

Einfach gesagt beantwortet dieses Modul die Frage:

> **Was passiert, wenn ein Agent im laufenden Betrieb eine Grenze überschreitet oder ein Risiko entsteht?**

## 2. Welche Arten von Schutz dieses Modul bietet

Das Modul deckt mehrere Schutzrichtungen gleichzeitig ab. Dazu gehören Policy-Verstöße, Kostenlimits, Tool-Anomalien und Latenzspitzen. Zusätzlich spielt der Datenschutz eine wichtige Rolle, weil sensible Inhalte vor KI-nahen Analyse- und Protokollpfaden pseudonymisiert werden. Damit ist das Modul nicht nur ein Alarmbereich, sondern auch eine aktive Schutzschicht.[1]

| Schutzbereich | Was damit gemeint ist |
| --- | --- |
| **Policy-Verstoß** | Ein Agent verhält sich entgegen definierter Regeln |
| **Kostenlimit** | Ein Budget oder Schwellenwert wird überschritten |
| **Tool-Anomalie** | Ein verbundenes System reagiert auffällig oder unerwartet |
| **Latenzspitze** | Die Reaktionszeit steigt ungewöhnlich stark an |
| **Datenschutzschutz** | Sensible Angaben werden vor weiterer Verarbeitung maskiert |

## 3. So ist die Oberfläche aufgebaut

Im oberen Bereich erklärt das Modul zunächst die **DSGVO-orientierte Voranonymisierung**. Danach folgen zwei große Arbeitsblöcke: Links sehen Sie die **manuell gepflegten Datenschutzregeln**, rechts können Sie **eigene Regeln hinzufügen**. Darunter erscheinen die **Guardrail-Ereignisse** sowie ein Formular, um einen **Guardrail-Fall zu simulieren**. Damit verbindet das Modul Erklärung, Regelpflege, Ereignissicht und praktische Prüfung in einer Oberfläche.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Voranonymisierung** | Erklärt den aktiven Datenschutzrahmen | Schutzlogik verstehen |
| **Manuell gepflegte Datenschutzregeln** | Zeigt projektspezifische Ergänzungen | Regeln prüfen |
| **Eigene Regel hinzufügen** | Ergänzt neue Schlüsselwort- oder Regex-Regeln | Datenschutz erweitern |
| **Guardrail-Ereignisse** | Zeigt ausgelöste Schutzfälle | Vorfälle prüfen |
| **Guardrail simulieren** | Erlaubt das Testen eines Schutzfalls | Verhalten kontrolliert ausprobieren |

## 4. Datenschutz in diesem Modul einfach erklärt

Ein wichtiger Teil der Guardrails ist die automatische Pseudonymisierung sensibler Inhalte. Bevor Details in Runtime-Signale, Audit-Einträge oder KI-nahe Prüfpfade gelangen, werden erkannte Personen- und Nummernkennungen durch Platzhalter ersetzt. Für Anwender bedeutet das: Auch wenn reale Inhalte in einen Vorfall hineingeraten, werden sie nicht unkontrolliert weiterverarbeitet.[1]

Das ist besonders relevant in Bereichen wie Finanzen, Personal, Support oder Compliance, in denen reale Kennungen häufig vorkommen.

## 5. Benutzerdefinierte Datenschutzregeln verstehen

Neben den Standardregeln können Sie projektspezifische Datenschutzregeln hinzufügen. Dabei gibt es zwei Grundformen: **Schlüsselwortregeln** und **Regex-Regeln**. Schlüsselwortregeln helfen bei kontextbezogenen Formaten, zum Beispiel Begriffen wie „Mandanten-ID“. Regex-Regeln eignen sich für streng strukturierte Kennungen. Beide Varianten erweitern die bestehende Standarderkennung.[1]

| Regelart | Einfach erklärt | Wann sinnvoll |
| --- | --- | --- |
| **Schlüsselwortregel** | Erkennt sensible Werte im sprachlichen Kontext | Wenn bestimmte Begriffe regelmäßig vorkommen |
| **Regex-Regel** | Erkennt fest strukturierte Muster direkt | Wenn Kennungen immer nach einem klaren Muster aufgebaut sind |

## 6. Schritt für Schritt: Eigene Datenschutzregel hinzufügen

Wenn Sie eine neue Datenschutzregel anlegen möchten, geben Sie zuerst einen aussagekräftigen Namen ein. Danach entscheiden Sie, ob es eine Schlüsselwortregel oder eine Regex-Regel sein soll. Anschließend wählen Sie die passende Kategorie aus. Bei einer Schlüsselwortregel ergänzen Sie relevante Begriffe, bei einer Regex-Regel Muster, Flags und – falls nötig – einen Zusatzvalidator. Erst wenn die Angaben vollständig und plausibel sind, speichern Sie die Regel.[1]

Wichtig ist, dass Regeln möglichst präzise und verständlich formuliert werden. So bleibt auch später klar, warum sie existieren und welchen Zweck sie erfüllen.

## 7. Guardrail-Ereignisse richtig lesen

Im Ereignisbereich sehen Sie, welcher Agent betroffen war, welcher Guardrail-Status vorliegt, welches Detail protokolliert wurde und welche Art von Trigger den Fall ausgelöst hat. Auch das Schwellwert-Label und die Zeitangabe werden angezeigt. Damit lässt sich ein Vorfall schnell fachlich und zeitlich einordnen.[1]

## 8. Schritt für Schritt: Einen Guardrail simulieren

Wenn Sie das Verhalten des Systems testen möchten, wählen Sie zunächst den Agenten aus. Danach bestimmen Sie den Trigger-Typ, zum Beispiel Policy-Verstoß oder Kostenlimit. Anschließend geben Sie ein Threshold Label und einen Detailtext ein. Sobald die Angaben vollständig sind, können Sie den Guardrail auslösen. Das ist besonders hilfreich, wenn Sie einen Schutzfall kontrolliert durchspielen möchten, statt auf einen echten Vorfall zu warten.[1]

## 9. Praxisbeispiel

Ein Team möchte prüfen, wie das System reagiert, wenn ein Agent ein Kostenlimit überschreitet. Dazu wird im Formular **Guardrail simulieren** der betroffene Agent ausgewählt. Als Trigger-Typ wird **cost_threshold** gesetzt, als Schwellenwert zum Beispiel **Budget > 25 USD**. Im Detailfeld wird beschrieben, was beobachtet wurde. Nach dem Auslösen erscheint der Fall in der Ereignisliste, und der Agent wird – je nach Guardrail-Szenario – als pausiert oder überwacht sichtbar. Wenn der Detailtext sensible Kennungen enthält, werden diese vor weiterer Verarbeitung automatisch pseudonymisiert.[1] [3]

## 10. Empfehlungen für den Alltag

Runtime Guardrails sollten nicht erst nach einem Problem ernst genommen werden. Sinnvoll ist es, Guardrails zusammen mit **Policy Engine**, **Approval Workflow**, **Audit Log** und **Observability** zu betrachten. So sehen Sie nicht nur den Schutzfall selbst, sondern auch die Regel, die Entscheidungskette, die Nachvollziehbarkeit und die technischen Auswirkungen im Gesamtbild.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Datenschutzregeln regelmäßig prüfen | Schutz bleibt an reale Anforderungen angepasst. |
| Eigene Regeln klar benennen | Die Pflege bleibt verständlich. |
| Simulationen bewusst nutzen | Schutzmechanismen werden vor echten Vorfällen nachvollziehbar. |
| Guardrails mit Audit und Monitoring verbinden | Die Gesamtlage wird besser verständlich. |

## 11. Zusammenfassung

Runtime Guardrails sind das Modul für **aktiven Schutz im laufenden Betrieb**. Hier werden Risiken nicht nur sichtbar, sondern auch kontrolliert abgefangen. Durch die Verbindung aus Voranonymisierung, Schutzregeln, Ereignisanzeige und Simulation ist dieses Modul ein zentraler Sicherheitsbaustein für alle Teams, die Agenten verantwortungsvoll einsetzen möchten.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
