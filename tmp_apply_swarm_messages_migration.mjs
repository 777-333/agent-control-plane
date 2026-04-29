import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL ist nicht gesetzt.");
}

const sql = await fs.readFile(new URL("./drizzle/0006_fearless_fallen_one.sql", import.meta.url), "utf8");
const connection = await mysql.createConnection(databaseUrl);

try {
  for (const statement of sql
    .split(";\n")
    .map(part => part.trim())
    .filter(Boolean)) {
    await connection.query(statement);
  }
  console.log("Migration erfolgreich angewendet.");
} finally {
  await connection.end();
}
