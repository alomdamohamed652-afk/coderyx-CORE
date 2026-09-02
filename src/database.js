const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

let pool = null;

function initDatabase(databaseUrl) {
  if (!databaseUrl) return null;
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });
  pool.on("error", (err) => console.error("[Database] Unexpected idle client error:", err.message));
  return pool;
}

function getPool() {
  if (!pool) throw new Error("Database is not initialized. Set DATABASE_URL.");
  return pool;
}

async function migrate() {\n  const sql = fs.readFileSync(path.join(__dirname, "..", "database", "schema.sql"), "utf8");\n  await getPool().query(sql);\n  return { ok: true };\n}\n\nasync function health() {
  if (!pool) return { ok: false, backend: "postgresql", configured: false };
  try {
    const result = await pool.query("SELECT NOW() AS now");
    return { ok: true, backend: "postgresql", configured: true, now: result.rows[0].now };
  } catch (error) {
    return { ok: false, backend: "postgresql", configured: true, error: error.message };
  }
}

async function close() {
  if (pool) await pool.end();
  pool = null;
}

module.exports = { initDatabase, getPool, migrate, health, close };
