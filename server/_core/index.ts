import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import {
  createGuardrailEvent,
  initPersistence,
  recordAuditEvent,
  recordMetricSnapshot,
  runDueSwarmReportSubscriptions,
} from "../db";
import { createContext } from "./context";
import { ENV } from "./env";
import { logger } from "./logger";
import { initObservability } from "./observability";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Initialize error tracking as early as possible.
  initObservability();

  // Hydrate in-memory state from the database and start write-through persistence.
  await initPersistence();

  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);

  // Security headers + structured request logging.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(pinoHttp({ logger }));

  // Liveness/readiness probe for Coolify.
  app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.post("/api/scheduled/governance-reports", async (req, res) => {
    const ctx = await createContext({ req, res, info: undefined as never });
    if (!ctx.user || (ctx.user.role !== "user" && ctx.user.role !== "admin")) {
      res.status(401).json({ ok: false, error: "Nicht authentifiziert." });
      return;
    }

    try {
      const reportState = await runDueSwarmReportSubscriptions();
      res.json({
        ok: true,
        exportsCount: reportState.exports.length,
        approvalsCount: reportState.approvals.length,
        subscriptionsCount: reportState.subscriptions.length,
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Zeitbasierter Governance-Report-Lauf fehlgeschlagen.",
      });
    }
  });
  // Real event ingestion (service-to-service, bearer token auth).
  app.post("/api/ingest", async (req, res) => {
    const header = req.headers.authorization;
    const token =
      typeof header === "string" && header.toLowerCase().startsWith("bearer ")
        ? header.slice(7).trim()
        : undefined;

    if (!ENV.ingestToken || token !== ENV.ingestToken) {
      res.status(401).json({ ok: false, error: "Unauthorized" });
      return;
    }

    try {
      const body = req.body as { type?: string; payload?: Record<string, unknown> };
      const payload = body.payload ?? {};

      switch (body.type) {
        case "audit":
          res.json({ ok: true, event: recordAuditEvent(payload as never) });
          return;
        case "metric":
          res.json({ ok: true, snapshot: recordMetricSnapshot(payload as never) });
          return;
        case "guardrail":
          res.json({ ok: true, event: await createGuardrailEvent(payload as never) });
          return;
        default:
          res.status(400).json({ ok: false, error: "Unknown ingest type" });
          return;
      }
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "Ingestion failed",
      });
    }
  });

  // tRPC API (rate-limited)
  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(
    "/api/trpc",
    apiLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In production, bind to the exact PORT on 0.0.0.0 so Coolify/Traefik can
  // proxy reliably. In development, fall back to scanning for a free port.
  const port = ENV.isProduction
    ? ENV.port
    : await findAvailablePort(ENV.port);

  if (!ENV.isProduction && port !== ENV.port) {
    logger.warn(`Port ${ENV.port} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    logger.info(`Server running on port ${port}`);
  });
}

startServer().catch(error => {
  logger.error({ err: error }, "Server failed to start");
  process.exit(1);
});
