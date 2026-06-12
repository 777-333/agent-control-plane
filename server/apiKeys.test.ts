import { describe, expect, it } from "vitest";
import { createApiKey, listApiKeys, resolveApiKey, revokeApiKey } from "./db";
import { runWithTenant } from "./_core/tenant";

describe("api keys", () => {
  it("creates, resolves, scopes and revokes keys per tenant", () => {
    const { fullKey, key } = runWithTenant("cust-1", () => createApiKey("Mein Schlüssel"));

    expect(fullKey.startsWith("acp_")).toBe(true);
    expect(key.keyPrefix.startsWith("acp_")).toBe(true);
    // The plaintext key resolves back to the owning tenant.
    expect(resolveApiKey(fullKey)).toBe("cust-1");

    // Listing is tenant-scoped and never exposes the secret/hash.
    const listed = runWithTenant("cust-1", () => listApiKeys());
    expect(listed.some(k => k.id === key.id)).toBe(true);
    expect(JSON.stringify(listed)).not.toContain("keyHash");
    expect(runWithTenant("cust-2", () => listApiKeys()).some(k => k.id === key.id)).toBe(false);

    // Revoking disables resolution.
    runWithTenant("cust-1", () => revokeApiKey(key.id));
    expect(resolveApiKey(fullKey)).toBeNull();
  });

  it("prevents revoking another tenant's key", () => {
    const { key } = runWithTenant("cust-a", () => createApiKey("A"));
    expect(() => runWithTenant("cust-b", () => revokeApiKey(key.id))).toThrow();
  });
});
