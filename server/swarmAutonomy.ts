import { and, eq, inArray } from "drizzle-orm";
import {
  swarmAutonomyEvents,
  swarmAutonomyRuns,
  swarmAutonomySteps,
} from "../drizzle/schema";

export type SwarmAutonomyPriority = "standard" | "urgent" | "critical";
export type SwarmAutonomyRunStatus = "planned" | "running" | "awaiting_approval" | "blocked" | "paused" | "completed" | "cancelled" | "failed";
export type SwarmAutonomyGovernanceStatus = "clear" | "approval_required" | "blocked";
export type SwarmAutonomyStepStatus = "pending" | "in_progress" | "completed" | "blocked" | "awaiting_input" | "skipped" | "cancelled";
export type SwarmAutonomyEventType = "planned" | "delegated" | "feedback" | "governance" | "paused" | "resumed" | "cancelled" | "completed" | "failed";
export type SwarmAutonomyAction = "pause" | "resume" | "cancel" | "approve";

type DatabaseLike = any;

export type SwarmAutonomyMember = {
  id: number;
  name: string;
  swarmRole?: string | null;
  tools: string[];
  model?: string;
};

export type SwarmForAutonomy = {
  id: number;
  name: string;
  mission: string;
  topology: "mesh" | "hub_spoke" | "pipeline";
  coordinationMode: "consensus" | "planner_executor" | "supervisor";
  governance: {
    policyMode: "monitoring" | "approval_required" | "enforced";
    approvalRequired: boolean;
    approverRole: string;
    escalationTarget: string;
    slaMinutes: number;
    escalationAfterMinutes: number;
    reportingWindowHours: number;
  };
  communicationLinks: Array<{
    id: number;
    fromAgentId: number;
    fromAgentName: string;
    toAgentId: number;
    toAgentName: string;
    purpose: string;
    status: "active" | "idle" | "degraded";
    lastMessageAt: number;
  }>;
};

export type SwarmAutonomyRunRecord = {
  id: number;
  swarmId: number;
  objective: string;
  context: string | null;
  priority: SwarmAutonomyPriority;
  status: SwarmAutonomyRunStatus;
  governanceStatus: SwarmAutonomyGovernanceStatus;
  requestedByUserId: number | null;
  requestedByLabel: string;
  requestedByRole: "user" | "admin" | "system";
  summary: string;
  startedAt: number | null;
  completedAt: number | null;
  lastEventAt: number;
  createdAt: number;
  updatedAt: number;
};

export type SwarmAutonomyStepRecord = {
  id: number;
  runId: number;
  swarmId: number;
  assignedAgentId: number;
  assignedAgentName: string;
  title: string;
  instructions: string;
  status: SwarmAutonomyStepStatus;
  sequence: number;
  dependsOnStepId: number | null;
  output: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
};

export type SwarmAutonomyEventRecord = {
  id: number;
  runId: number;
  swarmId: number;
  stepId: number | null;
  eventType: SwarmAutonomyEventType;
  actorLabel: string;
  detail: string;
  createdAt: number;
};

export type SwarmAutonomyRunWithDetails = SwarmAutonomyRunRecord & {
  steps: SwarmAutonomyStepRecord[];
  events: SwarmAutonomyEventRecord[];
};

const fallbackRuns: SwarmAutonomyRunRecord[] = [];
const fallbackSteps: SwarmAutonomyStepRecord[] = [];
const fallbackEvents: SwarmAutonomyEventRecord[] = [];
let nextFallbackRunId = 1;
let nextFallbackStepId = 1;
let nextFallbackEventId = 1;

function toTimestamp(value: Date | number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  return new Date(value).getTime();
}

function mapRunRow(row: typeof swarmAutonomyRuns.$inferSelect): SwarmAutonomyRunRecord {
  return {
    ...row,
    context: row.context ?? null,
    requestedByUserId: row.requestedByUserId ?? null,
    startedAt: toTimestamp(row.startedAt),
    completedAt: toTimestamp(row.completedAt),
    lastEventAt: toTimestamp(row.lastEventAt) ?? Date.now(),
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(row.updatedAt) ?? Date.now(),
  };
}

