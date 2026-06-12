# Agent Control Plane – Handbuch & Guide

Dieses Dokument erklärt **einfach und vollständig**, was die Agent Control Plane
ist, wie sie funktioniert und wie Kunden ihre Agenten anbinden. Es richtet sich
an dich (Betreiber) **und** an zukünftige Kunden.

---

## 1. Was ist die Agent Control Plane? (in einem Satz)

Eine zentrale **Schaltzentrale, um KI-Agenten zu steuern, abzusichern und zu
überwachen** – ein Cockpit für Governance, Freigaben, Audit und Kosten.

Stell dir eine **Flugsicherung** vor: Die Flugzeuge (KI-Agenten) fliegen real
da draußen. Die Flugsicherung (dieses Tool) gibt Freigaben, überwacht alles und
führt ein lückenloses Logbuch – fliegt aber selbst nicht.

---

## 2. Das wichtigste Konzept: Kontrollebene vs. echte Agenten

> **Die echten Agenten laufen NICHT in diesem Tool.** Sie laufen beim Kunden
> (in seinem Code, seiner Infrastruktur). Dieses Tool ist die **Kontroll- und
> Governance-Ebene**, an die sich die echten Agenten anbinden.

Wenn du hier einen Agenten „anlegst", erstellst du **keinen** laufenden Agenten,
sondern eine **Registrierung / Karteikarte** des Kunden-Agenten. Daran hängen:
Policies, Freigaben, Kosten, Audit-Spur, Guardrails.

### Wie wird ein echter Agent angebunden?
Über **zwei Schlüssel-Informationen**:

| Information | Bedeutung | Wofür |
|---|---|---|
| **API-Schlüssel** (`acp_…`) | Identifiziert den **Kunden** (Workspace) | „Wer ruft an?" |
| **agent_id** (Nummer, z. B. `5`) | Identifiziert den **konkreten Agenten** | „Welcher Agent?" |

**Wichtig:** Die Verknüpfung läuft über die **agent_id (Nummer)**, *nicht* über
den Namen. Der Name ist nur ein Etikett fürs Dashboard.

---

## 3. Die Module (Navigation)

| Modul | Zweck |
|---|---|
| **Dashboard-Übersicht** | KPIs auf einen Blick: aktive Agenten, offene Freigaben, Audit-Signale, Kosten |
| **Agenten-Verwaltung** | Agenten registrieren, bearbeiten, Schwärme anlegen – hier steht die **Agent-ID** |
| **Policy Engine** | Regeln: Was ist erlaubt / verboten / freigabepflichtig? |
| **Rollen- & Rechteverwaltung** | Teams, Berechtigungen |
| **Approval Workflow** | Freigaben prüfen, genehmigen oder ablehnen (Human-in-the-loop) |
| **Audit Log** | Lückenlose, filterbare Protokollspur aller Ereignisse |
| **Tool & Connector Layer** | Verbindungen zu Fremdsystemen (CRM, ERP, E-Mail …) |
| **Evaluation Layer** | Agenten vor dem Einsatz testen |
| **Runtime Guardrails** | Laufzeitschutz, Auto-Stops, Limits |
| **Observability & Cost Monitoring** | Latenz, Fehler, Kosten, Token-Verbrauch |
| **API-Schlüssel & Integration** | Eigene Schlüssel erzeugen + fertiges Code-Snippet zum Anbinden |
| **Hilfe & Dokumentation** | Einstieg, Handbücher, Tour |

---

## 4. Mandantenfähigkeit (Multi-Tenant)

Jeder eingeloggte Kunde hat einen **eigenen, vollständig isolierten Bereich**:
- Kunde A sieht **nie** die Daten von Kunde B.
- Neue Kunden starten mit einem kleinen **Beispiel-Datensatz** (Starter-Set),
  damit das Dashboard nicht leer ist.
- Der **Projektinhaber** (du) ist ein Sonderfall und behält die ursprünglichen
  Demo-Daten (gesteuert über die Variable `OWNER_OPEN_ID`, siehe Abschnitt 9).

Technischer Kern: Jeder Datensatz trägt einen Besitzer (`ownerId`); jede
Abfrage filtert nach dem eingeloggten Kunden.

---

## 5. Die Governance-APIs (so „spricht" ein Agent mit dem Tool)

Ein externer Agent kommuniziert über einfache HTTPS-Aufrufe mit **Bearer-API-Key**.

### a) Vor einer Aktion fragen – `POST /api/policy-check`
Antwort: `allowed` (erlaubt) · `forbidden` (verboten) · `approval_required`
(ein Mensch muss erst im **Approval Workflow** freigeben).

### b) Auf Freigabe warten – `GET /api/approval-status/:id`
Der Agent fragt wiederholt nach, bis ein Mensch entschieden hat.

### c) Nach der Aktion melden – `POST /api/ingest`
Typen: `audit` (Ereignis), `metric` (Latenz/Kosten/Token), `guardrail`
(Verstoß → Agent wird gestoppt). → erscheint sofort im Dashboard.

> Der LLM-API-Key (OpenAI/Anthropic) liegt **beim Kunden-Agenten**, nie in
> diesem Tool. Das Tool sieht nur die Meldungen, nicht die Modell-Keys.

---

## 6. Python-SDK (der einfachste Weg zur Anbindung)

Statt roher HTTP-Aufrufe nutzen Kunden das mitgelieferte SDK
(`sdk/python/agent_control_plane`):

