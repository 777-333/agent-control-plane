// Subscription tiers (4-tier model + Enterprise). Limits are enforced per
// tenant; prices are display-only for now (no payment yet – Stripe later).
//
// NOTE: Free allows 3 agents (the starter workspace seeds 2 examples, leaving
// room to create your own). Adjust freely – this file is the single source.

export type PlanId = "free" | "starter" | "team" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyEur: number | null; // null = individuell (Enterprise)
  priceYearlyEur: number | null;
  maxAgents: number;
  maxEventsPerMonth: number;
  auditRetentionDays: number;
  maxSeats: number;
  highlights: string[];
}

export const UNLIMITED = Number.POSITIVE_INFINITY;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyEur: 0,
    priceYearlyEur: 0,
    maxAgents: 3,
    maxEventsPerMonth: 1_000,
    auditRetentionDays: 7,
    maxSeats: 1,
    highlights: ["Zum Ausprobieren", "Doku-Support"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthlyEur: 39,
    priceYearlyEur: 390,
    maxAgents: 10,
    maxEventsPerMonth: 25_000,
    auditRetentionDays: 30,
    maxSeats: 1,
    highlights: ["E-Mail-Support"],
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthlyEur: 149,
    priceYearlyEur: 1_490,
    maxAgents: 50,
    maxEventsPerMonth: 250_000,
    auditRetentionDays: 90,
    maxSeats: 5,
    highlights: ["Guardrails", "Evaluations", "Approval-Ketten", "Prio-Support"],
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthlyEur: 499,
    priceYearlyEur: 4_990,
    maxAgents: 250,
    maxEventsPerMonth: 1_500_000,
    auditRetentionDays: 365,
    maxSeats: 20,
    highlights: ["SSO", "SLA-Reports", "Rollen", "Audit-Export"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthlyEur: null,
    priceYearlyEur: null,
    maxAgents: UNLIMITED,
    maxEventsPerMonth: UNLIMITED,
    auditRetentionDays: UNLIMITED,
    maxSeats: UNLIMITED,
    highlights: ["Self-Host/On-Prem", "DPA/Compliance", "Dediziertes Onboarding", "SLA"],
  },
};

export const DEFAULT_PLAN: PlanId = "free";
export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}
