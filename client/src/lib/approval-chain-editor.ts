export type ApprovalStageMode = "serial" | "parallel" | "branch";
export type ApprovalBranchOperator = "always" | "equals" | "contains" | "greater_than" | "less_than";
export type ApprovalBranchField = "riskLevel" | "requestedBy" | "agentName" | "title" | "summary" | "chainName" | "escalationStatus";
export type ApprovalQuorumMode = "all" | "majority" | "minimum_count" | "distinct_roles";
export type ApprovalLaneKey = "main" | "parallel-a" | "parallel-b" | "branch-a" | "branch-b";

export type ApprovalChainStageDraft = {
  stageName: string;
  requiredRole: string;
  defaultApproverLabel: string;
  stageMode: ApprovalStageMode;
  laneKey: ApprovalLaneKey;
  branchSourceStageOrder: number | null;
  branchLabel: string;
  branchField: ApprovalBranchField;
  branchOperator: ApprovalBranchOperator;
  branchValue: string;
  quorumMode: ApprovalQuorumMode;
  quorumTarget: number;
  slaMinutes: number;
  escalationAfterMinutes: number;
  escalationTargetLabel: string;
};

export type ApprovalDropZone = {
  stageMode: ApprovalStageMode;
  laneKey: ApprovalLaneKey;
  branchSourceStageOrder?: number | null;
  branchLabel?: string;
  branchField?: ApprovalBranchField;
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
    branchField: "riskLevel",
    branchOperator: "always",
    branchValue: "",
    quorumMode: "all",
    quorumTarget: 1,
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
      branchField: zone.stageMode === "branch" ? (zone.branchField ?? stage.branchField) : "riskLevel",
      branchOperator: zone.stageMode === "branch" ? stage.branchOperator : "always",
      branchValue: zone.stageMode === "branch" ? stage.branchValue : "",
      quorumMode: zone.stageMode === "parallel" ? stage.quorumMode : "all",
      quorumTarget: zone.stageMode === "parallel" ? stage.quorumTarget : 1,
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

export type ApprovalSimulationSignals = Record<ApprovalBranchField, string>;

export type ApprovalSimulationEntry = {
  order: number;
  stageName: string;
  laneKey: ApprovalLaneKey;
  stageMode: ApprovalStageMode;
  reachable: boolean;
  branchMatched: boolean | null;
  reason: string;
  quorumLabel: string | null;
};

export type ApprovalTimelineEntry = ApprovalSimulationEntry & {
  startMinute: number;
  slaDeadlineMinute: number;
  escalationMinute: number;
  endMinute: number;
  durationMinute: number;
  startBusinessMinute: number;
  endBusinessMinute: number;
  slaDeadlineBusinessMinute: number;
  escalationBusinessMinute: number;
  startDayOffset: number;
  endDayOffset: number;
  slaDeadlineDayOffset: number;
  escalationDayOffset: number;
};

export type ApprovalBusinessCalendar = {
  businessDayStartHour: number;
  businessDayEndHour: number;
  workingDays: number[];
  holidayDates: string[];
};

export function createDefaultSimulationSignals(): ApprovalSimulationSignals {
  return {
    riskLevel: "critical",
    requestedBy: "Finance Sentinel",
    agentName: "Finance Sentinel",
    title: "ERP-Zahlung über 18.400 USD",
    summary: "Kritische Auszahlung mit ERP- und Finance-Scope.",
    chainName: "Simulation",
    escalationStatus: "pending",
  };
}

export function createDefaultBusinessCalendar(): ApprovalBusinessCalendar {
  return {
    businessDayStartHour: 9,
    businessDayEndHour: 17,
    workingDays: [1, 2, 3, 4, 5],
    holidayDates: ["2026-01-01", "2026-12-25"],
  };
}

function matchesBranchCondition(stage: ApprovalChainStageDraft, signals: ApprovalSimulationSignals): boolean {
  const actualValue = `${signals[stage.branchField] ?? ""}`.toLowerCase();
  const expectedValue = `${stage.branchValue ?? ""}`.toLowerCase();

  switch (stage.branchOperator) {
    case "always":
      return true;
    case "equals":
      return actualValue === expectedValue;
    case "contains":
      return actualValue.includes(expectedValue);
    case "greater_than":
      return Number(actualValue) > Number(expectedValue);
    case "less_than":
      return Number(actualValue) < Number(expectedValue);
    default:
      return false;
  }
}

function describeQuorum(stage: ApprovalChainStageDraft): string | null {
  if (stage.stageMode !== "parallel") {
    return null;
  }

  switch (stage.quorumMode) {
    case "majority":
      return `Mehrheit (${stage.quorumTarget})`;
    case "minimum_count":
      return `Mindestens ${stage.quorumTarget}`;
    case "distinct_roles":
      return `Rollen-Quorum (${stage.quorumTarget})`;
    case "all":
    default:
      return "Alle Freigaben";
  }
}

function normalizeCalendar(calendar?: ApprovalBusinessCalendar): ApprovalBusinessCalendar {
  const fallback = createDefaultBusinessCalendar();
  const workingDays = calendar?.workingDays?.length ? [...calendar.workingDays] : fallback.workingDays;
  const businessDayStartHour = calendar?.businessDayStartHour ?? fallback.businessDayStartHour;
  const businessDayEndHour = calendar?.businessDayEndHour ?? fallback.businessDayEndHour;

  return {
    businessDayStartHour,
    businessDayEndHour: Math.max(businessDayEndHour, businessDayStartHour + 1),
    workingDays,
    holidayDates: calendar?.holidayDates?.filter(Boolean) ?? fallback.holidayDates,
  };
}

function getBusinessMinutesPerDay(calendar: ApprovalBusinessCalendar): number {
  return Math.max((calendar.businessDayEndHour - calendar.businessDayStartHour) * 60, 60);
}

function getCalendarDate(dayIndex: number): Date {
  const date = new Date(Date.UTC(2026, 0, 1));
  date.setUTCDate(date.getUTCDate() + dayIndex);
  return date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(dayIndex: number, calendar: ApprovalBusinessCalendar): boolean {
  const date = getCalendarDate(dayIndex);
  const weekday = date.getUTCDay();
  const isoDate = toIsoDate(date);
  return calendar.workingDays.includes(weekday) && !calendar.holidayDates.includes(isoDate);
}

function businessToAbsoluteMinute(businessMinute: number, calendar: ApprovalBusinessCalendar): number {
  const safeBusinessMinute = Math.max(businessMinute, 0);
  const minutesPerDay = getBusinessMinutesPerDay(calendar);
  let remaining = safeBusinessMinute;
  let dayIndex = 0;

  while (true) {
    if (!isBusinessDay(dayIndex, calendar)) {
      dayIndex += 1;
      continue;
    }

    if (remaining <= minutesPerDay) {
      return dayIndex * 1440 + calendar.businessDayStartHour * 60 + remaining;
    }

    remaining -= minutesPerDay;
    dayIndex += 1;
  }
}

function toDayOffset(absoluteMinute: number): number {
  return Math.floor(absoluteMinute / 1440);
}

export function simulateApprovalChain(
  stages: ApprovalChainStageDraft[],
  signals: ApprovalSimulationSignals,
): ApprovalSimulationEntry[] {
  let lastNonBranchOrder = 0;

  return stages.map((stage, index) => {
    const order = index + 1;
    let reachable = true;
    let branchMatched: boolean | null = null;
    let reason = stage.stageMode === "parallel"
      ? `Aktiv im ${getLaneLabel(stage.laneKey)} mit ${describeQuorum(stage)}`
      : `Teil des ${getLaneLabel(stage.laneKey)}`;

    if (stage.stageMode === "branch") {
      const sourceOrder = stage.branchSourceStageOrder ?? lastNonBranchOrder;
      branchMatched = matchesBranchCondition(stage, signals);
      reachable = branchMatched;
      reason = branchMatched
        ? `Aktiviert über ${stage.branchField} ${stage.branchOperator} ${stage.branchValue || "…"} ab Stufe ${sourceOrder}`
        : `Übersprungen, weil ${stage.branchField} ${stage.branchOperator} ${stage.branchValue || "…"} nicht erfüllt ist`;
    }

    if (stage.stageMode !== "branch") {
      lastNonBranchOrder = order;
    }

    return {
      order,
      stageName: stage.stageName || `Stufe ${order}`,
      laneKey: stage.laneKey,
      stageMode: stage.stageMode,
      reachable,
      branchMatched,
      reason,
      quorumLabel: describeQuorum(stage),
    };
  });
}

export function simulateApprovalTimeline(
  stages: ApprovalChainStageDraft[],
  signals: ApprovalSimulationSignals,
  calendarInput?: ApprovalBusinessCalendar,
): ApprovalTimelineEntry[] {
  const preview = simulateApprovalChain(stages, signals);
  const calendar = normalizeCalendar(calendarInput);
  const laneEndMinutes: Partial<Record<ApprovalLaneKey, number>> = {};
  let mainClock = 0;

  return preview.map((entry, index) => {
    const stage = stages[index];
    const baseStart = stage.stageMode === "parallel"
      ? (laneEndMinutes[stage.laneKey] ?? mainClock)
      : mainClock;
    const durationMinute = Math.max(stage.slaMinutes, stage.escalationAfterMinutes, 1);
    const slaDeadlineMinute = baseStart + Math.max(stage.slaMinutes, 1);
    const escalationMinute = baseStart + Math.max(stage.escalationAfterMinutes, 1);
    const endMinute = baseStart + durationMinute;
    const startAbsoluteMinute = businessToAbsoluteMinute(baseStart, calendar);
    const slaAbsoluteMinute = businessToAbsoluteMinute(slaDeadlineMinute, calendar);
    const escalationAbsoluteMinute = businessToAbsoluteMinute(escalationMinute, calendar);
    const endAbsoluteMinute = businessToAbsoluteMinute(endMinute, calendar);

    if (entry.reachable) {
      if (stage.stageMode === "parallel") {
        laneEndMinutes[stage.laneKey] = endMinute;
        mainClock = Math.max(mainClock, endMinute);
      } else {
        mainClock = endMinute;
      }
    }

    return {
      ...entry,
      startMinute: startAbsoluteMinute,
      slaDeadlineMinute: slaAbsoluteMinute,
      escalationMinute: escalationAbsoluteMinute,
      endMinute: endAbsoluteMinute,
      durationMinute,
      startBusinessMinute: baseStart,
      slaDeadlineBusinessMinute: slaDeadlineMinute,
      escalationBusinessMinute: escalationMinute,
      endBusinessMinute: endMinute,
      startDayOffset: toDayOffset(startAbsoluteMinute),
      slaDeadlineDayOffset: toDayOffset(slaAbsoluteMinute),
      escalationDayOffset: toDayOffset(escalationAbsoluteMinute),
      endDayOffset: toDayOffset(endAbsoluteMinute),
      reason: entry.reachable
        ? `${entry.reason} · SLA bis Geschäftstag ${toDayOffset(slaAbsoluteMinute)} bei T+${slaDeadlineMinute} Arbeitsmin, Eskalation ab Geschäftstag ${toDayOffset(escalationAbsoluteMinute)} bei T+${escalationMinute} Arbeitsmin.`
        : `${entry.reason} · Kein Zeitfenster aktiv, weil dieser Pfad nicht erreicht wird.`,
    };
  });
}
