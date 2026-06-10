#!/usr/bin/env node
/**
 * Beispiel-Agent-Runtime für die Agent Control Plane (Option B).
 *
 * Zeigt den vollständigen Governance-Ablauf eines externen Agenten:
 *   1. VOR der Aktion fragen:  POST /api/policy-check  -> allowed | forbidden | approval_required
 *   2. Bei approval_required:  GET  /api/approval-status/:id  pollen bis approved/rejected
 *   3. Aktion ausführen:       echter LLM-Aufruf (Anthropic / Claude)
 *   4. NACH der Aktion melden:  POST /api/ingest  (audit + metric)
 *
 * Der LLM-API-Key liegt HIER beim Agenten – nie im Control Plane.
 * Reine HTTP-Aufrufe, keine Abhängigkeiten (Node 18+ mit globalem fetch).
 *
 * Nutzung:
 *   CONTROL_PLANE_URL=https://acc.3333.tools \
 *   INGEST_TOKEN=<dein INGEST_TOKEN> \
 *   ANTHROPIC_API_KEY=<dein Anthropic-Key> \
 *   AGENT_ID=1 \
 *   ACTION_TYPE=crm.email.send \
 *   PROMPT="Schreibe eine freundliche Antwort auf Ticket #1234." \
 *   node examples/example-agent.mjs
 *
 * Demo-Tipp (gegen die Seed-Policies):
 *   ACTION_TYPE=crm.email.send       -> allowed
 *   ACTION_TYPE=crm.customer.export  -> forbidden (global gesperrt)
 *   AGENT_ID=1 ACTION_TYPE=erp.payment.execute -> approval_required (Finance Sentinel)
 */

const CONTROL_PLANE_URL = (process.env.CONTROL_PLANE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const INGEST_TOKEN = process.env.INGEST_TOKEN ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.MODEL ?? "claude-sonnet-4-6";
const AGENT_ID = Number(process.env.AGENT_ID ?? "1");
const ACTION_TYPE = process.env.ACTION_TYPE ?? "crm.email.send";
const PROMPT = process.env.PROMPT ?? "Fasse den aktuellen Vorgang in zwei Sätzen zusammen.";
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

const authHeaders = { Authorization: `Bearer ${INGEST_TOKEN}`, "Content-Type": "application/json" };

/** 1. Policy-Check: darf der Agent diese Aktion ausführen? */
async function policyCheck() {
  const res = await fetch(`${CONTROL_PLANE_URL}/api/policy-check`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      agentId: AGENT_ID,
      actionType: ACTION_TYPE,
      summary: `Agent möchte ${ACTION_TYPE} ausführen.`,
      requestedBy: "example-agent",
    }),
  });
  if (!res.ok) throw new Error(`policy-check fehlgeschlagen: HTTP ${res.status} ${await res.text()}`);
  return res.json();
}

/** 2. Auf die menschliche Freigabe warten (Polling). */
async function waitForApproval(approvalId) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const res = await fetch(`${CONTROL_PLANE_URL}/api/approval-status/${approvalId}`, { headers: authHeaders });
    const data = await res.json();
    if (data.status && data.status !== "pending") return data.status; // approved | rejected | expired
    console.log(`  … warte auf Freigabe #${approvalId} (Status: ${data.status})`);
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("Timeout: keine Freigabeentscheidung erhalten.");
}

/** 3. Die eigentliche Aktion: echter LLM-Aufruf bei Anthropic. */
async function runLlm() {
  const start = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 512, messages: [{ role: "user", content: PROMPT }] }),
  });
  if (!res.ok) throw new Error(`LLM-Aufruf fehlgeschlagen: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  const usage = data?.usage ?? { input_tokens: 0, output_tokens: 0 };
  return { text, latencyMs: Date.now() - start, tokens: usage.input_tokens + usage.output_tokens };
}

/** 4. Ergebnis an das Control Plane melden (Audit + Metrik). */
async function ingest(type, payload) {
  const res = await fetch(`${CONTROL_PLANE_URL}/api/ingest`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ type, payload }),
  });
  if (!res.ok) console.warn(`  ingest(${type}) fehlgeschlagen: HTTP ${res.status} ${await res.text()}`);
}

async function main() {
  if (!INGEST_TOKEN) throw new Error("INGEST_TOKEN fehlt.");

  console.log(`▶ Agent ${AGENT_ID} prüft Aktion "${ACTION_TYPE}" …`);
  const check = await policyCheck();
  console.log(`  Entscheidung: ${check.decision}` + (check.policyName ? ` (Policy: ${check.policyName})` : ""));

  if (check.decision === "forbidden") {
    console.log(`✖ Verboten: ${check.reason ?? "durch Policy gesperrt"}. Aktion wird NICHT ausgeführt.`);
    return;
  }

  if (check.decision === "approval_required") {
    console.log(`⏸ Freigabe nötig (Approval #${check.approvalId}). Bitte im Approval Workflow entscheiden …`);
    const status = await waitForApproval(check.approvalId);
    if (status !== "approved") {
      console.log(`✖ Freigabe ${status}. Aktion wird NICHT ausgeführt.`);
      return;
    }
    console.log("  ✓ Freigegeben.");
  }

  // allowed oder approved -> Aktion ausführen
  if (!ANTHROPIC_API_KEY) {
    console.log("  (ANTHROPIC_API_KEY fehlt – überspringe echten LLM-Aufruf, melde nur das Event.)");
    await ingest("audit", {
      agentId: AGENT_ID,
      category: "Operations",
      title: `Aktion ausgeführt: ${ACTION_TYPE}`,
      detail: "Trockenlauf ohne LLM-Aufruf.",
    });
    return;
  }

  console.log("  ▶ Führe LLM-Aufruf aus …");
  const result = await runLlm();
  console.log(`  ✓ LLM-Antwort (${result.tokens} Tokens, ${result.latencyMs} ms):\n  ${result.text.slice(0, 200)}…`);

  await ingest("audit", {
    agentId: AGENT_ID,
    category: "Operations",
    title: `Aktion ausgeführt: ${ACTION_TYPE}`,
    detail: result.text.slice(0, 500),
  });
  await ingest("metric", {
    agentId: AGENT_ID,
    latencyMs: result.latencyMs,
    errorRate: 0,
    apiCostUsd: Number((result.tokens * 0.000003).toFixed(4)),
    tokenUsage: result.tokens,
  });
  console.log("✔ Fertig – Audit + Metrik gemeldet.");
}

main().catch(err => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
