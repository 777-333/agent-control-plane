import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = await fs.readFile(new URL("./drizzle/0001_premium_shaman.sql", import.meta.url), "utf8");
const statements = sql
  .split("--> statement-breakpoint")
  .map(statement => statement.trim())
  .filter(Boolean);

const connection = await mysql.createConnection(databaseUrl);
try {
  for (const statement of statements) {
    await connection.query(statement);
  }
  console.log(`Applied ${statements.length} SQL statements.`);
} finally {
  await connection.end();
}
