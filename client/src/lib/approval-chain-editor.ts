export type ApprovalChainStageDraft = {
  stageName: string;
  requiredRole: string;
  defaultApproverLabel: string;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTargetLabel: string;
};

export function createEmptyApprovalStageDraft(): ApprovalChainStageDraft {
  return {
    stageName: "",
    requiredRole: "approver",
    defaultApproverLabel: "",
    slaMinutes: 60,
    escalationAfterMinutes: 90,
    escalationTargetLabel: "",
  };
}

export function reorderApprovalChainStages<T>(stages: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return [...stages];
  }

  if (fromIndex < 0 || toIndex < 0 || fromIndex >= stages.length || toIndex >= stages.length) {
    return [...stages];
  }

  const next = [...stages];
  const [moved] = next.splice(fromIndex, 1);
  if (moved === undefined) {
    return [...stages];
  }
  next.splice(toIndex, 0, moved);
  return next;
}
