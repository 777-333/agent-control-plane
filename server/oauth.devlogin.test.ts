import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "./_core/env";
import { getDevLoginIdentity, resolveSafeRedirectTarget } from "./_core/oauth";

const originalOwnerOpenId = ENV.ownerOpenId;
const originalOwnerName = ENV.ownerName;
const originalIsProduction = ENV.isProduction;

afterEach(() => {
  ENV.ownerOpenId = originalOwnerOpenId;
  ENV.ownerName = originalOwnerName;
  ENV.isProduction = originalIsProduction;
});

describe("development login helpers", () => {
  it("returns the configured owner identity only outside production", () => {
    ENV.isProduction = false;
    ENV.ownerOpenId = "owner-123";
    ENV.ownerName = "Agent Control Owner";

    expect(getDevLoginIdentity()).toEqual({
      openId: "owner-123",
      name: "Agent Control Owner",
    });

    ENV.isProduction = true;
    expect(getDevLoginIdentity()).toBeNull();
  });

  it("falls back to a safe default name when no owner name is configured", () => {
    ENV.isProduction = false;
    ENV.ownerOpenId = "owner-456";
    ENV.ownerName = "";

    expect(getDevLoginIdentity()).toEqual({
      openId: "owner-456",
      name: "Projektinhaber",
    });
  });

  it("allows only internal relative redirect targets", () => {
    expect(resolveSafeRedirectTarget(undefined)).toBe("/");
    expect(resolveSafeRedirectTarget("/guardrails")).toBe("/guardrails");
    expect(resolveSafeRedirectTarget("https://example.com")).toBe("/");
    expect(resolveSafeRedirectTarget("//evil.example")).toBe("/");
  });
});
