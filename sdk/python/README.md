# Agent Control Plane – Python SDK

Connect your agent runtime to the Agent Control Plane: ask before acting,
wait for human approval, and report events back.

## Install

```bash
pip install -e sdk/python          # from this repo
# or, once published:  pip install agent-control-plane
```

## Quickstart

```python
from agent_control_plane import AgentControlPlane

acp = AgentControlPlane("https://acc.3333.tools", "acp_DEIN_API_KEY")

# 1. Ask before acting (blocks if a human approval is required)
acp.ensure_allowed(agent_id=1, action_type="erp.payment.execute")

# 2. ... run your real action / LLM call here ...

# 3. Report what happened
acp.ingest_audit(agent_id=1, category="ERP", title="Zahlung ausgeführt",
                 detail="Auszahlung an Lieferanten X")
acp.ingest_metric(agent_id=1, latency_ms=820, error_rate=0.0,
                  api_cost_usd=0.04, token_usage=1300)
```

`action_type` is matched against your policies (e.g. `erp.payment.*`). Possible
decisions: `allowed`, `forbidden`, `approval_required` (a human must approve in
the Approval Workflow before the agent continues).

Your API key (`acp_…`) is created in the app under **API-Schlüssel & Integration**
and scopes every call to your workspace.

See `examples/python_agent.py` for a full agent loop including an Anthropic
(Claude) call.
