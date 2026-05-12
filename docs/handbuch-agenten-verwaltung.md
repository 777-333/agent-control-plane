# Handbuch: Agenten-Verwaltung

**Autor:** Manus AI  
**Produkt:** Agent Control Plane  
**Modul:** Agenten-Verwaltung  
**Stand:** 12. Mai 2026

## 1. Zweck des Moduls

Die **Agenten-Verwaltung** ist die operative Steuerzentrale für alle einzelnen KI-Agenten und für koordinierte **Agenten-Schwärme**. Das Modul löst ein praktisches Problem, das in vielen Teams sehr schnell sichtbar wird: Einzelne Agenten lassen sich noch relativ einfach verwalten, aber sobald mehrere Agenten gemeinsam an Vorfällen, Freigaben, Analysen oder Kommunikationsaufgaben arbeiten, steigen Abstimmungsaufwand, Governance-Risiko und Intransparenz deutlich an. Genau an dieser Stelle bündelt die Agenten-Verwaltung Anlage, Steuerung, Nachvollziehbarkeit und Eingriffe in einer gemeinsamen Oberfläche.[1] [2] [3]

Im oberen Bereich des Moduls stehen die bestehenden Schwärme mit ihren Kommunikationspfaden, Kennzahlen, Exporten, Report-Abos und autonomen Läufen. Darunter folgen die Listen- und Formularbereiche für einzelne Agenten sowie für die Anlage und Bearbeitung von Schwärmen. In der Praxis bedeutet das: Ein Team kann erstens einzelne Agenten pflegen, zweitens daraus koordinierte Schwärme aufbauen und drittens die Zusammenarbeit dieser Schwärme revisionssicher beobachten.[1] [2]

## 2. Orientierung in der Oberfläche

Bevor mit dem Arbeiten begonnen wird, lohnt sich ein kurzer Blick auf die Struktur des Moduls. So fällt die Bedienung später deutlich leichter.

| Bereich | Wofür er gedacht ist | Typische Aktionen |
| --- | --- | --- |
| **Schwarmkarten** | Überblick über bestehende Agenten-Schwärme | Kennzahlen prüfen, Kommunikationspfade öffnen, Exporte starten, Abos anlegen, autonome Läufe steuern |
| **Agentenliste** | Übersicht aller registrierten Einzelagenten | Status prüfen, Agent bearbeiten, Agent duplizieren |
| **Agentenformular** | Anlage oder Anpassung einzelner Agenten | Neuen Agent registrieren, bestehende Konfiguration ändern, Kopie vorbereiten |
| **Schwarmformular** | Anlage, Bearbeitung und Auflösung von Schwärmen | Mitglieder pflegen, Governance festlegen, Schwarm speichern oder auflösen |

Ein guter mentaler Merksatz lautet daher: **Oben beobachten und steuern, unten anlegen und konfigurieren.** Diese Trennung ist bewusst gewählt, damit operative Sicht und Konfigurationssicht sauber voneinander getrennt bleiben.[1]

## 3. Schnellstart mit einem Praxisbeispiel

Wenn ein Team das Modul zum ersten Mal nutzt, empfiehlt sich ein einfaches Standardszenario. In diesem Handbuch wird dafür der **Finance Control Swarm** verwendet. Der Schwarm besteht aus drei Rollen: **Finance Sentinel** überwacht kritische Finanzsignale, **Support Orchestrator** koordiniert Rückfragen und Folgeschritte, und **Risk Analyst** bewertet Risiken und bereitet Entscheidungen vor. Für die Zusammenarbeit eignet sich in diesem Beispiel die Topologie **hub_spoke** mit dem Koordinationsmodus **supervisor**. Governance-seitig wird **approval_required** gewählt, ergänzt um eine **SLA von 20 Minuten**, eine **Eskalation nach 45 Minuten** und ein Reporting-Fenster von **24 Stunden**.[1] [2] [4]

Das Beispiel ist bewusst realitätsnah. Es passt zu Teams, die sensible Vorgänge nicht vollständig automatisiert laufen lassen möchten, sondern nachvollziehbare Freigaben, Reaktionszeiten und Berichte benötigen.

| Beispielkonfiguration | Empfohlener Wert | Warum dieser Wert sinnvoll ist |
| --- | --- | --- |
| **Schwarmname** | Finance Control Swarm | Leicht verständlicher Name für Finance- und Governance-Teams |
| **Topologie** | hub_spoke | Eine zentrale koordinierende Rolle steuert die Spezialisten |
| **Koordination** | supervisor | Eine Leitrolle priorisiert Arbeit und verteilt Aufgaben |
| **Policy-Modus** | approval_required | Kritische Schritte bleiben freigabepflichtig |
| **Approver-Rolle** | finance_approver | Verantwortlichkeit ist explizit benannt |
| **SLA** | 20 Minuten | Kritische Finanzsignale sollen zügig bearbeitet werden |
| **Eskalation** | 45 Minuten | Verzögerungen werden früh sichtbar |
| **Reporting-Fenster** | 24 Stunden | Tagesaktuelle Lageeinschätzung bleibt möglich |

