export type ApprovalStageMode = "serial" | "parallel" | "branch";
export type ApprovalBranchOperator = "always" | "equals" | "contains" | "greater_than" | "less_than";
export type ApprovalLaneKey = "main" | "parallel-a" | "parallel-b" | "branch-a" | "branch-b";

export type ApprovalChainStageDraft = {
  stageName: string;
  requiredRole: string;
  defaultApproverLabel: string;
  stageMode: ApprovalStageMode;
  laneKey: ApprovalLaneKey;
  branchSourceStageOrder: number | null;
  branchLabel: string;
  branchOperator: ApprovalBranchOperator;
  branchValue: string;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTargetLabel: string;
};

export type ApprovalDropZone = {
  stageMode: ApprovalStageMode;
  laneKey: ApprovalLaneKey;
  branchSourceStageOrder?: number | null;
  branchLabel?: string;
};

export function createEmptyApprovalStageDraft(): ApprovalChainStageDraft {
  return {
    stageName: "",
    requiredRole: "approver",
    defaultApproverLabel: "",
    stageMode: "serial",
    laneKey: "main",
    branchSourceStageOrder: null,
    branchLabel: "",
    branchOperator: "always",
    branchValue: "",
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

export function moveStageToDropZone(
  stages: ApprovalChainStageDraft[],
  stageIndex: number,
  zone: ApprovalDropZone,
): ApprovalChainStageDraft[] {
  if (stageIndex < 0 || stageIndex >= stages.length) {
    return [...stages];
  }

  return stages.map((stage, index) => {
    if (index !== stageIndex) {
      return stage;
    }

    return {
      ...stage,
      stageMode: zone.stageMode,
      laneKey: zone.laneKey,
      branchSourceStageOrder: zone.stageMode === "branch" ? (zone.branchSourceStageOrder ?? null) : null,
      branchLabel: zone.stageMode === "branch" ? (zone.branchLabel ?? stage.branchLabel) : "",
      branchOperator: zone.stageMode === "branch" ? stage.branchOperator : "always",
      branchValue: zone.stageMode === "branch" ? stage.branchValue : "",
    };
  });
}

export function getLaneLabel(laneKey: ApprovalLaneKey): string {
  switch (laneKey) {
    case "main":
      return "Linearer Pfad";
    case "parallel-a":
      return "Paralleler Pfad A";
    case "parallel-b":
      return "Paralleler Pfad B";
    case "branch-a":
      return "Verzweigung A";
    case "branch-b":
      return "Verzweigung B";
    default:
      return laneKey;
  }
}
