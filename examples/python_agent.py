#!/usr/bin/env python3
"""Full example agent using the Agent Control Plane Python SDK.

Flow: policy-check -> (wait for human approval if required) -> Claude call ->
report audit + metric.

Run:
    pip install -e sdk/python anthropic
    export CONTROL_PLANE_URL=https://acc.3333.tools
    export ACP_API_KEY=acp_your_key
    export ANTHROPIC_API_KEY=sk-ant-...
    export AGENT_ID=1
    export ACTION_TYPE=erp.payment.execute
    python examples/python_agent.py
"""

import os
import time

from agent_control_plane import AgentControlPlane, ApprovalRejected

CONTROL_PLANE_URL = os.environ.get("CONTROL_PLANE_URL", "http://localhost:3000")
ACP_API_KEY = os.environ.get("ACP_API_KEY", "")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = os.environ.get("MODEL", "claude-sonnet-4-6")
AGENT_ID = int(os.environ.get("AGENT_ID", "1"))
ACTION_TYPE = os.environ.get("ACTION_TYPE", "crm.email.send")
PROMPT = os.environ.get("PROMPT", "Fasse den aktuellen Vorgang in zwei Sätzen zusammen.")


def run_llm() -> tuple[str, int, int]:
    """Call Claude and return (text, latency_ms, total_tokens)."""
    import anthropic

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    start = time.monotonic()
    msg = client.messages.create(
        model=MODEL, max_tokens=512, messages=[{"role": "user", "content": PROMPT}]
    )
    latency_ms = int((time.monotonic() - start) * 1000)
    text = "".join(block.text for block in msg.content if block.type == "text")
    tokens = msg.usage.input_tokens + msg.usage.output_tokens
    return text, latency_ms, tokens


def main() -> None:
    if not ACP_API_KEY:
        raise SystemExit("ACP_API_KEY fehlt.")

    acp = AgentControlPlane(CONTROL_PLANE_URL, ACP_API_KEY)

    print(f"▶ Agent {AGENT_ID} prüft Aktion '{ACTION_TYPE}' …")
    decision = acp.policy_check(agent_id=AGENT_ID, action_type=ACTION_TYPE,
                                requested_by="python-agent")
    print(f"  Entscheidung: {decision.decision}"
          + (f" (Policy: {decision.policy_name})" if decision.policy_name else ""))

    if decision.forbidden:
        print(f"✖ Verboten: {decision.reason or 'durch Policy gesperrt'}. Abbruch.")
        return

    if decision.needs_approval:
        print(f"⏸ Freigabe nötig (Approval #{decision.approval_id}). Warte auf Entscheidung …")
        try:
            acp.wait_for_approval(decision.approval_id)
            print("  ✓ Freigegeben.")
        except ApprovalRejected as exc:
            print(f"✖ {exc}. Abbruch.")
            return

    if not ANTHROPIC_API_KEY:
        print("  (ANTHROPIC_API_KEY fehlt – überspringe LLM-Aufruf, melde nur das Event.)")
        acp.ingest_audit(agent_id=AGENT_ID, category="Operations",
                         title=f"Aktion ausgeführt: {ACTION_TYPE}", detail="Trockenlauf.")
        return

    print("  ▶ Führe LLM-Aufruf aus …")
    text, latency_ms, tokens = run_llm()
    print(f"  ✓ Antwort ({tokens} Tokens, {latency_ms} ms): {text[:160]}…")

    acp.ingest_audit(agent_id=AGENT_ID, category="Operations",
                     title=f"Aktion ausgeführt: {ACTION_TYPE}", detail=text[:500])
    acp.ingest_metric(agent_id=AGENT_ID, latency_ms=latency_ms, error_rate=0.0,
                      api_cost_usd=round(tokens * 0.000003, 4), token_usage=tokens)
    print("✔ Fertig – Audit + Metrik gemeldet.")


if __name__ == "__main__":
    main()
