import { describe, expect, it } from "vitest";
import { createEmptyApprovalStageDraft, reorderApprovalChainStages } from "./approval-chain-editor";

describe("approval-chain-editor helpers", () => {
  it("creates a consistent empty stage draft", () => {
    expect(createEmptyApprovalStageDraft()).toEqual({
      stageName: "",
      requiredRole: "approver",
      defaultApproverLabel: "",
      slaMinutes: 60,
      escalationAfterMinutes: 90,
      escalationTargetLabel: "",
    });
  });

  it("reorders stages when a card is dragged to a new position", () => {
    const stages = [
      { stageName: "Stage 1" },
      { stageName: "Stage 2" },
      { stageName: "Stage 3" },
    ];

    const result = reorderApprovalChainStages(stages, 0, 2);

    expect(result.map(stage => stage.stageName)).toEqual(["Stage 2", "Stage 3", "Stage 1"]);
  });

  it("returns a stable copy when indices are invalid", () => {
    const stages = [{ stageName: "Only Stage" }];

    const result = reorderApprovalChainStages(stages, -1, 4);

    expect(result).toEqual(stages);
    expect(result).not.toBe(stages);
  });
});
