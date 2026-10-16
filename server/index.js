import { createPool } from "./db.js";
import { createApp } from "./app.js";
import { pathToFileURL } from "node:url";
export async function startServer(pool = createPool()) {
  await pool.query("SELECT 1 FROM credit_policy WHERE id=1");
  const port = Number(process.env.PORT || 3000),
    host = process.env.HOST || "127.0.0.1";
  const server = createApp(pool).listen(port, host, () =>
    console.log(
      `EngineersVault: ${process.env.APP_ORIGIN || `http://${host}:${port}`}`,
    ),
  );
  const cleanup = setInterval(
    () =>
      pool.query("DELETE FROM sessions WHERE expires_at<now()").catch(() => {}),
    60 * 60 * 1000,
  );
  cleanup.unref();
  return {
    server,
    pool,
    async stop() {
      clearInterval(cleanup);
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await pool.end();
    },
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  startServer()
    .then((runtime) => {
      for (const signal of ["SIGINT", "SIGTERM"])
        process.once(signal, () => runtime.stop().then(() => process.exit(0)));
    })
    .catch((error) => {
      console.error("Startup failed:", error.message);
      process.exit(1);
    });
}