```python
from agent_control_plane import AgentControlPlane

acp = AgentControlPlane("https://acc.3333.tools", "acp_DEIN_API_KEY")

# 1. Vor der Aktion fragen (blockiert automatisch, falls Freigabe nötig)
acp.ensure_allowed(agent_id=5, action_type="erp.payment.execute")

# 2. ... echte Aktion / LLM-Aufruf des Agenten ...

# 3. Ergebnis melden
acp.ingest_audit(agent_id=5, category="ERP", title="Zahlung ausgeführt", detail="…")
acp.ingest_metric(agent_id=5, latency_ms=820, error_rate=0.0,
                  api_cost_usd=0.04, token_usage=1300)
```

Ein vollständiges Beispiel inkl. Claude-Aufruf: `examples/python_agent.py`.

**JavaScript/TypeScript-SDK** (`sdk/js`, für Node.js-Agenten):
```js
import { AgentControlPlane } from "agent-control-plane";
const acp = new AgentControlPlane("https://acc.3333.tools", "acp_DEIN_API_KEY");
await acp.ensureAllowed(5, "erp.payment.execute");
await acp.ingestAudit(5, { category: "ERP", title: "Zahlung ausgeführt", detail: "…" });
```
Vollständiges Beispiel: `examples/js_agent.mjs`.

---

## 7. Onboarding eines Kunden – Schritt für Schritt

1. **Registrieren / Anmelden** unter der App-URL (E-Mail + Passwort oder Google).
2. **Agenten anlegen** (Agenten-Verwaltung) → **Agent-ID** notieren (steht auf
   der Agenten-Karte, per Klick kopierbar).
3. **Policies definieren** (Policy Engine): z. B. „`erp.payment.*` braucht
   Freigabe", „`data.export` verboten".
4. **API-Schlüssel erzeugen** (API-Schlüssel & Integration) → einmalig kopieren.
5. **Snippet kopieren** (mit vorbefüllter URL, Schlüssel und richtiger
   Agent-ID) und in den echten Agenten-Code einbauen.
6. Fertig: Der echte Agent fragt vor Aktionen an, riskante Aktionen brauchen
   eine Freigabe, und alles landet im Audit-Log.

---

## 8. Häufige Fragen (FAQ)

**Wo wähle ich das KI-Modell aus / wo hinterlege ich Modell-Einstellungen?**
Das Feld „Modell" am Agenten ist nur ein **Etikett** (z. B. `gpt-4.1`). Dieses
Tool ruft **selbst keine LLMs auf** und speichert keine Modell-API-Keys – der
echte Modell-Aufruf passiert beim Kunden-Agenten. (Eine echte Modell-Ausführung
im Tool wäre ein separates, optionales Feature.)

**Laufen die Agenten in diesem Tool?**
Nein. Sie laufen beim Kunden. Das Tool registriert, steuert und überwacht sie.

**Muss der Agenten-Name mit dem echten Agenten übereinstimmen?**
Nein. Verknüpft wird über die **agent_id (Nummer)**. Der Name ist frei wählbar.

**Warum stiegen die „monatlichen Kosten" früher so schnell?**
Das war eine **Demo-Simulation** und gilt nur noch für den Inhaber-Demo-Bereich.
Bei echten Kunden wachsen die Kosten **nur** aus echten gemeldeten Metriken
(`/api/ingest`).

**Sieht ein Kunde die Daten anderer Kunden?**
Nein, niemals. Jeder Bereich ist strikt isoliert (auch nicht über IDs erreichbar).

**Was passiert mit einem API-Schlüssel?**
Er wird nur als **Hash** gespeichert und **einmalig** im Klartext angezeigt.
Verloren = neuen erzeugen. Widerrufen = sofort ungültig.

**Brauche ich einen Mailserver?**
Für Passwort-Bestätigungen ja (SMTP in Supabase). Im Selbstbetrieb ist aktuell
„E-Mail-Autobestätigung" aktiv, sodass Registrierungen sofort gelten.

---

## 9. Betrieb / Deployment (für dich als Betreiber)

- **Hosting:** Coolify auf Hetzner, Docker-Build aus dem Git-Repo.
- **Datenbank + Auth:** self-hosted **Supabase** (Postgres + Auth).
- **Persistenz:** Geschäftsdaten als JSONB write-through; überleben Neustarts.
- **Login:** Supabase Auth (E-Mail/Passwort + optional Google); der Server
  stellt nach Verifikation ein eigenes httpOnly-Session-Cookie aus.

**Wichtige Umgebungsvariablen (App in Coolify):**

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | Supabase-Postgres-Verbindung |
| `SUPABASE_URL` | **interne** Kong-Adresse (server-seitig) |
| `VITE_SUPABASE_URL` | **öffentliche** Supabase-URL (Browser, Build-Arg) |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | öffentlicher Key |
| `SUPABASE_SERVICE_ROLE_KEY` | server-seitiger Key |
| `SUPABASE_JWT_SECRET` | = `SERVICE_PASSWORD_JWT` (exakt!) |
| `JWT_SECRET` | Secret für das Session-Cookie |
| `OWNER_OPEN_ID` | **deine** Supabase-User-UID → du bleibst Inhaber & behältst Demo-Daten |
| `INGEST_TOKEN` | Legacy-Service-Token (Inhaber-Bereich) |
| `APP_ORIGIN` | öffentliche App-URL |

**Nach Code-Änderungen:** in Coolify **Redeploy** (zieht den neuesten Git-Stand).

---

## 10. Sicherheit – Kurzüberblick

- Strikte Mandanten-Trennung (kein Datenleck zwischen Kunden).
- API-Keys nur gehasht gespeichert.
- helmet-Security-Header, Rate-Limit auf der API, Env-Validierung (Fail-fast).
- Authentifizierung serverseitig erzwungen; interne Fehler werden nicht an
  Clients durchgereicht.

---

*Stand: laufend gepflegt. Bei neuen Funktionen dieses Handbuch ergänzen.*
