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

export type ApprovalCalendarRiskLevel = "low" | "medium" | "high" | "critical";

export type ApprovalCalendarPreset = {
  id: string;
  label: string;
  description: string;
  roleKey: string;
  roleLabel: string;
  roleAliases: string[];
  riskLevel: ApprovalCalendarRiskLevel;
  defaultSlaMinutes: number;
  defaultEscalationMinutes: number;
  calendar: ApprovalBusinessCalendar;
  signalOverrides: Partial<ApprovalSimulationSignals>;
};

export type ApprovalChainCalendarProfile = ApprovalBusinessCalendar & {
  presetId: string;
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

export function createChainCalendarProfileFromPreset(preset: ApprovalCalendarPreset): ApprovalChainCalendarProfile {
  return {
    presetId: preset.id,
    businessDayStartHour: preset.calendar.businessDayStartHour,
    businessDayEndHour: preset.calendar.businessDayEndHour,
    workingDays: [...preset.calendar.workingDays],
    holidayDates: [...preset.calendar.holidayDates],
  };
}

export function createRoleBasedCalendarPresetLibrary(): ApprovalCalendarPreset[] {
  return [
    {
      id: "finance-controller-critical",
      label: "Finance Controller · Kritisch",
      description: "Strenges Werktagsfenster für kritische Finanzfreigaben mit kurzer Eskalationskette.",
      roleKey: "finance",
      roleLabel: "Finance Controller",
      roleAliases: ["finance", "finops", "controller", "finance controller", "finance-approver"],
      riskLevel: "critical",
      defaultSlaMinutes: 30,
      defaultEscalationMinutes: 45,
      calendar: {
        businessDayStartHour: 8,
        businessDayEndHour: 18,
        workingDays: [1, 2, 3, 4, 5],
        holidayDates: ["2026-01-01", "2026-12-25", "2026-12-26"],
      },
      signalOverrides: {
        riskLevel: "critical",
        requestedBy: "Finance Sentinel",
        chainName: "Finance Critical Chain",
      },
    },
    {
      id: "security-operations-high",
      label: "Security Operations · Hoch",
      description: "Nahezu durchgängiges Reaktionsfenster für Sicherheitsereignisse mit hoher Priorität.",
      roleKey: "security",
      roleLabel: "Security Operations",
      roleAliases: ["security", "soc", "secops", "security operations", "security reviewer"],
      riskLevel: "high",
      defaultSlaMinutes: 20,
      defaultEscalationMinutes: 35,
      calendar: {
        businessDayStartHour: 0,
        businessDayEndHour: 24,
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        holidayDates: [],
      },
      signalOverrides: {
        riskLevel: "high",
        requestedBy: "Security Runtime Monitor",
        chainName: "Security High-Risk Chain",
      },
    },
    {
      id: "legal-compliance-medium",
      label: "Legal & Compliance · Mittel",
      description: "Konservatives Werktagsfenster für Prüfungen mit regulatorischem oder vertraglichem Bezug.",
      roleKey: "legal",
      roleLabel: "Legal & Compliance",
      roleAliases: ["legal", "compliance", "legal counsel", "compliance officer"],
      riskLevel: "medium",
      defaultSlaMinutes: 240,
      defaultEscalationMinutes: 480,
      calendar: {
        businessDayStartHour: 9,
        businessDayEndHour: 17,
        workingDays: [1, 2, 3, 4, 5],
        holidayDates: ["2026-01-01", "2026-05-01", "2026-12-25"],
      },
      signalOverrides: {
        riskLevel: "medium",
        requestedBy: "Compliance Review Desk",
        chainName: "Legal Review Chain",
      },
    },
    {
      id: "executive-board-high",
      label: "Executive Board · Hoch",
      description: "Vorstandsorientiertes Freigabefenster mit planbaren Geschäftszeiten und klaren Eskalationsmarken.",
      roleKey: "executive",
      roleLabel: "Executive Board",
      roleAliases: ["executive", "board", "cfo", "cio", "cto", "vp", "director"],
      riskLevel: "high",
      defaultSlaMinutes: 120,
      defaultEscalationMinutes: 180,
      calendar: {
        businessDayStartHour: 9,
        businessDayEndHour: 19,
        workingDays: [1, 2, 3, 4, 5],
        holidayDates: ["2026-01-01", "2026-12-24", "2026-12-25", "2026-12-31"],
      },
      signalOverrides: {
        riskLevel: "high",
        requestedBy: "Executive Control Tower",
        chainName: "Executive Escalation Chain",
      },
    },
    {
      id: "operations-on-call-critical",
      label: "Operations On-Call · Kritisch",
      description: "24/7-Bereitschaftskalender für betriebliche Zwischenfälle und sofortige Eskalation bei kritischen Signalen.",
      roleKey: "operations",
      roleLabel: "Operations On-Call",
      roleAliases: ["operations", "ops", "site reliability", "sre", "platform"],
      riskLevel: "critical",
      defaultSlaMinutes: 10,
      defaultEscalationMinutes: 20,
      calendar: {
        businessDayStartHour: 0,
        businessDayEndHour: 24,
        workingDays: [0, 1, 2, 3, 4, 5, 6],
        holidayDates: [],
      },
      signalOverrides: {
        riskLevel: "critical",
        requestedBy: "Ops Incident Router",
        chainName: "Ops Incident Chain",
      },
    },
  ];
}

function normalizeRoleToken(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function stageMatchesPresetRole(stage: ApprovalChainStageDraft, preset: ApprovalCalendarPreset): boolean {
  const stageRole = normalizeRoleToken(stage.requiredRole);
  return preset.roleAliases.some(alias => stageRole.includes(normalizeRoleToken(alias)));
}

export function createDefaultChainCalendarProfile(): ApprovalChainCalendarProfile {
  const preset = createRoleBasedCalendarPresetLibrary()[0];
  return preset ? createChainCalendarProfileFromPreset(preset) : {
    presetId: "custom",
    ...createDefaultBusinessCalendar(),
  };
}

export function getRoleBasedCalendarPreset(presetId: string): ApprovalCalendarPreset | undefined {
  return createRoleBasedCalendarPresetLibrary().find(preset => preset.id === presetId);
}

export function countStagesMatchingCalendarPreset(stages: ApprovalChainStageDraft[], preset: ApprovalCalendarPreset): number {
  return stages.filter(stage => stageMatchesPresetRole(stage, preset)).length;
}

export function applyCalendarPresetToStages(stages: ApprovalChainStageDraft[], preset: ApprovalCalendarPreset): ApprovalChainStageDraft[] {
  return stages.map(stage => {
    if (!stageMatchesPresetRole(stage, preset)) {
      return stage;
    }

    return {
      ...stage,
      slaMinutes: preset.defaultSlaMinutes,
      escalationAfterMinutes: preset.defaultEscalationMinutes,
    };
  });
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