## 4. Teil 1: Einzelne Agenten verwalten

### 4.1 Was ein einzelner Agent im Modul darstellt

Ein einzelner Agent ist die kleinste operative Einheit des Systems. In der Agenten-Verwaltung besitzt jeder Agent einen Namen, eine Beschreibung, eine fachliche Zuordnung, einen Owner, ein Modell und eine Zielumgebung. Diese Informationen sind wichtig, weil sie nicht nur der Dokumentation dienen, sondern auch später beim Aufbau eines Schwarms und bei Governance-Entscheidungen wiederverwendet werden.[1] [4]

### 4.2 Neuen Agenten registrieren

Wenn ein neuer Agent angelegt werden soll, beginnt der Ablauf im **Agentenformular**. Zuerst wird ein klarer Name vergeben, danach eine verständliche Beschreibung des Aufgabenbereichs hinterlegt. Anschließend werden Team, Owner, Modell und Umgebung ergänzt. Sobald alle Angaben vollständig sind, wird der Agent gespeichert. Das Formular unterstützt eine verständliche Validierung, sodass unvollständige oder zu knappe Eingaben früh abgefangen werden, bevor der Datensatz an den Server gesendet wird.[4]

| Feld | Empfehlung für die Eingabe | Beispiel |
| --- | --- | --- |
| **Name** | Fachlich eindeutig und kurz | Finance Sentinel |
| **Beschreibung** | Aufgabe, Grenzen und Zweck in einem verständlichen Satz | Überwacht kritische Finanzereignisse und markiert freigabepflichtige Vorgänge. |
| **Team** | Zuständiger Fachbereich | Finance Operations |
| **Owner** | Verantwortliche Person oder Rolle | Leiter Finance Governance |
| **Modell** | Eingesetztes LLM oder Betriebsmodell | gpt-4.1 |
| **Umgebung** | Zielumgebung des Agenten | production |

Ein einfaches Praxisbeispiel wäre die Registrierung von **Finance Sentinel**. Dieser Agent erhält die Beschreibung, dass er eingehende Finanzsignale klassifiziert, potenziell kritische Fälle markiert und Rückfragen an den Schwarm vorbereitet. Auf diese Weise versteht jedes Teammitglied sofort, wofür der Agent gedacht ist.

### 4.3 Bestehenden Agenten ansehen und bewerten

Nach dem Speichern erscheint der Agent in der **Agentenliste**. Dort lassen sich unter anderem Status, Team, Owner, Tools und Heartbeat-Kontext prüfen. Diese Übersicht ist besonders dann nützlich, wenn mehrere Agenten ähnliche Namen tragen oder verschiedene Teams parallel mit ähnlichen Rollen arbeiten. Vor jeder Änderung sollte zuerst kontrolliert werden, ob wirklich der richtige Agent geöffnet wurde.

### 4.4 Agent bearbeiten

Wenn ein Agent angepasst werden soll, wird in der Liste die Aktion **Bearbeiten** verwendet. Dadurch werden die vorhandenen Werte in das Formular übernommen. Danach können beispielsweise Beschreibung, Team, Modell oder Umgebung geändert werden. Erst mit dem erneuten Speichern werden die Änderungen wirksam. Der Vorteil dieses Ablaufs ist, dass keine Neuanlage nötig ist und die Identität des Agenten erhalten bleibt.[4]

Ein typischer Anwendungsfall ist die Weiterentwicklung eines Agenten von **staging** nach **production**. Ein Team testet zunächst einen Agenten in der sicheren Umgebung und hebt ihn erst nach erfolgreicher Prüfung in die produktive Betriebsumgebung an.

### 4.5 Agent duplizieren

Die Funktion **Duplizieren** ist sinnvoll, wenn ein Agent als Vorlage für eine neue Variante dienen soll. Nach dem Klick werden die vorhandenen Werte übernommen, aber als neue Anlage vorbereitet. So kann aus einem bewährten Agenten schnell eine Variante für ein anderes Team, eine andere Umgebung oder eine leicht veränderte Aufgabe entstehen.[4]

Ein gutes Beispiel ist **Finance Sentinel** und **Finance Sentinel Kopie**. Die Kopie kann nahezu dieselben Stammdaten behalten, aber etwa einer anderen Umgebung oder einem anderen Fachteam zugeordnet werden. Damit spart das Team Zeit und reduziert Tippfehler.

## 5. Teil 2: Agenten-Schwärme anlegen und pflegen

### 5.1 Was ein Schwarm ist

