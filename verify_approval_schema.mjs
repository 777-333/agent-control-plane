import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const requiredColumns = {
  approvalStages: [
    "stageMode",
    "laneKey",
    "branchSourceStageOrder",
    "branchLabel",
    "branchOperator",
    "branchValue",
  ],
};

const connection = await mysql.createConnection(databaseUrl);
try {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN (?)`,
    [Object.keys(requiredColumns)],
  );

  const columnsByTable = new Map();
  for (const row of rows) {
    const current = columnsByTable.get(row.tableName) ?? new Set();
    current.add(row.columnName);
    columnsByTable.set(row.tableName, current);
  }

  const result = Object.entries(requiredColumns).map(([tableName, columns]) => ({
    tableName,
    missing: columns.filter(column => !columnsByTable.get(tableName)?.has(column)),
  }));

  const missingAny = result.some(item => item.missing.length > 0);
  console.log(JSON.stringify({ ok: !missingAny, result }, null, 2));
  if (missingAny) {
    process.exitCode = 1;
  }
} finally {
  await connection.end();
}
