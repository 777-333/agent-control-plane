import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

export type SupabaseIdentity = {
  openId: string;
  email: string | null;
  name: string | null;
  loginMethod: string | null;
};

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user openId (Supabase user UUID).
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Verify a Supabase access token and return the normalized identity.
   * Used during login to exchange a Supabase session for our session cookie.
   */
  /**
   * Verify a Supabase access token locally by validating its HS256 signature
   * with the Supabase JWT secret. This avoids constructing a supabase-js client
   * (which requires a WebSocket runtime) and needs no network call.
   */
  async verifySupabaseToken(accessToken: string): Promise<SupabaseIdentity> {
    if (!ENV.supabaseJwtSecret) {
      throw ForbiddenError("Supabase JWT secret is not configured");
    }

    let payload: Record<string, unknown>;
    try {
      const secret = new TextEncoder().encode(ENV.supabaseJwtSecret);
      const verified = await jwtVerify(accessToken, secret, {
        algorithms: ["HS256"],
      });
      payload = verified.payload as Record<string, unknown>;
    } catch (error) {
      console.warn("[Auth] Supabase token verification failed", String(error));
      throw ForbiddenError("Invalid Supabase access token");
    }

    const sub = payload.sub;
    if (typeof sub !== "string" || sub.length === 0) {
      throw ForbiddenError("Supabase token is missing a subject");
    }

    const email = typeof payload.email === "string" ? payload.email : null;
    const metadata = (payload.user_metadata ?? {}) as Record<string, unknown>;
    const appMetadata = (payload.app_metadata ?? {}) as Record<string, unknown>;

    const name =
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      email ||
      null;

    const provider =
      (typeof appMetadata.provider === "string" && appMetadata.provider) ||
      "email";

    return {
      openId: sub,
      email,
      name,
      loginMethod: provider,
    };
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const user = await db.getUserByOpenId(session.openId);
    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: new Date(),
    });

    return user;
  }
}

export const sdk = new SDKServer();