Ein **Agenten-Schwarm** ist eine koordinierte Gruppe einzelner Agenten, die gemeinsam an einem Ziel arbeitet. Anders als ein Einzelagent besitzt der Schwarm nicht nur Mitglieder, sondern zusätzlich eine **Topologie**, einen **Koordinationsmodus**, feste **Kommunikationspfade** und gemeinsame **Governance-Regeln**. Genau diese Kombination macht den Schwarm für komplexe Aufgaben interessant, etwa bei Incidents, Eskalationen, Compliance-Prüfungen oder wiederkehrenden Governance-Lagen.[1] [2] [5]

### 5.2 Schwarm anlegen

Für die Anlage eines Schwarms wird das **Schwarmformular** verwendet. Zunächst werden Name, Mission, Team, Owner und Umgebung eingetragen. Danach folgen die strukturellen Entscheidungen zu Topologie und Koordination. Im nächsten Schritt werden die Governance-Werte festgelegt, also Policy-Modus, Approver-Rolle, Eskalationsziel, SLA, Eskalationszeit und Reporting-Fenster. Erst danach sollten die Mitglieder ergänzt werden, damit die Rollen sauber auf die gewählte Struktur abgestimmt sind.[1] [5]

| Konfigurationsbereich | Bedeutung | Beispiel im Finance Control Swarm |
| --- | --- | --- |
| **Name / Mission** | Beschreibt Zweck und Einsatzziel | Koordiniert Analyse, Rückfragen und Risikoentscheidungen für sensible Finanzvorgänge |
| **Topologie** | Grundstruktur der Zusammenarbeit | hub_spoke |
| **Koordinationsmodus** | Art der Führungs- oder Entscheidungslogik | supervisor |
| **Policy-Modus** | Governance-Stärke des Schwarms | approval_required |
| **Approver-Rolle** | Rolle für Freigaben | finance_approver |
| **Eskalationsziel** | Adressat bei Verzögerung oder Risiko | Leiter Finance Governance |
| **SLA / Eskalation** | Erwartete Reaktions- und Eskalationszeiten | 20 / 45 Minuten |
| **Reporting-Fenster** | Zeitraum für Kennzahlen und Berichte | 24 Stunden |

### 5.3 Topologie, Koordination und Governance verständlich auswählen

Die Wahl der Struktur sollte nicht technisch, sondern aus der Alltagssicht des Teams getroffen werden. **hub_spoke** eignet sich, wenn ein zentraler Agent Arbeit verteilt und Spezialisten klar zugeordnet sind. **mesh** ist sinnvoll, wenn Agenten stärker gleichberechtigt miteinander arbeiten. **pipeline** passt gut zu linearen Übergaben, etwa von Planung über Prüfung bis Ausführung. Beim Koordinationsmodus bedeutet **supervisor**, dass eine zentrale Leitrolle steuert, **planner_executor**, dass Planung und Ausführung stärker getrennt sind, und **consensus**, dass mehrere Agenten ihre Einschätzung stärker gemeinschaftlich ausrichten.[1] [5]

| Auswahl | Wann sie gut passt | Praktisches Beispiel |
| --- | --- | --- |
| **hub_spoke** | Eine Leitrolle verteilt Arbeit an Spezialisten | Incident Lead steuert Analysten und Kommunikatoren |
| **mesh** | Mehrere Spezialisten arbeiten eng und gleichberechtigt zusammen | Forschungsteam mit mehreren Fachagenten |
| **pipeline** | Aufgaben sollen in fester Reihenfolge laufen | Planung, Prüfung, Umsetzung |
| **supervisor** | Klare zentrale Verantwortung gewünscht | Operations Lead priorisiert Aufgaben |
| **planner_executor** | Planung und Umsetzung sollen getrennt sein | Plattformänderung mit Planungs- und Ausführungsrolle |
| **consensus** | Gemeinsame Bewertung ist wichtiger als Hierarchie | Risiko-Review mit mehreren Experten |
| **monitoring** | Nur beobachten, noch nicht hart eingreifen | Frühe Pilotphase |
| **approval_required** | Kritische Schritte müssen freigegeben werden | Finance- oder Security-Workflows |
| **enforced** | Harte Governance, unzulässige Schritte werden blockiert | Produktionsnahe Maßnahmen |

### 5.4 Mitglieder hinzufügen und pflegen

Jedes Schwarmmitglied wird mit Name, Rolle, Modell, Tools und Verantwortungsbereich hinterlegt. Zusätzlich können weitere Mitglieder über **Mitglied hinzufügen** aufgenommen werden. Wenn mehr als zwei Mitglieder vorhanden sind, können einzelne Einträge wieder entfernt werden. In der Praxis sollten Rollen so formuliert werden, dass die spätere Delegation intuitiv bleibt. Nicht nur „Analyst“, sondern besser „Risk Analyst“ oder „Support Orchestrator“ hilft im Alltag deutlich mehr.[1]

