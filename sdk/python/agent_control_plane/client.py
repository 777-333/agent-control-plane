"""Agent Control Plane client.

Usage::

    from agent_control_plane import AgentControlPlane

    acp = AgentControlPlane("https://acc.3333.tools", "acp_your_api_key")

    decision = acp.policy_check(agent_id=1, action_type="erp.payment.execute")
    if decision.allowed:
        ...  # run the action
        acp.ingest_audit(agent_id=1, category="ERP", title="Zahlung ausgeführt",
                         detail="...")
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


class ControlPlaneError(RuntimeError):
    """Raised when the control plane returns an error response."""


class ApprovalRejected(RuntimeError):
    """Raised when a required human approval was rejected or expired."""


@dataclass
class PolicyDecision:
    decision: str  # "allowed" | "forbidden" | "approval_required"
    policy_name: Optional[str] = None
    approval_id: Optional[int] = None
    reason: Optional[str] = None

    @property
    def allowed(self) -> bool:
        return self.decision == "allowed"

    @property
    def forbidden(self) -> bool:
        return self.decision == "forbidden"

    @property
    def needs_approval(self) -> bool:
        return self.decision == "approval_required"


class AgentControlPlane:
    """Client for the Agent Control Plane governance API."""

    def __init__(self, base_url: str, api_key: str, timeout: float = 15.0) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._session = requests.Session()
        self._session.headers.update(
            {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        )

    # -- internal -----------------------------------------------------------
    def _post(self, path: str, body: Dict[str, Any]) -> Dict[str, Any]:
        resp = self._session.post(f"{self.base_url}{path}", json=body, timeout=self.timeout)
        return self._parse(resp)

    def _get(self, path: str) -> Dict[str, Any]:
        resp = self._session.get(f"{self.base_url}{path}", timeout=self.timeout)
        return self._parse(resp)

    @staticmethod
    def _parse(resp: requests.Response) -> Dict[str, Any]:
        try:
            data = resp.json()
        except ValueError:
            raise ControlPlaneError(f"HTTP {resp.status_code}: {resp.text[:200]}")
        if resp.status_code >= 400 or not data.get("ok", True):
            raise ControlPlaneError(data.get("error") or f"HTTP {resp.status_code}")
        return data

    # -- public API ---------------------------------------------------------
    def policy_check(
        self,
        agent_id: int,
        action_type: str,
        summary: Optional[str] = None,
        risk_level: Optional[str] = None,
        requested_by: Optional[str] = None,
    ) -> PolicyDecision:
        """Ask the control plane whether an action is allowed."""
        data = self._post(
            "/api/policy-check",
            {
                "agentId": agent_id,
                "actionType": action_type,
                "summary": summary,
                "riskLevel": risk_level,
                "requestedBy": requested_by,
            },
        )
        return PolicyDecision(
            decision=data["decision"],
            policy_name=data.get("policyName"),
            approval_id=data.get("approvalId"),
            reason=data.get("reason"),
        )

    def approval_status(self, approval_id: int) -> str:
        """Return the current status of an approval (pending/approved/...)."""
        return self._get(f"/api/approval-status/{approval_id}")["status"]

    def wait_for_approval(
        self, approval_id: int, timeout: float = 300.0, interval: float = 5.0
    ) -> str:
        """Poll until a human resolves the approval. Returns the final status.

        Raises ApprovalRejected if rejected/expired, TimeoutError on timeout.
        """
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            status = self.approval_status(approval_id)
            if status == "approved":
                return status
            if status in ("rejected", "expired"):
                raise ApprovalRejected(f"Approval {approval_id} {status}")
            time.sleep(interval)
        raise TimeoutError(f"Approval {approval_id} not resolved within {timeout}s")

    def ensure_allowed(
        self, agent_id: int, action_type: str, wait: bool = True, **kwargs: Any
    ) -> PolicyDecision:
        """policy_check + (optionally) block until a required approval clears.

        Returns the decision when allowed/approved; raises PermissionError when
        forbidden and ApprovalRejected when an approval is denied.
        """
        decision = self.policy_check(agent_id, action_type, **kwargs)
        if decision.forbidden:
            raise PermissionError(decision.reason or "Action forbidden by policy")
        if decision.needs_approval:
            if not wait:
                return decision
            self.wait_for_approval(decision.approval_id)  # raises on reject/timeout
        return decision

    def ingest_audit(
        self,
        agent_id: int,
        category: str,
        title: str,
        detail: str,
        severity: str = "info",
        actor_ref: str = "agent",
    ) -> Dict[str, Any]:
        return self._post(
            "/api/ingest",
            {
                "type": "audit",
                "payload": {
                    "agentId": agent_id,
                    "category": category,
                    "title": title,
                    "detail": detail,
                    "severity": severity,
                    "actorRef": actor_ref,
                },
            },
        )

    def ingest_metric(
        self,
        agent_id: int,
        latency_ms: int,
        error_rate: float,
        api_cost_usd: float,
        token_usage: int,
    ) -> Dict[str, Any]:
        return self._post(
            "/api/ingest",
            {
                "type": "metric",
                "payload": {
                    "agentId": agent_id,
                    "latencyMs": latency_ms,
                    "errorRate": error_rate,
                    "apiCostUsd": api_cost_usd,
                    "tokenUsage": token_usage,
                },
            },
        )

    def ingest_guardrail(
        self, agent_id: int, trigger_type: str, threshold_label: str, detail: str
    ) -> Dict[str, Any]:
        return self._post(
            "/api/ingest",
            {
                "type": "guardrail",
                "payload": {
                    "agentId": agent_id,
                    "triggerType": trigger_type,
                    "thresholdLabel": threshold_label,
                    "detail": detail,
                },
            },
        )
