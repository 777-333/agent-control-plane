# Handbuch: Rollen- und Rechteverwaltung

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Rollen- und Rechteverwaltung  
**Zielgruppe:** Teamleitungen, Administratoren, Governance- und Operations-Verantwortliche  
**Stand:** 16. Mai 2026

## 1. Wofür dieses Modul da ist

Die **Rollen- und Rechteverwaltung** sorgt dafür, dass in der Agent Control Plane nicht jeder alles tun kann. Das Modul hilft Ihnen dabei, Teams anzulegen, Verantwortlichkeiten zu bündeln und Berechtigungen gezielt zu vergeben. Damit wird geregelt, **wer auf welchen Agenten zugreifen darf**, **welches Team wofür zuständig ist** und **welcher Zugriff nur lesen, bedienen, freigeben oder administrieren darf**.[1] [2] [3]

Für den Alltag bedeutet das vor allem eines: klare Zuständigkeiten. Gerade in Unternehmen mit mehreren Teams, Fachbereichen oder Freigabeinstanzen verhindert dieses Modul, dass Agenten ohne passende Verantwortung genutzt oder verändert werden.

## 2. Wann Sie dieses Modul nutzen sollten

Sobald mehrere Personen oder Teams mit der Plattform arbeiten, wird dieses Modul wichtig. Es ist nicht nur ein Administrationsbereich, sondern ein zentraler Teil der Governance. Wer einen Agenten betreibt, freigibt oder überwacht, sollte über eine passende Rolle verfügen. Ebenso sollten Teams sauber voneinander getrennt werden, wenn sie mit unterschiedlichen Agenten, Tools oder Risiken arbeiten.[1] [2]

| Situation | Warum das Modul wichtig ist |
| --- | --- |
| Mehrere Teams arbeiten mit denselben Agenten | Zuständigkeiten müssen sauber getrennt werden. |
| Ein Team soll nur lesen, aber nicht eingreifen | Die Berechtigungsstufe kann begrenzt werden. |
| Freigaben sollen nur bestimmte Rollen auslösen | Approver-Rechte werden gezielt vergeben. |
| Ein Tool-Zugriff darf nur einem bestimmten Bereich offenstehen | Der Tool Scope kann genau eingeschränkt werden. |

## 3. So ist die Oberfläche aufgebaut

Die Oberfläche teilt sich in zwei logisch getrennte Bereiche. Links sehen Sie die vorhandenen **Teams** und können neue Teams anlegen. Rechts sehen Sie die **Berechtigungen pro Agent und Tool** und können neue Rechte vergeben. Diese Aufteilung ist praktisch, weil zuerst organisatorische Einheiten entstehen und danach die konkreten Zugriffsrechte darauf aufgebaut werden.[1]

| Bereich | Wofür er gedacht ist | Typische Aktion |
| --- | --- | --- |
| **Teams** | Zeigt vorhandene Organisationseinheiten und ihre Zuständigkeiten | Team prüfen oder neues Team anlegen |
| **Berechtigungen pro Agent und Tool** | Zeigt bestehende Zugriffsrechte und erlaubt neue Zuweisungen | Rechte prüfen oder neue Berechtigung vergeben |

## 4. Teams einfach verstehen

Ein Team bündelt Personen oder Verantwortungen mit ähnlicher Aufgabe. In der Oberfläche werden pro Team Name, Owner, Mitgliederzahl und Coverage angezeigt. Der Owner ist dabei die verantwortliche Person oder Leitrolle. Die Coverage beschreibt, wofür das Team zuständig ist, zum Beispiel für Finance, Security, Operations oder ein bestimmtes Programmumfeld.[1]

Ein Team ist also nicht nur eine Namensliste, sondern eine organisatorische Zuordnung, die später auch bei Rechten und Freigaben wichtig wird.

## 5. Schritt für Schritt: Neues Team anlegen

Um ein neues Team anzulegen, öffnen Sie den Bereich **Neues Team**. Dort tragen Sie zuerst einen verständlichen Teamnamen ein. Danach hinterlegen Sie den Owner und beschreiben über das Feld **Coverage**, wofür das Team zuständig ist. Wenn alle Felder ausgefüllt sind, speichern Sie das Team. Das System prüft dabei, ob wirklich alle nötigen Angaben vorhanden sind.[1]

| Feld | Einfach erklärt | Beispiel |
| --- | --- | --- |
| **Teamname** | Bezeichnung des Teams | Finance Operations |
| **Owner** | Verantwortliche Person oder Leitrolle | Leiter Finance Governance |
| **Coverage** | Zuständigkeitsbereich des Teams | Freigaben und Risikoanalyse für Finanzagenten |

Ein typisches Praxisbeispiel wäre ein Team **Finance Operations**, das für finanznahe Agenten und Governance-Freigaben zuständig ist. So wird später sofort klar, welche Einheit für bestimmte Agenten oder Entscheidungen verantwortlich ist.