Ein sinnvolles Beispiel für den **Finance Control Swarm** sieht so aus. **Finance Sentinel** übernimmt Monitoring und Erstklassifizierung, **Support Orchestrator** bündelt Rückfragen, priorisiert Kommunikationspfade und hält Teams synchron, und **Risk Analyst** bewertet Auswirkungen, Risiken und Freigabebedarf. Schon diese klare Rollentrennung verbessert die Lesbarkeit von Delegationsplänen und Ereignisverläufen erheblich.

### 5.5 Bestehenden Schwarm bearbeiten

Zur Pflege eines Schwarms wird die Bearbeitungsfunktion des jeweiligen Schwarms genutzt. Dadurch werden Stammdaten, Governance und Mitgliederdaten wieder in das Formular geladen. Anschließend können Mission, Governance-Schwellen oder Mitglieder angepasst und erneut gespeichert werden. Dieser Workflow eignet sich besonders dann, wenn sich Zuständigkeiten oder Eskalationswege im Team ändern.[1]

### 5.6 Schwarm kontrolliert auflösen

Im Bearbeitungsmodus steht zusätzlich der Bereich **Kontrollierte Auflösung** zur Verfügung. Dort entscheidet das Team, ob die Mitglieder als Einzelagenten erhalten bleiben oder gemeinsam mit dem Schwarm entfernt werden. Diese Entscheidung ist fachlich wichtig. Wenn die Agenten auch außerhalb des Schwarms weiter genutzt werden sollen, ist **Mitglieder behalten** die sichere Wahl. Wenn der Schwarm nur für einen zeitlich begrenzten Sonderfall angelegt wurde, kann **Mitglieder mit entfernen** sinnvoll sein.[1]

## 6. Teil 3: Schwarm-Kommunikation verstehen und bedienen

### 6.1 Was Kommunikationspfade sind

Sobald ein Schwarm angelegt ist, erzeugt das System Kommunikationspfade zwischen Mitgliedern. Diese Pfade bilden ab, wer mit wem in welcher Richtung kommuniziert. In der Oberfläche wird dadurch nicht nur sichtbar, dass Agenten zusammenarbeiten, sondern auch, **wie** Informationen und Anweisungen zwischen Rollen weitergegeben werden. Genau diese Nachvollziehbarkeit ist für Governance und Fehleranalyse zentral.[2] [4]

### 6.2 Nachrichtenhistorie lesen

Jeder Kommunikationspfad besitzt eine **Nachrichtenhistorie**. Dort lassen sich Verlauf, Nachrichtentypen und zeitliche Entwicklung nachvollziehen. Für operative Teams ist diese Sicht besonders wertvoll, weil sie nicht nur den letzten Stand, sondern den kompletten Kontext eines Vorgangs zeigt. Wer einen Verdacht auf Verzögerungen, Missverständnisse oder blockierte Freigaben hat, beginnt idealerweise mit dieser Historie.[2]

### 6.3 Suche und Filter einsetzen

Die Historie kann gezielt durchsucht und gefiltert werden. Damit lassen sich beispielsweise nur Statusmeldungen, nur Freigaben oder nur Nachrichten mit einem bestimmten Suchbegriff betrachten. Das ist vor allem in längeren Vorgängen entscheidend, etwa wenn innerhalb weniger Stunden viele Status- und Approval-Nachrichten entstanden sind.[2]

Ein praktisches Beispiel ist ein Incidentszenario. Ein Team sucht nach dem Begriff **payment** oder filtert auf **approval**, um ausschließlich jene Einträge zu sehen, die für die Freigabe eines produktionsnahen Schritts relevant sind. So lässt sich der operative Verlauf schneller prüfen, ohne den gesamten Kommunikationsstrom manuell zu lesen.

### 6.4 Neue Nachricht auf einem Kommunikationspfad verfassen

Über den Composer kann eine neue Nachricht in einen ausgewählten Kommunikationspfad geschrieben werden. Dabei sollte immer darauf geachtet werden, dass der **richtige Kommunikationspfad** und der **zulässige Sender** gewählt sind. Die Serverlogik prüft, ob die Nachricht wirklich vom Quellagenten des Pfads stammt. Ein unzulässiger Sender wird abgewiesen, damit Pfade fachlich konsistent bleiben.[4]

Für die Praxis empfiehlt sich folgende Vorgehensweise: Zuerst den betroffenen Pfad öffnen, dann prüfen, welcher Agent dort als Quelle geführt wird, danach die Nachricht formulieren und schließlich den passenden Nachrichtentyp wählen. In kritischen Situationen sollte die Nachricht so geschrieben werden, dass sie auch später im Audit-Kontext verständlich bleibt.

### 6.5 Governance auf Nachrichtenebene verstehen

