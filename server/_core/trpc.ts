import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ensureTenantSeeded } from "../db";
import { ENV } from "./env";
import { captureException } from "./observability";
import { DEFAULT_TENANT, runWithTenant } from "./tenant";

/**
 * Map a user to their tenant. The project owner maps to DEFAULT_TENANT so the
 * original seeded data belongs to them; every other user is their own tenant.
 */
function tenantForUser(openId: string): string {
  return ENV.ownerOpenId && openId === ENV.ownerOpenId ? DEFAULT_TENANT : openId;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      captureException(error.cause ?? error);
      if (ENV.isProduction) {
        // Do not leak internal error details to clients in production.
        return { ...shape, message: "Internal server error" };
      }
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const user = ctx.user;
  const tenant = tenantForUser(user.openId);
  // Provision a starter workspace for brand-new customers (idempotent).
  await ensureTenantSeeded(tenant);
  // Carry the tenant through the whole request so the data layer isolates it.
  return runWithTenant(tenant, () =>
    next({
      ctx: {
        ...ctx,
        user,
      },
    })
  );
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
