import { createPool, transaction } from "../server/db.js";
import { email } from "../server/validation.js";
import { connection } from "./connection.js";
const address = email(process.argv[2]);
const pool = createPool(await connection());
try {
  await transaction(pool, async (client) => {
    const user = (
      await client.query(
        "UPDATE users SET role='admin' WHERE email=$1 RETURNING id",
        [address],
      )
    ).rows[0];
    if (!user) throw new Error("Register this account in the app first.");
    await client.query(
      "INSERT INTO audit_log(actor_id,action,details) VALUES($1,'admin.granted',$2)",
      [user.id, JSON.stringify({ via: "database-owner CLI" })],
    );
  });
  console.log("Admin access granted. Refresh the app.");
} finally {
  await pool.end();
}