Besonders wichtig ist, dass Schwarm-Governance nicht nur ein theoretischer Schalter bleibt. Sensible Direktiven können abhängig vom Policy-Modus zurückgewiesen oder freigabepflichtig gemacht werden. In Tests wird zum Beispiel eine produktionsnahe Direktive ohne Freigabe abgelehnt, während eine explizite Approval-Nachricht akzeptiert werden kann. Im Modus **enforced** kann sogar eine an sich freigebende Nachricht blockiert werden, wenn der Durchsetzungsmodus dies verlangt.[4]

> **Merksatz:** Nicht jede Nachricht darf versendet werden, nur weil der Kommunikationspfad existiert. Im Zweifel entscheidet die Schwarm-Governance.

## 7. Teil 4: Schwarm-Reporting nutzen

### 7.1 Wofür das Reporting gedacht ist

Das Reporting verdichtet den Kommunikations- und Governance-Zustand eines Schwarms in wenige, operative Kennzahlen. Ziel ist nicht, jede einzelne Nachricht einzeln auszuwerten, sondern einen schnellen Überblick zu geben: Wo steigt die Last, wo häufen sich Freigaben, wo werden SLAs verletzt und wo altern Reaktionen zu stark?[2] [3]

### 7.2 Die vier Kennzahlen richtig lesen

Im Reporting stehen vier Metriken im Vordergrund. Sie lassen sich anklicken und bilden gleichzeitig den aktiven Kontext für den Drilldown.

| Kennzahl | Was sie zeigt | Typischer Nutzen |
| --- | --- | --- |
| **Nachrichtenfenster** | Anzahl relevanter Nachrichten im definierten Reporting-Zeitraum | Aktivität und Kommunikationsdichte erkennen |
| **Approval-Ereignisse** | Anzahl schwarmweiter Freigabeereignisse | Kritikalität und Governance-Aufwand einschätzen |
| **SLA verletzt** | Kommunikationspfade über der zulässigen Reaktionszeit | Verzögerungen früh sichtbar machen |
| **Ø Reaktionsalter** | Durchschnittliches Alter offener oder letzter Reaktionsstände | Träge Pfade und Eskalationsrisiken identifizieren |

Im Finance-Beispiel kann eine erhöhte Zahl von **Approval-Ereignissen** bedeuten, dass der Schwarm viele sensible Finanzvorgänge bearbeitet. Eine steigende Kennzahl bei **SLA verletzt** wäre ein Signal dafür, dass Eskalationen oder Personalmangel drohen.

### 7.3 Drilldown auf betroffene Kommunikationspfade

Nach dem Klick auf eine Kennzahl zeigt der **Drilldown** die aktuell betroffenen Kommunikationspfade. Dort wird sichtbar, welcher Pfad betroffen ist, wie schwer die Lage eingeschätzt wird und welcher Wert zur Auswahl geführt hat. Dieser Drilldown ist die Brücke zwischen Management-Sicht und operativer Ursachenanalyse: Das Team startet auf Kennzahlenebene und springt dann auf den konkreten Kommunikationspfad.[2]

Eine sehr hilfreiche Routine ist, zuerst die Kennzahl **SLA verletzt** zu öffnen und anschließend direkt in den betroffenen Pfad zu wechseln. So kann das Team ohne langes Suchen klären, wo die Verzögerung entstanden ist.

### 7.4 CSV- und PDF-Export Schritt für Schritt

Der Export beginnt immer mit einer **Begründung**. Diese Begründung muss sinnvoll ausgefüllt werden, bevor ein CSV- oder PDF-Download ausgelöst wird. Dadurch wird jeder Export inhaltlich nachvollziehbar und später in der Historie erklärbar. Nach der Begründung wählt das Team entweder **CSV exportieren** oder **PDF herunterladen**. Wenn der Report nicht sensibel ist, startet der Download direkt. Wenn der Report als sensibel eingestuft wird, wird zunächst ein serverseitiger Freigabeantrag angelegt.[2] [3] [6]

| Situation | Was nach dem Klick passiert | Handlung für das Team |
| --- | --- | --- |
| **Nicht sensibler Report** | Download startet direkt | Datei prüfen und weiterverwenden |
| **Sensibler Report** | Antrag landet in den Download-Freigaben | Auf Admin-Freigabe warten und Export erneut anstoßen |
| **Automatischer Download schlägt lokal fehl** | Fallback-Link wird angezeigt | Fallback-Link direkt verwenden |

Die Export-Historie protokolliert Format, Auslöser, Kennzahlen und Zeitpunkt. Dadurch bleibt später nachvollziehbar, wer wann welchen Report erzeugt hat.[2] [6]

### 7.5 Download-Freigaben verstehen

