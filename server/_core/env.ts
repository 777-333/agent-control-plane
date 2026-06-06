import { z } from "zod";

/**
 * Centralized, validated environment configuration.
 *
 * In production the required variables MUST be present, otherwise the process
 * exits immediately with a clear message (fail-fast). In development we are
 * lenient so the app can boot with partial configuration.
 */

const isProduction = process.env.NODE_ENV === "production";

const rawSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database (Supabase Postgres connection string)
  DATABASE_URL: z.string().default(""),

  // Session signing secret for the httpOnly session cookie (jose / HS256)
  JWT_SECRET: z.string().default(""),

  // Supabase Auth (identity provider)
  SUPABASE_URL: z.string().default(""),
  SUPABASE_ANON_KEY: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  SUPABASE_JWT_SECRET: z.string().default(""),

  // App identity / public origin (used for cookie + redirect handling)
  VITE_APP_ID: z.string().default(""),
  APP_ORIGIN: z.string().default(""),

  // Observability (optional)
  SENTRY_DSN: z.string().default(""),

  // Shared secret for the service-to-service event ingestion endpoint.
  INGEST_TOKEN: z.string().default(""),

  // Development-only convenience login
  OWNER_OPEN_ID: z.string().default(""),
  OWNER_NAME: z.string().default(""),

  // Legacy Manus OAuth (removed in favor of Supabase Auth; kept for transition)
  OAUTH_SERVER_URL: z.string().default(""),

  // Optional built-in storage integration
  BUILT_IN_FORGE_API_URL: z.string().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().default(""),
});

const parsed = rawSchema.parse(process.env);

/**
 * Variables that must be present when running in production.
 */
const REQUIRED_IN_PRODUCTION: Array<keyof typeof parsed> = [
  "DATABASE_URL",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWT_SECRET",
];

if (isProduction) {
  const missing = REQUIRED_IN_PRODUCTION.filter(
    key => !parsed[key] || String(parsed[key]).length === 0
  );

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `[ENV] Missing required environment variables in production: ${missing.join(", ")}.\n` +
        `Set them in your Coolify application settings before deploying.`
    );
    process.exit(1);
  }
}

export const ENV = {
  isProduction,
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,

  databaseUrl: parsed.DATABASE_URL,
  cookieSecret: parsed.JWT_SECRET,

  supabaseUrl: parsed.SUPABASE_URL,
  supabaseAnonKey: parsed.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: parsed.SUPABASE_SERVICE_ROLE_KEY,
  supabaseJwtSecret: parsed.SUPABASE_JWT_SECRET,

  appId: parsed.VITE_APP_ID,
  appOrigin: parsed.APP_ORIGIN,

  sentryDsn: parsed.SENTRY_DSN,
  ingestToken: parsed.INGEST_TOKEN,

  ownerOpenId: parsed.OWNER_OPEN_ID,
  ownerName: parsed.OWNER_NAME,

  /** @deprecated Replaced by Supabase Auth. */
  oAuthServerUrl: parsed.OAUTH_SERVER_URL,

  forgeApiUrl: parsed.BUILT_IN_FORGE_API_URL,
  forgeApiKey: parsed.BUILT_IN_FORGE_API_KEY,
};
