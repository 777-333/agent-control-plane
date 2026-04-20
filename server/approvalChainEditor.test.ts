import { describe, expect, it } from "vitest";
import {
  createEmptyApprovalStageDraft,
  moveStageToDropZone,
  reorderApprovalChainStages,
} from "../client/src/lib/approval-chain-editor";

describe("approval chain drag-and-drop helpers", () => {
  it("creates a consistent empty stage draft for the visual editor", () => {
    expect(createEmptyApprovalStageDraft()).toEqual({
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
    });
  });

  it("reorders stages when a stage card is dragged to a different position", () => {
    const stages = [
      { stageName: "Finance Review" },
      { stageName: "CFO Approval" },
      { stageName: "Legal Confirmation" },
    ];

    const reordered = reorderApprovalChainStages(stages, 2, 0);

    expect(reordered.map(stage => stage.stageName)).toEqual([
      "Legal Confirmation",
      "Finance Review",
      "CFO Approval",
    ]);
  });

  it("moves a stage into a parallel drop zone without changing the other stages", () => {
    const stages = [
      createEmptyApprovalStageDraft(),
      createEmptyApprovalStageDraft(),
    ].map((stage, index) => ({
      ...stage,
      stageName: `Stage ${index + 1}`,
    }));

    const updated = moveStageToDropZone(stages, 1, {
      stageMode: "parallel",
      laneKey: "parallel-a",
    });

    expect(updated[1]).toMatchObject({
      stageMode: "parallel",
      laneKey: "parallel-a",
      branchSourceStageOrder: null,
      branchLabel: "",
    });
    expect(updated[0]).toEqual(stages[0]);
  });

  it("moves a stage into a conditional branch drop zone and keeps branch metadata", () => {
    const stages = [createEmptyApprovalStageDraft()].map(stage => ({
      ...stage,
      stageName: "Escalation Review",
      branchOperator: "contains" as const,
      branchValue: "ERP",
    }));

    const updated = moveStageToDropZone(stages, 0, {
      stageMode: "branch",
      laneKey: "branch-a",
      branchSourceStageOrder: 2,
      branchLabel: "Nur bei ERP-Zahlungen",
    });

    expect(updated[0]).toMatchObject({
      stageMode: "branch",
      laneKey: "branch-a",
      branchSourceStageOrder: 2,
      branchLabel: "Nur bei ERP-Zahlungen",
      branchOperator: "contains",
      branchValue: "ERP",
    });
  });

  it("returns a stable copy when indices are invalid", () => {
    const stages = [{ stageName: "Only Stage" }];

    const result = reorderApprovalChainStages(stages, -1, 2);

    expect(result).toEqual(stages);
    expect(result).not.toBe(stages);
  });
});
