import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

type Role = "user" | "admin";

function ctx(openId: string, role: Role = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId,
      email: `${openId}@example.com`,
      name: openId,
      loginMethod: "test",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("tenant isolation", () => {
  it("gives a brand-new customer their own seeded starter workspace", async () => {
    // The project owner maps to DEFAULT_TENANT (OWNER_OPEN_ID=sample-user in tests).
    const owner = appRouter.createCaller(ctx("sample-user", "admin"));
    const customer = appRouter.createCaller(ctx("customer-a"));

    const ownerSnap = await owner.controlPlane.snapshot();
    const customerSnap = await customer.controlPlane.snapshot();

    const customerAgents = customerSnap.agents.map(agent => agent.name);
    // Customer sees their starter set, not the owner's rich demo data.
    expect(customerAgents).toContain("Beispiel-Agent");
    expect(customerSnap.agents.length).toBeLessThan(ownerSnap.agents.length);

    // No owner-only agent leaks into the customer's workspace.
    const ownerOnly = ownerSnap.agents
      .map(agent => agent.name)
      .filter(name => !customerAgents.includes(name));
    expect(ownerOnly.length).toBeGreaterThan(0);
    for (const name of ownerOnly) {
      expect(customerAgents).not.toContain(name);
    }
  });

  it("does not leak data between two customers", async () => {
    const x = appRouter.createCaller(ctx("customer-x"));
    const y = appRouter.createCaller(ctx("customer-y"));

    await x.controlPlane.snapshot(); // provision tenant x
    await y.controlPlane.snapshot(); // provision tenant y

    const secret = `Geheim-Agent-${Date.now()}`;
    await x.agents.create({
      name: secret,
      description: "Nur fuer Kunde X sichtbar.",
      team: "Team X",
      owner: "Kunde X",
      model: "claude-sonnet-4-6",
      environment: "production",
    });

    const ySnap = await y.controlPlane.snapshot();
    expect(ySnap.agents.map(agent => agent.name)).not.toContain(secret);

    const xSnap = await x.controlPlane.snapshot();
    expect(xSnap.agents.map(agent => agent.name)).toContain(secret);
  });
});