function mapStepRow(row: typeof swarmAutonomySteps.$inferSelect): SwarmAutonomyStepRecord {
  return {
    ...row,
    dependsOnStepId: row.dependsOnStepId ?? null,
    output: row.output ?? null,
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
    updatedAt: toTimestamp(row.updatedAt) ?? Date.now(),
    completedAt: toTimestamp(row.completedAt),
  };
}

function mapEventRow(row: typeof swarmAutonomyEvents.$inferSelect): SwarmAutonomyEventRecord {
  return {
    ...row,
    stepId: row.stepId ?? null,
    createdAt: toTimestamp(row.createdAt) ?? Date.now(),
  };
}

function nowIso() {
  return new Date();
}

function includesSensitiveObjective(text: string) {
  return /(deploy|production|delete|payment|transfer|credential|secret|kundendaten|personenbezogen|pii|security|incident response)/i.test(text);
}

function pickPlanner(members: SwarmAutonomyMember[]) {
  return members.find(member => /supervisor|lead|planner|coordinator/i.test(member.swarmRole ?? ""))
    ?? members[0]
    ?? null;
}

function pickSpecialist(members: SwarmAutonomyMember[], hint: RegExp, excludeIds: number[] = []) {
  return members.find(member => !excludeIds.includes(member.id) && (hint.test(member.swarmRole ?? "") || member.tools.some(tool => hint.test(tool))))
    ?? members.find(member => !excludeIds.includes(member.id))
    ?? null;
}

function createExecutionSummary(step: SwarmAutonomyStepRecord, swarm: SwarmForAutonomy) {
  if (step.sequence === 1) {
    return `${step.assignedAgentName} hat Ziel, Kontext und Risiken für den Schwarm ${swarm.name} strukturiert und einen delegierbaren Plan erstellt.`;
  }
  if (step.sequence === 2) {
    return `${step.assignedAgentName} hat die operative Teilaufgabe umgesetzt, relevanten Kontext zusammengeführt und statusfähige Zwischenergebnisse zurückgemeldet.`;
  }
  return `${step.assignedAgentName} hat die Ergebnisse konsolidiert, den Kommunikationspfad validiert und einen abschließenden Governance-fähigen Status erzeugt.`;
}

function buildFeedbackBridge(previousStep: SwarmAutonomyStepRecord | undefined) {
  if (!previousStep?.output) {
    return null;
  }

  return `Vorheriges Feedback aus Schritt ${previousStep.sequence} von ${previousStep.assignedAgentName}: ${previousStep.output}`;
}

function buildDelegationDetail(step: SwarmAutonomyStepRecord, previousStep: SwarmAutonomyStepRecord | undefined) {
  const bridge = buildFeedbackBridge(previousStep);
  return bridge
    ? `${step.assignedAgentName} übernimmt Schritt ${step.sequence}: ${step.title}. ${bridge}`
    : `${step.assignedAgentName} übernimmt Schritt ${step.sequence}: ${step.title}`;
}

function buildStepInstructions(step: SwarmAutonomyStepRecord, previousStep: SwarmAutonomyStepRecord | undefined) {
  const bridge = buildFeedbackBridge(previousStep);
  return bridge ? `${step.instructions}\n\n${bridge}` : step.instructions;
}

function findPreviousCompletedStep(steps: SwarmAutonomyStepRecord[], step: SwarmAutonomyStepRecord) {
  return steps
    .filter(candidate => candidate.sequence < step.sequence && candidate.status === "completed" && Boolean(candidate.output))
    .sort((a, b) => b.sequence - a.sequence)[0];
}

