import EmbeddedPostgres from "embedded-postgres";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { createPool, migrate, seed } from "../server/db.js";
import { startServer } from "../server/index.js";
let postgres;
if (!process.env.DATABASE_URL) {
  await mkdir(".local", { recursive: true });
  const configFile = resolve(".local/database.json");
  let config;
  try {
    config = JSON.parse(await readFile(configFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    config = { password: randomBytes(24).toString("hex"), port: 55432 };
    await writeFile(configFile, JSON.stringify(config), { mode: 0o600 });
  }
  postgres = new EmbeddedPostgres({
    databaseDir: resolve(".local/postgres"),
    user: "ev_local",
    password: config.password,
    port: config.port,
    persistent: true,
    authMethod: "scram-sha-256",
    postgresFlags: ["-h", "127.0.0.1"],
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: (message) => console.error(String(message)),
  });
  try {
    await readFile(resolve(".local/postgres/PG_VERSION"), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await postgres.initialise();
  }
  await postgres.start();
  process.env.DATABASE_URL = `postgresql://ev_local:${config.password}@127.0.0.1:${config.port}/postgres`;
  console.log("Local PostgreSQL started. Data persists in .local/postgres.");
}
const pool = createPool();
await migrate(pool);
const result = await seed(pool);
if (result.inserted)
  console.log(`Imported ${result.inserted} unique resources.`);
process.env.APP_ORIGIN ||= `http://127.0.0.1:${process.env.PORT || 3000}`;
const runtime = await startServer(pool);
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, async () => {
    if (stopping) return;
    stopping = true;
    await runtime.stop();
    if (postgres) await postgres.stop();
    process.exit(0);
  });
