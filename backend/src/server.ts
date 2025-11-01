import "dotenv/config";
import { buildApp } from "./app";
import { readConfig } from "./config";
import { loadContent } from "./services/loader";
import { createIndexStore } from "./services/store";
import { startContentWatcher } from "./services/watcher";
import { registerCatalogueRoutes } from "./routes/catalogue";
import { registerContentRoutes } from "./routes/content";
import { registerQuizRoutes } from "./routes/quiz";
import { registerProgressRoutes } from "./routes/progress";
import { registerImageRoutes } from "./routes/images";
import { createPool, ensureSchema } from "./dal/db";

async function main() {
  const cfg = readConfig();

  // 1) Contenu + store + watcher
  const initialIndex = await loadContent(cfg.CONTENT_DIR);
  const store = createIndexStore(initialIndex);

  // 2) App + sécurité (CORS / rate-limit) via cfg
  const app = buildApp(cfg);

  // 3) Routes
  registerCatalogueRoutes(app, store);
  registerContentRoutes(app, store);
  registerQuizRoutes(app, store);
  registerImageRoutes(app, cfg.CONTENT_DIR);

  // 4) DB (optionnelle)
  let pool: import("../node_modules/@types/pg").Pool | null = null;
  if (cfg.DATABASE_URL) {
    pool = createPool(cfg.DATABASE_URL);
    await ensureSchema(pool);
    app.log.info("PostgreSQL connected & schema ensured");
  } else {
    app.log.warn("DATABASE_URL not set → progression persistence disabled");
  }
  registerProgressRoutes(app, pool);

  // Stats contenu
  const idx = store.current;
  const totalThemes = Object.keys(idx.themes).length;
  let totalCats = 0, totalSubs = 0, totalQ = 0, totalF = 0;
  for (const t of Object.values(idx.themes)) {
    totalCats += Object.keys(t.categories).length;
    for (const c of Object.values(t.categories)) {
      totalSubs += Object.keys(c.subcategories).length;
      for (const s of Object.values(c.subcategories)) {
        totalQ += s.questions.length;
        totalF += s.flashcards.length;
      }
    }
  }
  app.log.info({ contentDir: cfg.CONTENT_DIR, totalThemes, totalCats, totalSubs, totalQ, totalF }, "Content loaded");

  const watcher = startContentWatcher(cfg.CONTENT_DIR, store, (o, msg) => app.log.info(o, msg));

  // 5) Démarrage
  const PORT = cfg.PORT;
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Server listening on http://localhost:${PORT}`);

  // 6) Shutdown propre
  const onExit = async () => {
    try { await watcher.close(); } catch {}
    try { await pool?.end(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", onExit);
  process.on("SIGTERM", onExit);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
