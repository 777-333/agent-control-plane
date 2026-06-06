import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` works offline (no DB needed). `migrate`/`push` require
// a real DATABASE_URL and will fail clearly if it is empty.
const connectionString = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});