Im Bereich **Download-Freigaben** werden sensible Report-Anträge sichtbar. Für Admin-Rollen erscheinen dort Aktionsschaltflächen zum **Freigeben** oder **Ablehnen**. Für normale Nutzer ist stattdessen sichtbar, dass noch eine Freigabe aussteht. Das schafft Transparenz, ohne Governance-Regeln aufzuweichen.[2] [6]

Ein praktisches Finance-Beispiel wäre ein PDF-Report mit sensiblen Fallzusammenfassungen. Ein Analyst fordert den Export an, die Admin-Rolle **finance_approver** prüft den Antrag und gibt ihn frei. Erst danach wird der Export erneut gestartet und revisionssicher protokolliert.

## 8. Teil 5: Governance-Report-Abos einrichten

### 8.1 Sinn und Nutzen von Report-Abos

Governance-Report-Abos sind für Teams gedacht, die den Zustand eines Schwarms **regelmäßig** erhalten möchten, ohne jedes Mal manuell einen Export auszulösen. Die Abos werden serverseitig gespeichert und bei Fälligkeit automatisch verarbeitet. Dabei entstehen Einträge in der Export-Historie, sodass auch wiederkehrende Reports nachvollziehbar bleiben.[2] [6]

### 8.2 Abo anlegen

Zum Anlegen eines Abos werden vier Angaben benötigt: **Taktung**, **Format**, **Empfängerrolle oder Zielteam** und die Entscheidung, ob die **erste Ausführung sofort vorgemerkt** werden soll. Danach wird das Abo gespeichert. Wichtig ist, dass die Empfängerrolle wirklich verständlich benannt wird. Ein vager Begriff wie „Team“ ist weniger hilfreich als „operations_lead“ oder „finance_approver“.[2]

| Feld | Bedeutung | Beispiel |
| --- | --- | --- |
| **Taktung** | Wie oft der Report laufen soll | weekly |
| **Format** | Ausgabeformat des Reports | pdf |
| **Empfängerrolle** | Zielrolle oder Zielteam | operations_lead |
| **Erste Ausführung sofort** | Startet die erste geplante Ausführung ohne Wartezeit | aktiviert |

Im Finance-Beispiel wäre ein **wöchentliches PDF-Abo** für die Rolle **operations_lead** sinnvoll. Damit erhält die operative Leitung regelmäßig eine zusammengefasste Governance-Lage, ohne manuell eingreifen zu müssen.

### 8.3 Laufende Abos lesen

Bereits vorhandene Abos zeigen an, in welchem Rhythmus sie laufen, für wen sie gedacht sind, ob sie aktiv sind und wann der nächste Lauf ansteht. Das ist besonders hilfreich, wenn mehrere Teams denselben Schwarm beobachten oder wenn die Verantwortung für Berichte im Laufe der Zeit wechselt.

## 9. Teil 6: Autonome Schwarmaufträge steuern

### 9.1 Was autonome Schwarmaufträge leisten

Der Bereich **Autonomer Agenten-Schwarm** ist für Aufgaben gedacht, die der Schwarm selbstständig in Teilaufgaben zerlegen, an Mitglieder delegieren und im Verlauf dokumentieren soll. Das System hält dafür Ziel, Kontext, Priorität, Governance-Status, Delegationsplan und Ereignisverlauf zusammen. Sensible Ziele können automatisch in einen Status überführt werden, der eine Freigabe verlangt oder den Lauf blockiert.[2] [5] [7]

Ein passendes Praxisbeispiel lautet: **„Incident analysieren und Kommunikationspfade priorisieren“**. Der Schwarm zerlegt dieses Ziel etwa in Analyse, Priorisierung, Risikoabwägung und Statusaufbereitung. Genau dadurch wird aus einem groben Ziel ein nachvollziehbarer Arbeitsablauf.

### 9.2 Neuen autonomen Lauf anlegen

Für einen neuen Lauf werden **Ziel**, optionaler **Kontext** und eine **Priorität** erfasst. Das Ziel sollte möglichst konkret formuliert sein. Eine zu knappe Eingabe wird vom System abgewiesen; das Ziel muss ausreichend beschreibend sein. Nach dem Start erzeugt der Schwarm einen Delegationsplan und beginnt, abhängig von Governance und Status, mit der Verarbeitung.[2] [7]

| Eingabe | Empfehlung | Beispiel |
| --- | --- | --- |
| **Ziel** | Klarer Arbeitsauftrag mit gewünschtem Ergebnis | Incident analysieren und Kommunikationspfade priorisieren |
| **Kontext** | Zusätzliche Rahmenbedingungen, Risiken oder Hinweise | Betrifft produktionsnahe Zahlungsprozesse; sensible Maßnahmen nur nach Finance-Review |
| **Priorität** | Dringlichkeit des Laufs | urgent |

### 9.3 Status und Governance-Status richtig deuten

Damit Teams autonome Läufe sicher steuern können, müssen sie die Statuswerte klar verstehen.

