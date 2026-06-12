import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function ctx(openId: string, email = `${openId}@example.com`): TrpcContext {
  return {
    user: {
      id: 1,
      openId,
      email,
      name: openId,
      loginMethod: "test",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

const agentInput = (name: string) => ({
  name,
  description: "Beispielbeschreibung für den Test.",
  team: "Team",
  owner: "Owner",
  model: "claude-sonnet-4-6",
  environment: "production" as const,
});

describe("team tenancy", () => {
  it("an invited member shares the organisation's data after accepting", async () => {
    const admin = appRouter.createCaller(ctx("org-admin-1"));
    const newbie = appRouter.createCaller(ctx("newbie-1"));

    await admin.controlPlane.snapshot(); // provision admin org
    const secret = `Org-Agent-${Date.now()}`;
    await admin.agents.create(agentInput(secret));

    const before = await newbie.controlPlane.snapshot();
    expect(before.agents.map(a => a.name)).not.toContain(secret);

    await admin.team.invite({ email: "newbie-1@example.com", role: "member" });
    const invites = await newbie.team.myInvites();
    expect(invites.length).toBe(1);

    await newbie.team.acceptInvite({ id: invites[0]!.id });

    const after = await newbie.controlPlane.snapshot();
    expect(after.agents.map(a => a.name)).toContain(secret);

    const team = await newbie.team.overview();
    expect(team.myRole).toBe("member");
    expect(team.members.length).toBeGreaterThanOrEqual(2);
  });

  it("blocks a viewer from mutating", async () => {
    const admin = appRouter.createCaller(ctx("org-admin-2"));
    const viewer = appRouter.createCaller(ctx("viewer-1"));

    await admin.controlPlane.snapshot();
    await admin.team.invite({ email: "viewer-1@example.com", role: "viewer" });
    const invites = await viewer.team.myInvites();
    await viewer.team.acceptInvite({ id: invites[0]!.id });

    await expect(viewer.agents.create(agentInput("Nope"))).rejects.toThrow();
  });

  it("only admins can invite", async () => {
    const admin = appRouter.createCaller(ctx("org-admin-3"));
    const member = appRouter.createCaller(ctx("member-1"));
    await admin.controlPlane.snapshot();
    await admin.team.invite({ email: "member-1@example.com", role: "member" });
    const invites = await member.team.myInvites();
    await member.team.acceptInvite({ id: invites[0]!.id });

    await expect(
      member.team.invite({ email: "someone@example.com", role: "member" })
    ).rejects.toThrow();
  });
});
