import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function resolveSafeRedirectTarget(target: string | undefined): string {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }

  return target;
}

export function getDevLoginIdentity() {
  if (ENV.isProduction || !ENV.ownerOpenId) {
    return null;
  }

  return {
    openId: ENV.ownerOpenId,
    name: ENV.ownerName || "Projektinhaber",
  };
}

function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  const bodyToken = (req.body as { accessToken?: unknown } | undefined)?.accessToken;
  return typeof bodyToken === "string" ? bodyToken : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Development-only convenience login (no Supabase required).
  app.get("/api/dev-login", async (req: Request, res: Response) => {
    const identity = getDevLoginIdentity();

    if (!identity) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    try {
      await db.upsertUser({
        openId: identity.openId,
        name: identity.name,
        email: null,
        loginMethod: "development",
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(identity.openId, {
        name: identity.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, resolveSafeRedirectTarget(getQueryParam(req, "redirect")));
    } catch (error) {
      console.error("[Auth] Dev login failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });

  // Exchange a verified Supabase access token for our httpOnly session cookie.
  app.post("/api/auth/session", async (req: Request, res: Response) => {
    const accessToken = extractAccessToken(req);

    if (!accessToken) {
      res.status(400).json({ error: "accessToken is required" });
      return;
    }

    try {
      const identity = await sdk.verifySupabaseToken(accessToken);

      await db.upsertUser({
        openId: identity.openId,
        name: identity.name,
        email: identity.email,
        loginMethod: identity.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(identity.openId, {
        name: identity.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Auth] Supabase session exchange failed", error);
      res.status(401).json({ error: "Authentication failed" });
    }
  });
}
