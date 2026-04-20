import { describe, expect, it } from "vitest";
import { createEmptyApprovalStageDraft, reorderApprovalChainStages } from "../client/src/lib/approval-chain-editor";

describe("approval chain drag-and-drop helpers", () => {
  it("creates a consistent empty stage draft for the visual editor", () => {
    expect(createEmptyApprovalStageDraft()).toEqual({
      stageName: "",
      requiredRole: "approver",
      defaultApproverLabel: "",
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

  it("returns a stable copy when indices are invalid", () => {
    const stages = [{ stageName: "Only Stage" }];

    const result = reorderApprovalChainStages(stages, -1, 2);

    expect(result).toEqual(stages);
    expect(result).not.toBe(stages);
  });
});
