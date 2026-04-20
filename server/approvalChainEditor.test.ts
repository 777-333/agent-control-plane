import { describe, expect, it } from "vitest";
import {
  createDefaultSimulationSignals,
  createEmptyApprovalStageDraft,
  moveStageToDropZone,
  reorderApprovalChainStages,
  simulateApprovalChain,
  simulateApprovalTimeline,
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
      branchField: "riskLevel",
      branchOperator: "always",
      branchValue: "",
      quorumMode: "all",
      quorumTarget: 1,
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
      branchField: "riskLevel",
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

  it("simulates reachable and skipped stages for the preview panel", () => {
    const signals = createDefaultSimulationSignals();
    const stages = [
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Initial Review",
      },
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Parallel Finance",
        stageMode: "parallel" as const,
        laneKey: "parallel-a" as const,
        quorumMode: "majority" as const,
        quorumTarget: 2,
      },
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Executive Branch",
        stageMode: "branch" as const,
        laneKey: "branch-a" as const,
        branchSourceStageOrder: 2,
        branchField: "riskLevel" as const,
        branchOperator: "equals" as const,
        branchValue: "critical",
      },
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Skipped Branch",
        stageMode: "branch" as const,
        laneKey: "branch-b" as const,
        branchSourceStageOrder: 2,
        branchField: "requestedBy" as const,
        branchOperator: "equals" as const,
        branchValue: "Unknown",
      },
    ];

    const preview = simulateApprovalChain(stages, signals);

    expect(preview[1]).toMatchObject({ reachable: true, quorumLabel: "Mehrheit (2)" });
    expect(preview[2]).toMatchObject({ reachable: true, branchMatched: true });
    expect(preview[3]).toMatchObject({ reachable: false, branchMatched: false });
  });

  it("builds a timeline with SLA and escalation timestamps", () => {
    const signals = createDefaultSimulationSignals();
    const stages = [
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Finance Review",
        slaMinutes: 30,
        escalationAfterMinutes: 45,
      },
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Parallel Security",
        stageMode: "parallel" as const,
        laneKey: "parallel-a" as const,
        slaMinutes: 20,
        escalationAfterMinutes: 35,
      },
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Executive Escalation",
        stageMode: "branch" as const,
        laneKey: "branch-a" as const,
        branchSourceStageOrder: 2,
        branchField: "riskLevel" as const,
        branchOperator: "equals" as const,
        branchValue: "critical",
        slaMinutes: 15,
        escalationAfterMinutes: 25,
      },
    ];

    const timeline = simulateApprovalTimeline(stages, signals);

    expect(timeline[0]).toMatchObject({ startMinute: 0, slaDeadlineMinute: 30, escalationMinute: 45, endMinute: 45 });
    expect(timeline[1]).toMatchObject({ startMinute: 45, slaDeadlineMinute: 65, escalationMinute: 80, endMinute: 80 });
    expect(timeline[2]).toMatchObject({ reachable: true, startMinute: 80, slaDeadlineMinute: 95, escalationMinute: 105, endMinute: 105 });
  });
});
