# Agent Control Plane – JavaScript/TypeScript SDK

Connect a Node.js agent to the Agent Control Plane: ask before acting, wait for
human approval, and report events back. Dependency-free (uses global `fetch`,
Node 18+).

## Install

```bash
# from this repo:
npm install ./sdk/js
# or, once published:  npm install agent-control-plane
```

## Quickstart

```js
import { AgentControlPlane } from "agent-control-plane";

const acp = new AgentControlPlane("https://acc.3333.tools", "acp_DEIN_API_KEY");

// 1. Ask before acting (blocks if a human approval is required)
await acp.ensureAllowed(5, "erp.payment.execute");

// 2. ... run your real action / LLM call here ...

// 3. Report what happened
await acp.ingestAudit(5, { category: "ERP", title: "Zahlung ausgeführt", detail: "…" });
await acp.ingestMetric(5, { latencyMs: 820, errorRate: 0, apiCostUsd: 0.04, tokenUsage: 1300 });
```

- `5` is the **agent_id** (from the agent's card in *Agenten-Verwaltung*).
- The API key (`acp_…`) is created under *API-Schlüssel & Integration* and scopes
  every call to your workspace.

Decisions: `allowed`, `forbidden`, `approval_required`. With `ensureAllowed`,
a forbidden action throws and a required approval blocks until granted/rejected.

See `examples/js_agent.mjs` for a full agent loop including an Anthropic call.
