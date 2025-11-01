import { readConfig } from "../config";
import { createPool, ensureSchema } from "../dal/db";
import { upsertProgress, getAggregates, resetProgress } from "../dal/progress";

async function main() {
  const cfg = readConfig();
  if (!cfg.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const pool = createPool(cfg.DATABASE_URL);
  await ensureSchema(pool);

  const uuid = "00000000-0000-0000-0000-000000000001";

  // reset préalable
  await resetProgress(pool, uuid);

  // upsert 2 sous-catégories
  await upsertProgress(pool, {
    uuid, theme: "rhcsa", category: "storage", subcategory: "lvm",
    totalQuestions: 10, answered: 8, correct: 6
  });
  await upsertProgress(pool, {
    uuid, theme: "rhcsa", category: "network", subcategory: "nmcli",
    totalQuestions: 5, answered: 5, correct: 4
  });

  // lecture des agrégats
  const agg1 = await getAggregates(pool, uuid);
  console.log("AGGREGATES #1:", JSON.stringify(agg1, null, 2));

  // reset global
  await resetProgress(pool, uuid);
  const agg2 = await getAggregates(pool, uuid);
  console.log("AGGREGATES #2 (after reset):", JSON.stringify(agg2, null, 2));

  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