function buildStepDrafts(swarm: SwarmForAutonomy, members: SwarmAutonomyMember[], objective: string, context: string | null) {
  const planner = pickPlanner(members);
  const analyst = pickSpecialist(members, /analyst|research|data|knowledge|browser/i, planner ? [planner.id] : []);
  const executor = pickSpecialist(members, /executor|communicator|operator|crm|erp|slides|email|workflow/i, [planner?.id ?? -1, analyst?.id ?? -1]);
  const fallbackMember = members[0];

  const stepMembers = [planner ?? fallbackMember, analyst ?? executor ?? planner ?? fallbackMember, executor ?? analyst ?? planner ?? fallbackMember]
    .filter((member): member is SwarmAutonomyMember => Boolean(member));

  return stepMembers.map((member, index) => ({
    assignedAgentId: member.id,
    assignedAgentName: member.name,
    title: index === 0
      ? `Auftrag analysieren und Teilplan für „${objective.slice(0, 48)}${objective.length > 48 ? "…" : ""}“ erstellen`
      : index === 1
        ? "Operative Teilaufgabe ausführen und Zwischenstand zurückmelden"
        : "Ergebnisse konsolidieren und Governance-konformen Abschluss verfassen",
    instructions: index === 0
      ? `Nutze Mission, Governance und Kommunikationsstruktur des Schwarms, um aus dem Ziel "${objective}" einen belastbaren Teilplan mit Risiken, Abhängigkeiten und benötigten Kommunikationspfaden abzuleiten.${context ? ` Kontext: ${context}` : ""}`
      : index === 1
        ? `Bearbeite den durch den Plan abgeleiteten Arbeitsschritt praktisch. Dokumentiere Annahmen, relevante Belege und den Status so, dass der nächste Agent ohne Medienbruch anschließen kann.`
        : `Konsolidiere den bisherigen Verlauf in einen Abschlussstatus mit Ergebnis, Risiken, offenen Punkten und Governance-Hinweisen. Achte auf SLA, Eskalation und Freigabebedarf.`,
    status: "pending" as SwarmAutonomyStepStatus,
    sequence: index + 1,
  }));
}

async function readRuns(db: DatabaseLike): Promise<SwarmAutonomyRunRecord[]> {
  if (!db) {
    return fallbackRuns.slice().sort((a, b) => b.createdAt - a.createdAt);
  }

  const rows = await db.select().from(swarmAutonomyRuns);
  return rows.map(mapRunRow).sort((a: SwarmAutonomyRunRecord, b: SwarmAutonomyRunRecord) => b.createdAt - a.createdAt);
}

async function readSteps(db: DatabaseLike): Promise<SwarmAutonomyStepRecord[]> {
  if (!db) {
    return fallbackSteps.slice().sort((a, b) => a.sequence - b.sequence);
  }

  const rows = await db.select().from(swarmAutonomySteps);
  return rows.map(mapStepRow).sort((a: SwarmAutonomyStepRecord, b: SwarmAutonomyStepRecord) => a.sequence - b.sequence);
}

async function readEvents(db: DatabaseLike): Promise<SwarmAutonomyEventRecord[]> {
  if (!db) {
    return fallbackEvents.slice().sort((a, b) => a.createdAt - b.createdAt);
  }

  const rows = await db.select().from(swarmAutonomyEvents);
  return rows.map(mapEventRow).sort((a: SwarmAutonomyEventRecord, b: SwarmAutonomyEventRecord) => a.createdAt - b.createdAt);
}

