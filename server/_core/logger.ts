import pino from "pino";
import { ENV } from "./env";

/** Structured JSON logger (one line per event). */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (ENV.isProduction ? "info" : "debug"),
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.accessToken"],
    remove: true,
  },
});
