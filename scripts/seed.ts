import "dotenv/config";

/**
 * Seed / reset the database with the pristine in-memory demo dataset.
 *
 * Importing `server/db` defines all collections with their built-in demo data
 * (no hydration runs on import). `flushPersistedState()` then writes that
 * pristine state into the `appCollections` JSONB store, overwriting whatever is
 * there. The relational tables (approval chains, swarm messages/reports/
 * autonomy) self-seed lazily on first read.
 *
 * Note: the server also auto-seeds on first boot when the store is empty, so
 * this script is mainly a manual reset tool.
 *
 * Usage: pnpm db:seed
 */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("[seed] DATABASE_URL is not set. Configure it in your .env first.");
    process.exit(1);
  }

  const { flushPersistedState } = await import("../server/db");
  await flushPersistedState();
  console.log("[seed] Demo state written to the database.");
  process.exit(0);
}

main().catch(error => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
