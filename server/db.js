import pg from "pg";
import { readFile, readdir } from "node:fs/promises";

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString)
    throw new Error(
      "DATABASE_URL is missing. Set it in .env, or use npm run dev.",
    );
  return new pg.Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5000,
  });
}
export async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function migrate(pool) {
  await transaction(pool, async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(20261014)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = new URL("../db/migrations/", import.meta.url);
    for (const name of (await readdir(directory))
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      if (
        (
          await client.query("SELECT 1 FROM schema_migrations WHERE name=$1", [
            name,
          ])
        ).rowCount
      )
        continue;
      await client.query(await readFile(new URL(name, directory), "utf8"));
      await client.query("INSERT INTO schema_migrations(name) VALUES($1)", [
        name,
      ]);
    }
  });
}
export function canonicalUrl(value) {
  const url = new URL(value);
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Use a public HTTP or HTTPS link.");
  url.hash = "";
  // Different share links for the same YouTube course should not earn duplicate credits.
  if (
    ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"].includes(
      url.hostname,
    )
  ) {
    const list = url.searchParams.get("list");
    const video =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : url.searchParams.get("v");
    if (list)
      return `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`;
    if (video)
      return `https://www.youtube.com/watch?v=${encodeURIComponent(video)}`;
  }
  for (const key of [...url.searchParams.keys()])
    if (key.startsWith("utm_") || ["si", "feature", "fbclid"].includes(key))
      url.searchParams.delete(key);
  url.searchParams.sort();
  return url.toString().replace(/\/$/, "");
}
export async function seed(pool) {
  const catalog = JSON.parse(
    await readFile(new URL("../db/seed/catalog.json", import.meta.url), "utf8"),
  );
  return transaction(pool, async (client) => {
    for (const [position, subject] of catalog.subjects.entries())
      await client.query(
        "INSERT INTO disciplines(id,label,description,position) VALUES($1,$2,$3,$4) ON CONFLICT(id) DO NOTHING",
        [subject.id, subject.label, subject.desc, position],
      );
    let inserted = 0,
      skipped = 0;
    const items = [
      ...catalog.playlists.map((item) => ({
        ...item,
        type: "video",
        provider: item.channel,
      })),
      ...catalog.books.map((item) => ({
        ...item,
        type: "book",
        provider: item.author,
      })),
    ];
    for (const [position, item] of items.entries()) {
      const result = await client.query(
        `INSERT INTO resources(title,type,discipline_id,provider,url,thumbnail_url,duration_label,topics,tags,notes_url,notes_label,status,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'approved',true) ON CONFLICT(url) DO NOTHING`,
        [
          item.title,
          item.type,
          item.subject,
          item.provider,
          canonicalUrl(item.url),
          item.thumb || null,
          item.videos || null,
          JSON.stringify(item.topics || []),
          JSON.stringify(item.tags || []),
          item.notes?.url || null,
          item.notes?.label || null,
        ],
      );
      if (result.rowCount) inserted++;
      else skipped++;
      await client.query(
        "UPDATE resources SET sort_order=$2 WHERE url=$1 AND submitted_by IS NULL",
        [canonicalUrl(item.url), position],
      );
    }
    return { inserted, skipped };
  });
}
