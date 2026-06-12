import { describe, expect, it } from "vitest";
import { createAgent, getBillingOverview, recordBillableEvent, setTenantPlan } from "./db";
import { runWithTenant } from "./_core/tenant";

const agentInput = (name: string) => ({
  name,
  description: "Beispielbeschreibung für den Test.",
  team: "Team",
  owner: "Owner",
  model: "claude-sonnet-4-6",
  environment: "production" as const,
});

describe("billing limits", () => {
  it("enforces the free agent quota and lifts it after upgrade", async () => {
    await runWithTenant("bill-1", async () => {
      // Free tier = 3 agents.
      await createAgent(agentInput("A1"));
      await createAgent(agentInput("A2"));
      await createAgent(agentInput("A3"));
      await expect(createAgent(agentInput("A4"))).rejects.toThrow(/Limit/);

      const overview = getBillingOverview();
      expect(overview.plan.id).toBe("free");
      expect(overview.usage.agents).toBe(3);
      expect(overview.agentLimitReached).toBe(true);

      // Upgrade lifts the cap.
      setTenantPlan("starter");
      await createAgent(agentInput("A4"));
      expect(getBillingOverview().usage.agents).toBe(4);
      expect(getBillingOverview().plan.id).toBe("starter");
    });
  });

  it("counts billable events per tenant", () => {
    runWithTenant("bill-2", () => {
      const before = getBillingOverview().usage.events;
      recordBillableEvent();
      recordBillableEvent();
      expect(getBillingOverview().usage.events).toBe(before + 2);
    });
  });
});