## 6. Berechtigungen einfach erklärt

Im rechten Bereich der Oberfläche werden Berechtigungen pro Agent und Tool angezeigt. Jede Berechtigung hat einen **Subject**, einen **Subject Type**, einen **Agent Name**, einen **Permission Level** und einen **Tool Scope**. Dadurch wird sehr konkret sichtbar, **wer** worauf zugreifen darf und in welchem Umfang.[1]

| Feld | Bedeutung | Beispiel |
| --- | --- | --- |
| **Subject** | Die Person oder das Team, das berechtigt wird | Finance Operations |
| **Subject Type** | Ob es sich um einen Nutzer oder ein Team handelt | team |
| **Agent Name** | Der betroffene Agent | Finance Sentinel |
| **Permission Level** | Art und Tiefe des Zugriffs | approver |
| **Tool Scope** | Bereich oder Umfang des Tool-Zugriffs | CRM, Reporting, Billing |

## 7. Die vier Berechtigungsstufen leicht erklärt

Die Rollen in diesem Modul sind bewusst klar benannt. Trotzdem hilft eine einfache Übersetzung in Alltagssprache.[1] [2]

| Berechtigungsstufe | Einfach erklärt | Typischer Einsatz |
| --- | --- | --- |
| **viewer** | Darf ansehen, aber nicht eingreifen | Reporting, Beobachtung, Management-Sicht |
| **operator** | Darf operativ arbeiten | Tägliche Bedienung bestimmter Agenten |
| **approver** | Darf kritische Vorgänge freigeben | Governance- und Freigabeverantwortung |
| **admin** | Hat die weitreichendsten Rechte | Systemnahe Verwaltung und Steuerung |

Wer unsicher ist, sollte lieber mit einer kleineren Berechtigungsstufe beginnen und Rechte später erweitern. So bleibt der Zugriff kontrollierbar.

## 8. Schritt für Schritt: Neue Berechtigung vergeben

Wenn Sie eine neue Berechtigung anlegen möchten, beginnen Sie mit dem **Subject**. Danach wählen Sie, ob es sich um einen einzelnen Nutzer oder ein ganzes Team handelt. Im nächsten Schritt legen Sie die Berechtigungsstufe fest. Anschließend tragen Sie den betroffenen Agenten und den Tool Scope ein. Erst wenn alle Felder vollständig sind, speichern Sie die Berechtigung.[1]

Dieser Ablauf ist wichtig, weil Rechte in der Agent Control Plane nicht allgemein, sondern möglichst präzise vergeben werden sollen. Eine gute Berechtigung beschreibt also immer klar, **wer**, **für welchen Agenten** und **in welchem Umfang** Zugriff erhält.

## 9. Praxisbeispiel

Ein Team **Finance Operations** soll den Agenten **Finance Sentinel** nicht administrieren, aber sensible Fälle freigeben dürfen. In diesem Fall wird als Subject **Finance Operations** eingetragen, als Subject Type **team**, als Agent Name **Finance Sentinel** und als Permission Level **approver**. Der Tool Scope kann zum Beispiel **Finance Reporting** oder **Billing Review** heißen. Dadurch ist klar geregelt, dass dieses Team Entscheidungen freigeben darf, aber nicht automatisch jede technische Änderung administriert.[1] [2]

## 10. Empfehlungen für den Alltag

In der Praxis sollten Teams und Berechtigungen so benannt werden, dass sie auch für neue Mitarbeitende sofort verständlich sind. Verwenden Sie deshalb möglichst sprechende Namen statt interner Kürzel. Geben Sie außerdem nur so viele Rechte wie nötig. Gerade bei sensiblen Agenten ist ein übersichtliches Rechtekonzept meist wertvoller als maximale Flexibilität.[1] [3]

| Empfehlung | Nutzen |
| --- | --- |
| Teams klar benennen | Zuständigkeiten sind schneller verständlich. |
| Coverage sinnvoll ausfüllen | Der fachliche Zweck bleibt sichtbar. |
| Rechte eher knapp vergeben | Risiko und Fehlbedienung sinken. |
| Approver- und Admin-Rechte bewusst trennen | Freigaben und Systemverwaltung bleiben unterscheidbar. |

## 11. Zusammenfassung

Die Rollen- und Rechteverwaltung schafft die organisatorische Grundlage für einen sicheren Betrieb der Agent Control Plane. Hier wird festgelegt, welche Teams existieren, wer dafür verantwortlich ist und welche Personen oder Gruppen mit welchen Rechten auf Agenten und Tools zugreifen dürfen. Wer das System kundenfreundlich und kontrolliert betreiben möchte, sollte dieses Modul früh sauber pflegen und regelmäßig überprüfen.[1] [2] [3]

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/DashboardLayout.tsx "DashboardLayout.tsx"
[3]: file:///home/ubuntu/agent-control-plane/architecture.md "architecture.md"
