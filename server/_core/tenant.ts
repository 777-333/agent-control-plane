import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request tenant + role isolation.
 *
 * A tenant is an **organisation**. Each user belongs to exactly one org
 * (a personal org by default, whose id equals their openId, so existing data
 * is preserved). The project owner maps to DEFAULT_TENANT.
 *
 * The current org id and the caller's role are carried through the request via
 * AsyncLocalStorage so the data layer can filter/stamp and enforce roles
 * without threading them through every function signature.
 */

export const DEFAULT_TENANT = "default";

export type Role = "admin" | "member" | "viewer";

export type TenantContext = {
  tenantId: string;
  role: Role;
  userOpenId: string | null;
};

const store = new AsyncLocalStorage<TenantContext>();

/** Run with a full context (used by the authenticated request middleware). */
export function runWithContext<T>(ctx: TenantContext, fn: () => T): T {
  return store.run(ctx, fn);
}

/**
 * Run with just a tenant id and full (admin) rights. Used by background/seed
 * code and by API-key driven REST calls (agents act with full rights).
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return store.run({ tenantId, role: "admin", userOpenId: null }, fn);
}

export function currentTenantId(): string {
  return store.getStore()?.tenantId ?? DEFAULT_TENANT;
}

export function currentRole(): Role {
  return store.getStore()?.role ?? "admin";
}

export function currentUserOpenId(): string | null {
  return store.getStore()?.userOpenId ?? null;
}
