import { createPool, migrate, seed } from "../server/db.js";
import { connection } from "./connection.js";
const pool = createPool(await connection());
try {
  if (process.argv[2] === "seed") {
    await migrate(pool);
    console.log("Seed results:", await seed(pool));
  } else {
    await migrate(pool);
    console.log("Database migrations applied.");
  }
} finally {
  await pool.end();
}
