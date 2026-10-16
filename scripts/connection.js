import { readFile } from "node:fs/promises";
export async function connection() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const config = JSON.parse(
    await readFile(new URL("../.local/database.json", import.meta.url), "utf8"),
  );
  return `postgresql://ev_local:${config.password}@127.0.0.1:${config.port}/postgres`;
}
