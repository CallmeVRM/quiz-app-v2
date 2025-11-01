import type { FastifyInstance } from "fastify";
import type { IndexStore } from "../services/store";
import { makeErrorReply } from "../utils/errors";

export function registerCatalogueRoutes(app: FastifyInstance, store: IndexStore) {
  // GET /themes
  app.get("/themes", async (_req, reply) => {
    const index = store.current;
    const themes = Object.values(index.themes).map(t => ({
      slug: t.slug,
      title: t.meta.title,
      description: t.meta.description
    }));
    return reply.send({ themes });
  });

  // GET /themes/:theme
  app.get<{
    Params: { theme: string }
  }>("/themes/:theme", async (req, reply) => {
    const index = store.current;
    const { theme } = req.params;
    const t = index.themes[theme];
    if (!t) {
      return reply.status(404).send(makeErrorReply("NOT_FOUND", `Unknown theme '${theme}'`));
    }
    const categories = Object.values(t.categories).map(c => ({
      slug: c.slug,
      title: c.meta.title,
      description: c.meta.description
    }));
    return reply.send({
      theme: { slug: t.slug, title: t.meta.title, description: t.meta.description },
      categories
    });
  });

  // GET /themes/:theme/:category
  app.get<{
    Params: { theme: string; category: string }
  }>("/themes/:theme/:category", async (req, reply) => {
    const index = store.current;
    const { theme, category } = req.params;
    const t = index.themes[theme];
    if (!t) {
      return reply.status(404).send(makeErrorReply("NOT_FOUND", `Unknown theme '${theme}'`));
    }
    const c = t.categories[category];
    if (!c) {
      return reply.status(404).send(makeErrorReply("NOT_FOUND", `Unknown category '${category}' for theme '${theme}'`));
    }

    const subcategories = Object.values(c.subcategories).map(s => ({
      slug: s.slug,
      title: s.meta.title,
      estimatedTimeMin: s.meta.estimatedTimeMin,
      counts: {
        questions: s.questions.length,
        flashcards: s.flashcards.length
      }
    }));

    return reply.send({
      theme: { slug: t.slug, title: t.meta.title },
      category: { slug: c.slug, title: c.meta.title },
      subcategories
    });
  });
}
