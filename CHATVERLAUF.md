# Chatverlauf / Projektprotokoll

Chronologischer Verlauf der Zusammenarbeit an der **Agent Control Plane**.
Getreue Zusammenfassung pro Runde (Frage des Nutzers → durchgeführte Aktionen →
Ergebnis/Commit). Wird am Ende jeder Runde fortgeschrieben.

> Hinweis: Dies ist ein strukturiertes Protokoll, keine wortwörtliche
> Mitschrift. Secrets sind bewusst nicht enthalten.

---

## Runde 1 — Was kann das Programm?
**Nutzer:** Bitte den Code erklären – was kann das Programm, einfach verständlich.
**Aktion:** Doku gelesen (architecture.md, handoff.md, package.json). Erklärt:
internes Enterprise-Dashboard für **AI-Agent-Governance** mit 10 Modulen
(Dashboard, Agenten, Policies, Access, Approvals, Audit, Connectors,
Evaluations, Guardrails, Observability). Stack: React + tRPC + Express + Drizzle.
Stand: funktionsfähiger MVP mit Demo-Datenschicht.

## Runde 2 — Plan: MVP → Live-Web-App
**Nutzer:** Schritt-für-Schritt-Plan, um aus dem MVP eine echte Live-App zu machen;
nach Freigabe umsetzen.
**Entscheidungen (Rückfragen):** Ausbau = **voll produktionsreif**; Hosting =
**Coolify auf Hetzner**; Login = **eigener Login**; vorhanden = **Supabase**.
**Aktion:** 9-Phasen-Plan erstellt und freigegeben.

## Runde 3 — Umsetzung Phasen 0–8 (Produktionsreife)
- Phase 0: `.env.example` + Env-Validierung (fail-fast).
- Phase 1: DB von **MySQL → Postgres** (pg-core, postgres-js), Migration neu.
- Phase 2: **JSONB-Persistenz** (write-through), Daten überleben Neustart.
- Phase 3: **Supabase Auth** statt Manus-OAuth (eigene Login-Seite).
- Phase 4: Härtung (pino, helmet, Rate-Limit, /healthz, Sentry, Env-Validierung).
- Phase 5: reale Event-Ingestion (`/api/ingest`).
- Phase 6: serverseitige RBAC (protectedProcedure).
- Phase 7: Dockerfile, .dockerignore, GitHub-Actions-CI, Coolify-Portbindung,
  Auto-Migration beim Start.
- Phase 8: Tests auf Postgres/Supabase angepasst (72 grün / 2 DB-only skip).
**Ergebnis:** Typecheck/Build/Tests grün; nach GitHub gepusht.

## Runde 4 — Live-Deployment über Coolify (Debugging)
Schrittweise zum Laufen gebracht; gelöste Probleme:
- Repo musste public sein (Coolify-GitHub-Zugriff).
- `vite` nicht in Prod-Bundle → nur dynamisch im Dev-Pfad laden.
- self-hosted Supabase aufgesetzt; kaputte Env-Variablen (Leerzeichen im Namen)
  blockierten Supabase-Start → bereinigt.
- App-Env in die **App**-Ressource (nicht Supabase); HTTPS-Domain für Kong.
- `supabase-js` crasht auf Node 20 (WebSocket) → **Token lokal per JWT prüfen**.
- `SUPABASE_URL`-Wert war fehlerhaft (Name im Wert) → korrigiert.
- `SUPABASE_JWT_SECRET` exakt = `SERVICE_PASSWORD_JWT` setzen.
- `ENABLE_EMAIL_AUTOCONFIRM=true` (kein SMTP); Passwort per SQL gesetzt.
**Ergebnis:** App **live** unter `https://acc.3333.tools`; Login + Persistenz
funktionieren (Test: Agent angelegt → Neustart → Daten noch da).

## Runde 5 — Modelle & Konzept erklärt
**Nutzer:** Wo wähle ich echte KI-Modelle? **Antwort:** Das „Modell"-Feld ist nur
ein Etikett; das Tool ruft keine LLMs auf. Konzept **Option B** erklärt:
externe Agenten rufen LLMs selbst auf und melden sich beim Tool an.

## Runde 6 — Governance-APIs gebaut
- `POST /api/policy-check` (allowed/forbidden/approval_required, legt Approval an).
- `GET /api/approval-status/:id` (Polling).
- Beispiel-Agent `examples/example-agent.mjs`.

## Runde 7 — Multi-Tenant-SaaS (Plan + Umsetzung A–D)
**Nutzer:** Kunden sollen eigene Agenten anbinden → 4 Schritte umsetzen.
**Entscheidungen:** Plan zuerst; Neukunde = eigener Bereich mit Demo-Vorlage;
SDK = Python zuerst.
- **A – Mandantenfähigkeit:** AsyncLocalStorage-Tenant, `ownerId` an Records,
  `owned()`/`findOwned()`/`stamp()`, Seeding für Neukunden, Owner→DEFAULT.
- **B – API-Schlüssel:** `acp_…`-Keys (nur Hash gespeichert), tRPC-Router,
  REST-Auth per Key → Tenant.
- **C – Onboarding-UI:** Seite „API-Schlüssel & Integration" (`/integration`).
- **D – Python-SDK:** `sdk/python/agent_control_plane` + `examples/python_agent.py`.
**Tests:** neue Isolations- & API-Key-Tests; 76 grün.

## Runde 8 — Kosten-Simulation eingegrenzt
**Nutzer:** Monatliche Kosten steigen unrealistisch schnell.
**Aktion:** Simulierte Live-Drift nur noch für Inhaber-Demo (DEFAULT); echte
Kunden sehen nur reale Ingest-Kosten.

## Runde 9 — Anbinde-Konzept erklärt + Agent-ID sichtbar
**Nutzer:** Verständnisfrage zur Verknüpfung. **Antwort:** Tool = Kontrollebene;
echte Agenten laufen extern; Verknüpfung über **agent_id (Nummer)**, nicht Name;
API-Key = Kunde.
**Aktion:** Agent-ID in der Agenten-Verwaltung sichtbar (Kopier-Button) +
Agent-Auswahl im Integrations-Snippet.

## Runde 10 — Handbuch erstellt
**Nutzer:** Alle Fragen/Funktionen als Handbuch im Projektordner.
**Aktion:** `HANDBUCH.md` angelegt (Konzept, Module, Anbindung, APIs, SDK,
Onboarding, FAQ, Betrieb).

## Runde 11 — Erweiterungen erklärt + Verlaufsdatei
**Nutzer:** JS/TS-SDK, Abrechnung/Limits, Team-Tenancy erklären; danach diese
Verlaufsdatei anlegen und fortschreiben; anschließend mit Schritt 1 beginnen.
**Aktion:** Erweiterungen einfach erklärt; `CHATVERLAUF.md` angelegt.

## Runde 12 — Schritt 1: JS/TS-SDK
**Aktion:** JavaScript/TypeScript-SDK gebaut (`sdk/js/index.js` + `index.d.ts` +
`package.json` + README), dependency-frei (globales fetch). Gleiche API wie das
Python-SDK (`policyCheck`, `ensureAllowed`, `waitForApproval`, `ingestAudit/
Metric/Guardrail`). Beispiel `examples/js_agent.mjs`. Handbuch ergänzt.