async function insertRun(db: DatabaseLike, values: typeof swarmAutonomyRuns.$inferInsert): Promise<SwarmAutonomyRunRecord> {
  if (!db) {
    const record: SwarmAutonomyRunRecord = {
      id: nextFallbackRunId++,
      swarmId: values.swarmId,
      objective: values.objective,
      context: values.context ?? null,
      priority: values.priority ?? "standard",
      status: values.status ?? "planned",
      governanceStatus: values.governanceStatus ?? "clear",
      requestedByUserId: values.requestedByUserId ?? null,
      requestedByLabel: values.requestedByLabel,
      requestedByRole: values.requestedByRole ?? "user",
      summary: values.summary,
      startedAt: toTimestamp(values.startedAt),
      completedAt: toTimestamp(values.completedAt),
      lastEventAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    fallbackRuns.unshift(record);
    return record;
  }

  const inserted = await db.insert(swarmAutonomyRuns).values(values).returning();
  return mapRunRow(inserted[0]!);
}

async function insertSteps(db: DatabaseLike, values: Array<typeof swarmAutonomySteps.$inferInsert>): Promise<SwarmAutonomyStepRecord[]> {
  if (values.length === 0) return [] as SwarmAutonomyStepRecord[];

  if (!db) {
    const created = values.map(value => ({
      id: nextFallbackStepId++,
      runId: value.runId,
      swarmId: value.swarmId,
      assignedAgentId: value.assignedAgentId,
      assignedAgentName: value.assignedAgentName,
      title: value.title,
      instructions: value.instructions,
      status: value.status ?? "pending",
      sequence: value.sequence,
      dependsOnStepId: value.dependsOnStepId ?? null,
      output: value.output ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: toTimestamp(value.completedAt),
    } satisfies SwarmAutonomyStepRecord));
    fallbackSteps.push(...created);
    return created.sort((a: SwarmAutonomyStepRecord, b: SwarmAutonomyStepRecord) => a.sequence - b.sequence);
  }

  await db.insert(swarmAutonomySteps).values(values);
  const runId = values[0]!.runId;
  const rows = await db.select().from(swarmAutonomySteps).where(eq(swarmAutonomySteps.runId, runId));
  return rows.map(mapStepRow).sort((a: SwarmAutonomyStepRecord, b: SwarmAutonomyStepRecord) => a.sequence - b.sequence);
}

async function insertEvent(db: DatabaseLike, values: typeof swarmAutonomyEvents.$inferInsert): Promise<SwarmAutonomyEventRecord> {
  if (!db) {
    const event: SwarmAutonomyEventRecord = {
      id: nextFallbackEventId++,
      runId: values.runId,
      swarmId: values.swarmId,
      stepId: values.stepId ?? null,
      eventType: values.eventType,
      actorLabel: values.actorLabel,
      detail: values.detail,
      createdAt: Date.now(),
    };
    fallbackEvents.push(event);
    return event;
  }

  const inserted = await db.insert(swarmAutonomyEvents).values(values).returning();
  return mapEventRow(inserted[0]!);
}

async function updateRun(db: DatabaseLike, runId: number, values: Partial<typeof swarmAutonomyRuns.$inferInsert>): Promise<SwarmAutonomyRunRecord> {
  if (!db) {
    const run = fallbackRuns.find(item => item.id === runId);
    if (!run) throw new Error(`Autonomer Schwarmauftrag ${runId} wurde nicht gefunden.`);
    Object.assign(run, values, { updatedAt: Date.now(), lastEventAt: Date.now() });
    return run;
  }

  await db.update(swarmAutonomyRuns).set(values).where(eq(swarmAutonomyRuns.id, runId));
  const rows = await db.select().from(swarmAutonomyRuns).where(eq(swarmAutonomyRuns.id, runId));
  return mapRunRow(rows[0]!);
}

async function updateStep(db: DatabaseLike, stepId: number, values: Partial<typeof swarmAutonomySteps.$inferInsert>): Promise<SwarmAutonomyStepRecord> {
  if (!db) {
    const step = fallbackSteps.find(item => item.id === stepId);
    if (!step) throw new Error(`Autonomer Schritt ${stepId} wurde nicht gefunden.`);
    Object.assign(step, values, { updatedAt: Date.now() });
    return step;
  }

  await db.update(swarmAutonomySteps).set(values).where(eq(swarmAutonomySteps.id, stepId));
  const rows = await db.select().from(swarmAutonomySteps).where(eq(swarmAutonomySteps.id, stepId));
  return mapStepRow(rows[0]!);
}

async function cancelOpenSteps(db: DatabaseLike, runId: number) {
  if (!db) {
    for (const step of fallbackSteps.filter(item => item.runId === runId && !["completed", "cancelled", "skipped"].includes(item.status))) {
      step.status = "cancelled";
      step.updatedAt = Date.now();
    }
    return;
  }

  await db.update(swarmAutonomySteps)
    .set({ status: "cancelled", updatedAt: nowIso() })
    .where(and(eq(swarmAutonomySteps.runId, runId), inArray(swarmAutonomySteps.status, ["pending", "in_progress", "awaiting_input", "blocked"])));
}

async function getRunWithDetails(db: DatabaseLike, runId: number): Promise<SwarmAutonomyRunWithDetails> {
  const [runs, steps, events] = await Promise.all([readRuns(db), readSteps(db), readEvents(db)]);
  const run = runs.find(item => item.id === runId);
  if (!run) {
    throw new Error(`Autonomer Schwarmauftrag ${runId} wurde nicht gefunden.`);
  }
  return {
    ...run,
    steps: steps.filter(item => item.runId === runId).sort((a, b) => a.sequence - b.sequence),
    events: events.filter(item => item.runId === runId).sort((a, b) => a.createdAt - b.createdAt),
  } satisfies SwarmAutonomyRunWithDetails;
}

async function executeRun(db: DatabaseLike, swarm: SwarmForAutonomy, runId: number) {
  const run = await getRunWithDetails(db, runId);
  if (!["planned", "running", "paused"].includes(run.status)) {
    return run;
  }

  const started = await updateRun(db, runId, { status: "running", startedAt: run.startedAt ? new Date(run.startedAt) : nowIso(), lastEventAt: nowIso() });
  let steps = (await getRunWithDetails(db, runId)).steps;

  for (const step of steps) {
    if (step.status === "completed" || step.status === "cancelled" || step.status === "skipped") continue;
    const previousStep = findPreviousCompletedStep(steps, step);
    const enrichedInstructions = buildStepInstructions(step, previousStep);
    await updateStep(db, step.id, { status: "in_progress", instructions: enrichedInstructions });
    await insertEvent(db, {
      runId,
      swarmId: swarm.id,
      stepId: step.id,
      eventType: "delegated",
      actorLabel: step.assignedAgentName,
      detail: buildDelegationDetail(step, previousStep),
    });
    await updateStep(db, step.id, {
      status: "completed",
      instructions: enrichedInstructions,
      output: createExecutionSummary(step, swarm),
      completedAt: nowIso(),
    });
    await insertEvent(db, {
      runId,
      swarmId: swarm.id,
      stepId: step.id,
      eventType: "feedback",
      actorLabel: step.assignedAgentName,
      detail: createExecutionSummary(step, swarm),
    });
    steps = (await getRunWithDetails(db, runId)).steps;
  }

  const completed = await updateRun(db, runId, {
    status: "completed",
    summary: `Autonomer Lauf für ${swarm.name} abgeschlossen: ${steps.length} Teilaufgaben geplant und verarbeitet.`,
    completedAt: nowIso(),
    lastEventAt: nowIso(),
  });
  await insertEvent(db, {
    runId,
    swarmId: swarm.id,
    eventType: "completed",
    actorLabel: swarm.name,
    detail: `${swarm.name} hat den autonomen Auftrag abgeschlossen und einen konsolidierten Abschlussstatus erzeugt.`,
  });
  return {
    ...completed,
    steps: (await getRunWithDetails(db, runId)).steps,
    events: (await getRunWithDetails(db, runId)).events,
  } satisfies SwarmAutonomyRunWithDetails;
}

export async function listSwarmAutonomyRuns(db: DatabaseLike, swarmIds?: number[]): Promise<SwarmAutonomyRunWithDetails[]> {
  const [runs, steps, events] = await Promise.all([readRuns(db), readSteps(db), readEvents(db)]);
  const filteredRuns: SwarmAutonomyRunRecord[] = swarmIds?.length ? runs.filter(run => swarmIds.includes(run.swarmId)) : runs;
  return filteredRuns.map(run => ({
    ...run,
    steps: steps.filter(step => step.runId === run.id).sort((a: SwarmAutonomyStepRecord, b: SwarmAutonomyStepRecord) => a.sequence - b.sequence),
    events: events.filter(event => event.runId === run.id).sort((a: SwarmAutonomyEventRecord, b: SwarmAutonomyEventRecord) => a.createdAt - b.createdAt),
  })).sort((a: SwarmAutonomyRunWithDetails, b: SwarmAutonomyRunWithDetails) => b.createdAt - a.createdAt);
}

export async function createSwarmAutonomyRun(input: {
  db: DatabaseLike;
  swarm: SwarmForAutonomy;
  members: SwarmAutonomyMember[];
  objective: string;
  context?: string;
  priority?: SwarmAutonomyPriority;
  requestedByUserId?: number | null;
  requestedByLabel: string;
  requestedByRole: "user" | "admin" | "system";
}) {
  if (input.members.length === 0) {
    throw new Error(`Für Schwarm ${input.swarm.name} stehen keine Mitglieder zur autonomen Ausführung bereit.`);
  }

  const combinedText = `${input.objective} ${input.context ?? ""}`;
  const sensitive = includesSensitiveObjective(combinedText);
  const blocked = sensitive && input.swarm.governance.policyMode === "enforced";
  const approvalRequired = !blocked && sensitive && input.swarm.governance.approvalRequired && input.requestedByRole !== "admin";

  const run = await insertRun(input.db, {
    swarmId: input.swarm.id,
    objective: input.objective,
    context: input.context ?? null,
    priority: input.priority ?? "standard",
    status: blocked ? "blocked" : approvalRequired ? "awaiting_approval" : "planned",
    governanceStatus: blocked ? "blocked" : approvalRequired ? "approval_required" : "clear",
    requestedByUserId: input.requestedByUserId ?? null,
    requestedByLabel: input.requestedByLabel,
    requestedByRole: input.requestedByRole,
    summary: blocked
      ? `Autonomer Auftrag blockiert: ${input.swarm.governance.escalationTarget} muss wegen Policy-Modus eingreifen.`
      : approvalRequired
        ? `Autonomer Auftrag wartet auf Freigabe der Rolle ${input.swarm.governance.approverRole}.`
        : `Autonomer Auftrag für ${input.swarm.name} geplant und zur Ausführung vorbereitet.`,
    startedAt: null,
    completedAt: null,
    lastEventAt: nowIso(),
  });

  const stepDrafts = buildStepDrafts(input.swarm, input.members, input.objective, input.context ?? null);
  const insertedSteps = await insertSteps(input.db, stepDrafts.map((step, index) => ({
    runId: run.id,
    swarmId: input.swarm.id,
    assignedAgentId: step.assignedAgentId,
    assignedAgentName: step.assignedAgentName,
    title: step.title,
    instructions: step.instructions,
    status: blocked ? "blocked" : approvalRequired ? "awaiting_input" : "pending",
    sequence: step.sequence,
    dependsOnStepId: index === 0 ? null : undefined,
    output: null,
  })));

  for (const step of insertedSteps) {
    await insertEvent(input.db, {
      runId: run.id,
      swarmId: input.swarm.id,
      stepId: step.id,
      eventType: "planned",
      actorLabel: step.assignedAgentName,
      detail: `${step.assignedAgentName} wurde für Schritt ${step.sequence} eingeplant: ${step.title}`,
    });
  }

  if (blocked || approvalRequired) {
    await insertEvent(input.db, {
      runId: run.id,
      swarmId: input.swarm.id,
      eventType: "governance",
      actorLabel: input.swarm.governance.approverRole,
      detail: blocked
        ? `Der Policy-Modus des Schwarms blockiert die autonome Ausführung und eskaliert an ${input.swarm.governance.escalationTarget}.`
        : `Autonomer Auftrag wurde wegen sensibler Zielsetzung gestoppt, bis ${input.swarm.governance.approverRole} freigibt.`,
    });
    return getRunWithDetails(input.db, run.id);
  }

  return executeRun(input.db, input.swarm, run.id);
}

export async function applySwarmAutonomyAction(input: {
  db: DatabaseLike;
  swarm: SwarmForAutonomy;
  runId: number;
  action: SwarmAutonomyAction;
  actorLabel: string;
  actorRole: "user" | "admin" | "system";
}) {
  const current = await getRunWithDetails(input.db, input.runId);
  if (current.swarmId !== input.swarm.id) {
    throw new Error(`Autonomer Schwarmauftrag ${input.runId} gehört nicht zu Schwarm ${input.swarm.id}.`);
  }

  if (input.action === "cancel") {
    await cancelOpenSteps(input.db, input.runId);
    await updateRun(input.db, input.runId, {
      status: "cancelled",
      summary: `Autonomer Auftrag wurde durch ${input.actorLabel} abgebrochen.`,
      completedAt: nowIso(),
      lastEventAt: nowIso(),
    });
    await insertEvent(input.db, {
      runId: input.runId,
      swarmId: input.swarm.id,
      eventType: "cancelled",
      actorLabel: input.actorLabel,
      detail: `${input.actorLabel} hat den autonomen Auftrag aktiv beendet.`,
    });
    return getRunWithDetails(input.db, input.runId);
  }

  if (input.action === "pause") {
    await updateRun(input.db, input.runId, {
      status: "paused",
      summary: `Autonomer Auftrag wurde durch ${input.actorLabel} pausiert.`,
      lastEventAt: nowIso(),
    });
    await insertEvent(input.db, {
      runId: input.runId,
      swarmId: input.swarm.id,
      eventType: "paused",
      actorLabel: input.actorLabel,
      detail: `${input.actorLabel} hat den autonomen Auftrag pausiert.`,
    });
    return getRunWithDetails(input.db, input.runId);
  }

  if (input.action === "approve") {
    if (input.actorRole !== "admin") {
      throw new Error("Nur Admins dürfen autonome Schwarmaufträge freigeben.");
    }
    await updateRun(input.db, input.runId, {
      status: "planned",
      governanceStatus: "clear",
      summary: `Governance-Freigabe durch ${input.actorLabel} erteilt. Autonomer Lauf wird ausgeführt.`,
      lastEventAt: nowIso(),
    });
    await dbApproveOpenSteps(input.db, input.runId);
    await insertEvent(input.db, {
      runId: input.runId,
      swarmId: input.swarm.id,
      eventType: "resumed",
      actorLabel: input.actorLabel,
      detail: `${input.actorLabel} hat die Governance-Freigabe erteilt.`,
    });
    return executeRun(input.db, input.swarm, input.runId);
  }

  await updateRun(input.db, input.runId, {
    status: "planned",
    summary: `Autonomer Auftrag wurde durch ${input.actorLabel} fortgesetzt.`,
    lastEventAt: nowIso(),
  });
  await insertEvent(input.db, {
    runId: input.runId,
    swarmId: input.swarm.id,
    eventType: "resumed",
    actorLabel: input.actorLabel,
    detail: `${input.actorLabel} hat den autonomen Auftrag fortgesetzt.`,
  });
  return executeRun(input.db, input.swarm, input.runId);
}

async function dbApproveOpenSteps(db: DatabaseLike, runId: number) {
  if (!db) {
    for (const step of fallbackSteps.filter(item => item.runId === runId && item.status === "awaiting_input")) {
      step.status = "pending";
      step.updatedAt = Date.now();
    }
    return;
  }

  await db.update(swarmAutonomySteps)
    .set({ status: "pending", updatedAt: nowIso() })
    .where(and(eq(swarmAutonomySteps.runId, runId), eq(swarmAutonomySteps.status, "awaiting_input")));
}
