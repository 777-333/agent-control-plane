import { describe, expect, it } from "vitest";
import {
  createDefaultBusinessCalendar,
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

  it("builds a business-calendar-aware timeline with SLA and escalation timestamps", () => {
    const signals = createDefaultSimulationSignals();
    const calendar = createDefaultBusinessCalendar();
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

    const timeline = simulateApprovalTimeline(stages, signals, calendar);

    expect(timeline[0]).toMatchObject({
      startMinute: 1980,
      slaDeadlineMinute: 2010,
      escalationMinute: 2025,
      endMinute: 2025,
      startBusinessMinute: 0,
      slaDeadlineBusinessMinute: 30,
      escalationBusinessMinute: 45,
      endBusinessMinute: 45,
      startDayOffset: 1,
      slaDeadlineDayOffset: 1,
      escalationDayOffset: 1,
      endDayOffset: 1,
    });
    expect(timeline[1]).toMatchObject({
      startMinute: 2025,
      slaDeadlineMinute: 2045,
      escalationMinute: 2060,
      endMinute: 2060,
      startBusinessMinute: 45,
      slaDeadlineBusinessMinute: 65,
      escalationBusinessMinute: 80,
      endBusinessMinute: 80,
      startDayOffset: 1,
      slaDeadlineDayOffset: 1,
      escalationDayOffset: 1,
      endDayOffset: 1,
    });
    expect(timeline[2]).toMatchObject({
      reachable: true,
      startMinute: 2060,
      slaDeadlineMinute: 2075,
      escalationMinute: 2085,
      endMinute: 2085,
      startBusinessMinute: 80,
      slaDeadlineBusinessMinute: 95,
      escalationBusinessMinute: 105,
      endBusinessMinute: 105,
      startDayOffset: 1,
      slaDeadlineDayOffset: 1,
      escalationDayOffset: 1,
      endDayOffset: 1,
    });
  });

  it("skips weekends when business minutes span multiple workdays", () => {
    const signals = createDefaultSimulationSignals();
    const calendar = createDefaultBusinessCalendar();
    const stages = [
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Long Review",
        slaMinutes: 500,
        escalationAfterMinutes: 540,
      },
    ];

    const timeline = simulateApprovalTimeline(stages, signals, calendar);

    expect(timeline[0]).toMatchObject({
      startMinute: 1980,
      slaDeadlineMinute: 6320,
      escalationMinute: 6360,
      endMinute: 6360,
      startDayOffset: 1,
      slaDeadlineDayOffset: 4,
      escalationDayOffset: 4,
      endDayOffset: 4,
      startBusinessMinute: 0,
      slaDeadlineBusinessMinute: 500,
      escalationBusinessMinute: 540,
      endBusinessMinute: 540,
    });
  });

  it("respects configured holidays in the business calendar", () => {
    const signals = createDefaultSimulationSignals();
    const calendar = {
      ...createDefaultBusinessCalendar(),
      holidayDates: ["2026-01-01", "2026-01-05"],
    };
    const stages = [
      {
        ...createEmptyApprovalStageDraft(),
        stageName: "Holiday Gate",
        slaMinutes: 500,
        escalationAfterMinutes: 540,
      },
    ];

    const timeline = simulateApprovalTimeline(stages, signals, calendar);

    expect(timeline[0]).toMatchObject({
      startMinute: 1980,
      slaDeadlineMinute: 7760,
      escalationMinute: 7800,
      endMinute: 7800,
      startDayOffset: 1,
      slaDeadlineDayOffset: 5,
      escalationDayOffset: 5,
      endDayOffset: 5,
      startBusinessMinute: 0,
      slaDeadlineBusinessMinute: 500,
      escalationBusinessMinute: 540,
      endBusinessMinute: 540,
    });
  });
});