| Laufstatus | Bedeutung im Alltag | Typische nächste Aktion |
| --- | --- | --- |
| **planned** | Lauf ist angelegt, aber noch nicht aktiv weitergeführt | Beobachten oder fortsetzen |
| **running** | Schwarm arbeitet aktiv an Teilaufgaben | Fortschritt prüfen |
| **awaiting_approval** | Governance verlangt eine Freigabe | Admin-Freigabe einholen |
| **blocked** | Lauf ist aufgrund von Regeln oder Risiken blockiert | Ursache prüfen, ggf. Ziel anpassen |
| **paused** | Lauf wurde bewusst angehalten | Später fortsetzen |
| **completed** | Lauf ist abgeschlossen | Ergebnis prüfen und dokumentieren |
| **cancelled** | Lauf wurde beendet | Kein weiterer Fortschritt erwartet |
| **failed** | Lauf ist fehlerhaft abgebrochen | Ereignisverlauf und Ursache prüfen |

| Governance-Status | Bedeutung | Konsequenz |
| --- | --- | --- |
| **clear** | Keine besondere Governance-Hürde erkannt | Lauf kann regulär weiterlaufen |
| **approval_required** | Sensitivität erkannt, Freigabe nötig | Admin muss eingreifen |
| **blocked** | Ziel oder Teilauftrag ist unzulässig | Lauf bleibt gestoppt |

### 9.4 Delegationsplan lesen

Jeder autonome Lauf besitzt einen **Delegationsplan**. Dort ist sichtbar, welche Teilaufgabe in welcher Reihenfolge an welches Mitglied gegangen ist, welchen Status die Teilaufgabe hat und ob bereits ein Ergebnis vorliegt. Diese Sicht ist besonders wertvoll, wenn ein Team verstehen möchte, ob der Schwarm tatsächlich sinnvoll verteilt arbeitet oder ob ein Engpass bei einem einzelnen Mitglied entsteht.[2] [7]

Für den Finance Control Swarm könnte der Plan etwa so aussehen: Zuerst analysiert **Finance Sentinel** die Lage, danach priorisiert **Support Orchestrator** betroffene Kommunikationspfade, anschließend bewertet **Risk Analyst** Risiken und Freigabebedarf. Schon diese Reihenfolge liefert dem Team eine gut lesbare Begründung für den aktuellen Zustand.

### 9.5 Ereignisverlauf nutzen

Neben dem Delegationsplan zeigt der **Ereignisverlauf** die wichtigsten Signale eines autonomen Laufs. Dazu zählen etwa Planung, Delegation, Rückmeldungen, Governance-Hinweise, Pausen, Fortsetzungen, Abbrüche oder Abschlüsse. Für Reviews und Nachsteuerung ist dieser Verlauf fast genauso wichtig wie der Plan selbst, weil hier sichtbar wird, **wann** und **warum** der Lauf seinen Zustand geändert hat.[2] [7]

### 9.6 Governance-Aktionen: freigeben, pausieren, fortsetzen, stoppen

Abhängig vom Status erscheinen operative Aktionsschaltflächen. Ein Lauf im Status **awaiting_approval** kann von einer Admin-Rolle **freigegeben** werden. Ein **running**-Lauf kann **pausiert** werden. Ein Lauf in **paused** oder **planned** kann **fortgesetzt** werden. Solange ein Lauf noch nicht abgeschlossen oder abgebrochen ist, kann er außerdem **gestoppt** werden. Diese Eingriffe sind besonders hilfreich, wenn sich ein Incident verändert, neue Informationen auftauchen oder Governance-Bedenken auftreten.[2] [7]

Ein realistisches Incident-Beispiel wäre folgendes: Ein Lauf startet mit dem Ziel, einen Produktionsvorfall zu analysieren. Weil das Ziel sensible Maßnahmen andeutet, wechselt der Lauf in **awaiting_approval**. Nach Prüfung gibt die Admin-Rolle den Lauf frei. Während der Bearbeitung taucht ein neues Risiko auf, woraufhin der Lauf vorübergehend pausiert wird. Nach Klärung wird er fortgesetzt und endet schließlich mit einem Abschlussstatus.

## 10. Empfohlener Arbeitsablauf für Teams

In der Praxis hat sich ein klarer Ablauf bewährt. Zuerst werden die einzelnen Agenten sauber angelegt und beschrieben. Danach wird ein Schwarm mit passender Topologie, Koordination und Governance aufgebaut. Anschließend prüft das Team die Kommunikationspfade und testet die Nachrichtenhistorie mit realistischen Status- und Approval-Nachrichten. Erst danach sollte das Reporting aktiv genutzt werden, idealerweise inklusive Begründungspflicht für Exporte und einem ersten Governance-Report-Abo. Wenn der Schwarm stabil arbeitet, können autonome Aufträge hinzukommen.[1] [2] [4] [7]

