#!/usr/bin/env node
/**
 * Full example agent using the Agent Control Plane JS/TS SDK.
 *
 * Flow: ensureAllowed (policy-check + wait for approval) -> Claude call ->
 * report audit + metric.
 *
 * Run:
 *   CONTROL_PLANE_URL=https://acc.3333.tools \
 *   ACP_API_KEY=acp_your_key \
 *   ANTHROPIC_API_KEY=sk-ant-... \
 *   AGENT_ID=5 ACTION_TYPE=erp.payment.execute \
 *   node examples/js_agent.mjs
 */
import { AgentControlPlane, ApprovalRejectedError, ControlPlaneError } from "../sdk/js/index.js";

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL ?? "http://localhost:3000";
const ACP_API_KEY = process.env.ACP_API_KEY ?? "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL = process.env.MODEL ?? "claude-sonnet-4-6";
const AGENT_ID = Number(process.env.AGENT_ID ?? "1");
const ACTION_TYPE = process.env.ACTION_TYPE ?? "crm.email.send";
const PROMPT = process.env.PROMPT ?? "Fasse den aktuellen Vorgang in zwei Sätzen zusammen.";

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
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  const usage = data?.usage ?? { input_tokens: 0, output_tokens: 0 };
  return { text, latencyMs: Date.now() - start, tokens: usage.input_tokens + usage.output_tokens };
}

async function main() {
  if (!ACP_API_KEY) throw new Error("ACP_API_KEY fehlt.");
  const acp = new AgentControlPlane(CONTROL_PLANE_URL, ACP_API_KEY);

  console.log(`▶ Agent ${AGENT_ID} prüft Aktion "${ACTION_TYPE}" …`);
  try {
    const decision = await acp.ensureAllowed(AGENT_ID, ACTION_TYPE, { requestedBy: "js-agent" });
    console.log(`  Entscheidung: ${decision.decision}`
      + (decision.policyName ? ` (Policy: ${decision.policyName})` : ""));
  } catch (err) {
    if (err instanceof ApprovalRejectedError) return console.log(`✖ ${err.message}. Abbruch.`);
    if (err instanceof ControlPlaneError) return console.log(`✖ Verboten/Fehler: ${err.message}. Abbruch.`);
    throw err;
  }

  if (!ANTHROPIC_API_KEY) {
    console.log("  (ANTHROPIC_API_KEY fehlt – überspringe LLM-Aufruf, melde nur das Event.)");
    await acp.ingestAudit(AGENT_ID, { category: "Operations", title: `Aktion ausgeführt: ${ACTION_TYPE}`, detail: "Trockenlauf." });
    return;
  }

  console.log("  ▶ Führe LLM-Aufruf aus …");
  const { text, latencyMs, tokens } = await runLlm();
  console.log(`  ✓ Antwort (${tokens} Tokens, ${latencyMs} ms): ${text.slice(0, 160)}…`);

  await acp.ingestAudit(AGENT_ID, { category: "Operations", title: `Aktion ausgeführt: ${ACTION_TYPE}`, detail: text.slice(0, 500) });
  await acp.ingestMetric(AGENT_ID, { latencyMs, errorRate: 0, apiCostUsd: Number((tokens * 0.000003).toFixed(4)), tokenUsage: tokens });
  console.log("✔ Fertig – Audit + Metrik gemeldet.");
}

main().catch(err => {
  console.error("Fehler:", err.message);
  process.exit(1);
});
