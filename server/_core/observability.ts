import * as Sentry from "@sentry/node";
import { ENV } from "./env";

let initialized = false;

/** Initialize Sentry error tracking when a DSN is configured. No-op otherwise. */
export function initObservability() {
  if (!ENV.sentryDsn || initialized) return;
  Sentry.init({
    dsn: ENV.sentryDsn,
    environment: ENV.nodeEnv,
    tracesSampleRate: 0.1,
  });
  initialized = true;
}

export function captureException(error: unknown) {
  if (initialized) {
    Sentry.captureException(error);
  }
}
