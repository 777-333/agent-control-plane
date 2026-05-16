# Handbuch: Evaluation Layer

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Evaluation Layer  
**Zielgruppe:** Teamleitungen, Fachanwender, Qualitätssicherung, Governance  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Der **Evaluation Layer** ist das Prüfmodul der Agent Control Plane. Hier testen Sie Agenten vor dem produktiven Einsatz, definieren Testfälle und prüfen, ob erwartete Ergebnisse, Policy-Konformität und Qualitätskriterien erfüllt werden. Das Modul ist besonders wichtig, weil Agenten nicht nur eingerichtet, sondern vor ihrem Einsatz auch **sinnvoll validiert** werden sollten.[1] [2] [3]

Einfach gesagt beantwortet der Evaluation Layer die Frage:

> **Ist dieser Agent für den geplanten Einsatz ausreichend geprüft?**

## 2. Was dieses Modul besonders macht

Im Evaluation Layer geht es nicht nur um Testergebnisse, sondern auch um den sicheren Umgang mit Freitext. Bevor Inhalte in KI-nahe Prüfpfade gelangen, werden erkannte personenbezogene Identifikatoren automatisch pseudonymisiert. Dazu gehören unter anderem E-Mail-Adressen, Telefonnummern, IBANs, Steuer- und Ausweisnummern sowie weitere dokumentennahe Kennungen. Das ist besonders hilfreich, wenn Testfälle mit realitätsnahen, aber sensiblen Inhalten arbeiten.[1]

## 3. Wann Sie dieses Modul nutzen sollten

Sie verwenden den Evaluation Layer vor allem vor neuen Deployments, vor Änderungen an Agentenverhalten, nach Anpassungen an Policies oder immer dann, wenn ein Agent in einem sensiblen fachlichen Kontext eingesetzt werden soll. Das Modul hilft dabei, Unsicherheiten früh sichtbar zu machen, bevor ein Agent im Alltag echten Einfluss bekommt.[1] [3]

| Situation | Warum der Evaluation Layer hilfreich ist |
| --- | --- |
| Ein neuer Agent soll produktiv gehen | Vorab lässt sich ein Testfall definieren und ausführen. |
| Ein bestehender Agent wurde geändert | Die Änderung kann vor dem Einsatz geprüft werden. |
| Ein sensibler Use Case nutzt Freitext | Datenschutz greift schon vor der KI-nahen Auswertung. |
| Ein Team möchte Qualität dokumentieren | Ergebnisse und Pass Rates bleiben sichtbar. |

## 4. So ist die Oberfläche aufgebaut

Das Modul besteht aus drei logisch verbundenen Bereichen. Zuerst wird die **Datenschutzvorschicht** sichtbar erklärt. Danach folgt die Übersicht über vorhandene **Evaluationen**. Rechts daneben können Sie direkt einen **neuen Testfall definieren und ausführen**. Diese Reihenfolge ist praktisch, weil sie zuerst den Schutzmechanismus erklärt, dann vorhandene Ergebnisse zeigt und schließlich eine neue Prüfung ermöglicht.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Datenschutz vor KI-Auswertung** | Erklärt den aktiven Schutz sensibler Inhalte | Sicherheitsrahmen verstehen |
| **Evaluationsübersicht** | Zeigt vorhandene Prüfungen, Scores und Pass Rates | Ergebnisse prüfen |
| **Testfall definieren und ausführen** | Erlaubt das Starten neuer Pre-Deployment-Checks | Neuen Testlauf anlegen |

## 5. Die Kennzahlen einfach erklärt

In den vorhandenen Evaluationen sehen Sie mehrere Werte, die auf den ersten Blick technisch wirken können. In der Praxis lassen sie sich aber leicht einordnen.[1]

| Kennzahl | Einfach erklärt | Warum sie wichtig ist |
| --- | --- | --- |
| **Status** | Zeigt, ob ein Test bestanden, fehlgeschlagen oder noch offen ist | Schnelle Einordnung der Bewertung |
| **Score** | Gesamtbewertung des Testlaufs | Verdichteter Qualitätswert |
| **Pass Rate** | Anteil erfolgreich bestandener Policy-Prüfungen | Zeigt die Regelkonformität |
| **Summary** | Kurzbeschreibung des Ergebnisses | Liefert den fachlichen Kontext |

## 6. Schritt für Schritt: Neuen Testfall ausführen

Wenn Sie einen neuen Testlauf starten möchten, wählen Sie zuerst den betroffenen Agenten aus. Danach geben Sie dem Testfall einen klaren Namen. Anschließend beschreiben Sie im Feld **Erwartetes Ergebnis**, was der Agent in diesem Fall leisten oder beachten soll. Sobald alle Angaben vollständig sind, starten Sie den **Pre-Deployment-Check**. Das System prüft vorab, ob die nötigen Eingaben vorhanden sind.[1]

Wichtig ist dabei vor allem die Qualität des erwarteten Ergebnisses. Je klarer dieses formuliert ist, desto nützlicher wird die spätere Bewertung.

## 7. Datenschutz in diesem Modul einfach erklärt

Ein besonderer Vorteil dieses Moduls ist die automatische Pseudonymisierung. Wenn in Testfällen sensible Informationen vorkommen, werden diese vor der weiteren Verarbeitung in Platzhalter überführt. Für Anwender bedeutet das: Sie können realistische Prüfungen vorbereiten, ohne dass personenbezogene Kennungen ungeschützt in die nachfolgenden Prüfpfade gelangen.[1]

Das ist vor allem für Fachabteilungen wichtig, die reale Beispiele aus Finanzen, Kundenservice, Personal oder Compliance prüfen möchten.

## 8. Praxisbeispiel

Ein Team möchte einen Agenten vor dem Deployment auf einen sensiblen Finanzfall prüfen. Es wählt den Agenten aus, gibt dem Testfall einen verständlichen Namen und beschreibt im erwarteten Ergebnis, dass der Agent sensible Angaben erkennen, korrekt zusammenfassen und Governance-Vorgaben einhalten soll. Enthält der Testfall personenbezogene Kennungen, werden diese vor der weiteren Verarbeitung pseudonymisiert. Nach dem Start des Checks erscheinen Status, Score, Pass Rate und eine Zusammenfassung im Modul. So kann das Team besser entscheiden, ob der Agent schon einsatzbereit ist.[1] [3]

## 9. Empfehlungen für den Alltag

Im Alltag sollte der Evaluation Layer nicht nur vor dem ersten Deployment, sondern auch nach relevanten Änderungen genutzt werden. Besonders nützlich ist das Modul in Kombination mit **Policy Engine**, **Runtime Guardrails** und **Audit Log**, weil dort sichtbar wird, welche Regeln gelten, welche Schutzmechanismen greifen und welche Ergebnisse später nachvollziehbar dokumentiert werden.[1] [2] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Testfälle klar benennen | Ergebnisse bleiben verständlich zuordenbar. |
| Erwartetes Ergebnis konkret formulieren | Die Bewertung wird aussagekräftiger. |
| Nach Änderungen erneut testen | Risiken werden früher erkannt. |
| Datenschutz-Hinweise ernst nehmen | Sensible Daten bleiben besser geschützt. |

## 10. Zusammenfassung

Der Evaluation Layer ist das Modul für **kontrollierte Vorab-Prüfung von Agenten**. Er verbindet Testfalldefinition, Qualitätsauswertung und Datenschutz in einer Oberfläche. Wer Agenten sicher und verantwortungsvoll einsetzen möchte, sollte dieses Modul als festen Schritt vor produktiven Änderungen oder neuen Einsätzen verwenden.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
