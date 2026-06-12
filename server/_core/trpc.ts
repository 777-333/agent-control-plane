import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { ensureTenantSeeded, resolveTenantForUser } from "../db";
import { ENV } from "./env";
import { captureException } from "./observability";
import { currentRole, runWithContext } from "./tenant";

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
  const { ctx, next, type, path } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  const user = ctx.user;
  const isOwner = Boolean(ENV.ownerOpenId && user.openId === ENV.ownerOpenId);
  const { tenantId, role } = resolveTenantForUser({
    openId: user.openId,
    email: user.email ?? null,
    name: user.name ?? null,
    isOwner,
  });

  // Viewers are read-only, except for managing their own team membership.
  if (role === "viewer" && type === "mutation" && !path.startsWith("team.")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: 'Nur-Lese-Zugriff: Diese Aktion ist für die Rolle „Betrachter" nicht erlaubt.',
    });
  }

  // Provision a starter workspace for brand-new customers (idempotent).
  await ensureTenantSeeded(tenantId);
  // Carry tenant + role through the whole request so the data layer isolates it.
  return runWithContext({ tenantId, role, userOpenId: user.openId }, () =>
    next({
      ctx: {
        ...ctx,
        user,
      },
    })
  );
});

export const protectedProcedure = t.procedure.use(requireUser);

/** Requires the caller to be an admin of their current organisation. */
export const orgAdminProcedure = protectedProcedure.use(
  t.middleware(async opts => {
    if (currentRole() !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nur Admins der Organisation dürfen diese Aktion ausführen.",
      });
    }
    return opts.next();
  })
);

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
