import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request tenant isolation.
 *
 * Each authenticated user is a tenant (keyed by their Supabase openId). The
 * current tenant is carried through the request via AsyncLocalStorage so the
 * data layer can filter/stamp records without threading a tenantId through
 * every function signature.
 *
 * The project owner (ENV.ownerOpenId) maps to DEFAULT_TENANT so the original
 * seeded demo data belongs to them. New customers get their own isolated copy.
 * Calls without a tenant context (unit tests, boot) fall back to DEFAULT_TENANT.
 */

export const DEFAULT_TENANT = "default";

const store = new AsyncLocalStorage<string>();

export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return store.run(tenantId, fn);
}

export function currentTenantId(): string {
  return store.getStore() ?? DEFAULT_TENANT;
}
