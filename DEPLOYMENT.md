# Deployment-Leitfaden – Agent Control Plane

Diese Anleitung beschreibt, wie die App produktiv über **Coolify auf deinem
Hetzner-Server** mit **Supabase** (Postgres + Auth) live geht.

Der gesamte Code- und Konfigurationsumbau ist abgeschlossen. Die folgenden
Schritte erfordern deine Zugangsdaten und werden von dir ausgeführt.

---

## 1. Supabase einrichten

1. Projekt unter https://supabase.com anlegen (oder bestehendes nutzen).
2. **Connection-String** holen: Project Settings → Database → Connection string →
   *Transaction pooler* (Port `6543`). Das ist `DATABASE_URL`.
3. **API-Keys** holen: Project Settings → API:
   - Project URL → `SUPABASE_URL` und `VITE_SUPABASE_URL`
   - `anon public` → `SUPABASE_ANON_KEY` und `VITE_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
4. **JWT-Secret** holen: Project Settings → API → JWT Settings → `SUPABASE_JWT_SECRET`.
5. **Auth-Provider** aktivieren: Authentication → Providers:
   - *Email* aktivieren (E-Mail/Passwort). Für schnellen Test ggf. „Confirm email" deaktivieren.
   - *Google* optional aktivieren (Client-ID/Secret hinterlegen).
6. **Redirect-URLs** setzen: Authentication → URL Configuration →
   Site URL = deine Domain (z. B. `https://control-plane.example.com`),
   zusätzlich `https://control-plane.example.com/login` zu den Redirect-URLs.

> Migrationen werden **automatisch beim Serverstart** angewendet (drizzle-orm
> Migrator). Du musst `drizzle-kit` nicht manuell ausführen.

---

## 2. Umgebungsvariablen (in Coolify setzen)

Alle Variablen sind in `.env.example` dokumentiert. Pflicht in Produktion:

| Variable | Wert |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `APP_ORIGIN` | `https://deine-domain` |
| `DATABASE_URL` | Supabase Pooler-Connection-String (Port 6543) |
| `JWT_SECRET` | starkes Secret (`openssl rand -base64 48`) |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_JWT_SECRET` | JWT-Secret aus Supabase |
| `INGEST_TOKEN` | optional, `openssl rand -hex 32` (für `/api/ingest`) |
| `SENTRY_DSN` | optional (Error-Tracking) |

**Build-Args** (Coolify → Build-time variables; werden ins Client-Bundle eingebacken):

| Build-Arg | Wert |
|---|---|
| `VITE_SUPABASE_URL` | wie `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | wie `SUPABASE_ANON_KEY` |
| `VITE_APP_ID` | z. B. `agent-control-plane` |

---

## 3. Coolify-Application anlegen

1. **New Resource → Application → Public/Private Repository**, dieses Repo wählen.
2. **Build Pack: Dockerfile** (das `Dockerfile` im Repo-Root wird genutzt).
3. **Environment variables** aus Tabelle oben eintragen; die drei `VITE_*` als
   **Build-time variables** markieren.
4. **Domain** zuweisen → Coolify/Traefik stellt automatisch HTTPS (Let's Encrypt) bereit.
5. **Health check path**: `/healthz`.
6. **Port**: `3000`.
7. **Deploy** starten. Beim ersten Start:
   - wendet der Server die DB-Migrationen an,
   - seedet die Demo-Daten automatisch (leere DB → Demo-Inhalt),
   - serviert anschließend SPA + API.
8. Optional: Auto-Deploy/Webhook aktivieren, damit Pushes automatisch deployen.

---

## 4. Erster Login

- `https://deine-domain/login` öffnen.
- Registrieren (E-Mail/Passwort) oder „Mit Google anmelden".
- Nach erfolgreicher Anmeldung setzt der Server ein httpOnly-Session-Cookie und
  leitet ins Dashboard.

**Admin-Rolle:** Neue Nutzer erhalten standardmäßig die Rolle `user`. Um einen
Nutzer zum Admin zu machen, setze `OWNER_OPEN_ID` auf dessen Supabase-User-UUID
(Authentication → Users) – dieser wird beim nächsten Login automatisch `admin`.

---

## 5. Lokale Entwicklung / Verifikation

```bash
cp .env.example .env      # Werte eintragen (mindestens DATABASE_URL + Supabase + JWT_SECRET)
pnpm install
pnpm db:migrate           # optional manuell; der Server migriert sonst beim Start
pnpm dev                  # http://localhost:3000
```

Persistenz-Smoke-Test:
1. Agent anlegen → Policy zuweisen → Approval bearbeiten.
2. Server neu starten (`pnpm dev` stoppen/starten).
3. Daten sind weiterhin da → Persistenz bestätigt.

`pnpm test` läuft ohne DB grün (2 DB-spezifische Tests werden übersprungen);
mit gesetzter `DATABASE_URL` laufen auch diese mit.

---

## 6. Reale Event-Ingestion (optional)

Live-Agenten können echte Events pushen:

```bash
curl -X POST https://deine-domain/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"audit","payload":{"category":"Runtime","title":"Aktion ausgeführt","detail":"...","agentId":1}}'
```

Typen: `audit`, `metric`, `guardrail`.

---

## Architektur-Hinweise

- **Persistenz:** Geschäftsdaten liegen in einem JSONB-Write-through-Store
  (`appCollections`-Tabelle), werden beim Start geladen und gepuffert
  zurückgeschrieben (Intervall + Flush bei Shutdown). Auth-Nutzer (`users`) sowie
  Approval-Chains/Swarm-Daten liegen in eigenen relationalen Tabellen.
- **Auth:** Supabase Auth (E-Mail/Passwort + Google) als Identitätsanbieter; der
  Server verifiziert das Supabase-Token einmalig beim Login und stellt ein
  eigenes httpOnly-Session-Cookie aus.
- **Sicherheit:** helmet-Header, Rate-Limit auf `/api/trpc`, Env-Validierung
  (fail-fast in Produktion), maskierte interne Fehler.