| Reifegrad | Was das Team tut | Woran man erkennt, dass der Schritt gelungen ist |
| --- | --- | --- |
| **1. Agentenbasis** | Einzelne Agenten registrieren | Liste ist vollständig und verständlich gepflegt |
| **2. Schwarmstruktur** | Schwarm mit Rollen und Governance anlegen | Mission, Mitglieder und Regeln sind klar dokumentiert |
| **3. Kommunikationssicht** | Pfade und Historie aktiv nutzen | Nachrichten sind nachvollziehbar filterbar |
| **4. Reporting** | Kennzahlen, Drilldowns und Exporte verwenden | Risiken und Verzögerungen werden sichtbar |
| **5. Automatisierung** | Abos und autonome Läufe aktivieren | Wiederkehrende Berichte und gesteuerte Autonomie funktionieren |

## 11. Häufige Fragen aus dem Betriebsalltag

### 11.1 Wann sollte ich lieber einen Einzelagenten statt eines Schwarms nutzen?

Ein Einzelagent reicht aus, wenn die Aufgabe klar umrissen ist, keine koordinierte Rollenverteilung braucht und keine sichtbaren Kommunikationspfade erforderlich sind. Ein Schwarm lohnt sich, sobald mehrere Perspektiven, Freigaben, Rollen oder nachvollziehbare Übergaben wichtig werden.

### 11.2 Wann ist **approval_required** besser als **enforced**?

**approval_required** ist die richtige Wahl, wenn ein Team sensible Vorgänge weiterhin bearbeiten darf, aber menschliche Freigaben zwischenschalten will. **enforced** eignet sich eher dort, wo bestimmte Handlungen strikt blockiert werden müssen, etwa bei produktionsnahen Änderungen ohne zulässige Freigabe.[4]

### 11.3 Warum braucht ein Export eine Begründung?

Die Begründung macht einen Report später nachvollziehbar. Gerade bei sensiblen Schwärmen ist nicht nur wichtig, **dass** ein Export erfolgt ist, sondern auch **warum** er erzeugt wurde. Das stärkt Governance und Prüfpfade.[2] [6]

### 11.4 Was tun, wenn ein autonomer Lauf hängt?

Zuerst sollte der Ereignisverlauf gelesen werden. Danach ist zu prüfen, ob der Lauf auf eine Freigabe wartet, blockiert wurde oder manuell pausiert ist. Je nach Ursache kann der Lauf freigegeben, fortgesetzt oder gestoppt und neu aufgesetzt werden.[2] [7]

## 12. Zusammenfassung

Die Agenten-Verwaltung verbindet **Konfiguration**, **operative Steuerung** und **Governance-Nachvollziehbarkeit** in einer Oberfläche. Einzelagenten lassen sich registrieren, bearbeiten und duplizieren. Schwärme können mit klaren Rollen, Kommunikationspfaden und Regeln aufgebaut werden. Das Reporting verdichtet den Zustand eines Schwarms in vier gut lesbare Kennzahlen und bietet Drilldowns, Exporte sowie Abo-Funktionen. Mit autonomen Schwarmaufträgen wird aus einer statischen Konfiguration schließlich ein steuerbarer, dokumentierter Arbeitsablauf.[1] [2] [4] [7]

Für Teams empfiehlt sich ein schrittweises Vorgehen: zuerst saubere Agentenstammdaten, dann ein klar definierter Schwarm, danach Kommunikationssicht und Reporting und erst anschließend mehr Automatisierung. So bleibt das Modul auch bei wachsender Komplexität verständlich, auditierbar und praxistauglich.

## 13. Hinweis für den Betrieb nach der Veröffentlichung

Nach der Veröffentlichung sollte ein periodischer Scheduler für den Endpunkt **`/api/scheduled/governance-reports`** eingerichtet werden, damit zeitgesteuerte Governance-Report-Abos im Produktivbetrieb zuverlässig ausgelöst werden.

## References

[1]: file:///home/ubuntu/agent-control-plane/client/src/pages/ControlPlane.tsx "ControlPlane.tsx"
[2]: file:///home/ubuntu/agent-control-plane/client/src/components/SwarmReportingPanel.tsx "SwarmReportingPanel.tsx"
[3]: file:///home/ubuntu/agent-control-plane/client/src/lib/swarm-insights.ts "swarm-insights.ts"
[4]: file:///home/ubuntu/agent-control-plane/server/controlPlane.test.ts "controlPlane.test.ts"
[5]: file:///home/ubuntu/agent-control-plane/server/swarmAutonomy.ts "swarmAutonomy.ts"
[6]: file:///home/ubuntu/agent-control-plane/server/swarmReports.ts "swarmReports.ts"
[7]: file:///home/ubuntu/agent-control-plane/scripts/seed-autonomy-demo.ts "seed-autonomy-demo.ts"
