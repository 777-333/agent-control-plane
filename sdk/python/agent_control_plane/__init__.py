"""Agent Control Plane – Python SDK.

Thin client for connecting an external agent runtime to the Agent Control
Plane: ask before acting (policy check), wait for human approval, and report
events back.
"""

from .client import AgentControlPlane, ApprovalRejected, ControlPlaneError, PolicyDecision

__all__ = [
    "AgentControlPlane",
    "PolicyDecision",
    "ApprovalRejected",
    "ControlPlaneError",
]

__version__ = "0.1.0"
