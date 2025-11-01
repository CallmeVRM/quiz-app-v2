import type { FastifyInstance } from "fastify";
import type { IndexStore } from "../services/store";
import { makeErrorReply } from "../utils/errors";
import { shuffleSeeded } from "../utils/shuffle";
import { z } from "zod";

function findSub(index: ReturnType<typeof getIndex>, theme: string, category: string, sub: string) {
  const t = index.themes[theme];
  if (!t) return { error: makeErrorReply("NOT_FOUND", `Unknown theme '${theme}'`) };
  const c = t.categories[category];
  if (!c) return { error: makeErrorReply("NOT_FOUND", `Unknown category '${category}' for theme '${theme}'`) };
  const s = c.subcategories[sub];
  if (!s) return { error: makeErrorReply("NOT_FOUND", `Unknown subcategory '${sub}' for ${theme}/${category}`) };
  return { t, c, s };
}

// helper local pour typer index courant dans findSub
function getIndex(store: IndexStore) {
  return store.current;
}

const QuerySchema = z.object({
  shuffle: z.union([z.string(), z.boolean()]).optional().transform((v) => {
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const x = v.toLowerCase();
      return x === "1" || x === "true" || x === "yes" || x === "on";
    }
    return false;
  }),
  limit: z.coerce.number().int().positive().optional(),
  seed: z.string().optional()
});

export function registerContentRoutes(app: FastifyInstance, store: IndexStore) {
  app.get<{
    Params: { theme: string; category: string; subcategory: string };
    Querystring: { shuffle?: string | boolean; limit?: string | number; seed?: string };
  }>("/themes/:theme/:category/:subcategory/questions", async (req, reply) => {
    const index = getIndex(store);
    const { theme, category, subcategory } = req.params;

    const parsed = QuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send(makeErrorReply("BAD_REQUEST", parsed.error.message));
    }
    const { shuffle, limit, seed } = parsed.data;

    const found = findSub(index, theme, category, subcategory);
    if ("error" in found) return reply.status(404).send(found.error);
    const { s } = found;

    type PublicQuestion = { 
      id: string; 
      type?: string;
      prompt: string; 
      options?: string[]; 
      items?: string[];
      images?: string[];
      explanation?: string;
    };
    let items: PublicQuestion[] = s.questions.map((q) => ({
      id: q.id, 
      type: q.type,
      prompt: q.prompt, 
      options: q.options, 
      items: q.items,
      images: q.images,
      explanation: q.explanation
    }));

    const total = items.length;
    const doShuffle = !!shuffle;
    if (doShuffle) items = shuffleSeeded(items, seed ?? `${theme}:${category}:${subcategory}`);
    if (typeof limit === "number") items = items.slice(0, limit);

    return reply.send({
      id: `${theme}/${category}/${subcategory}`,
      shuffled: doShuffle,
      seed: seed ?? null,
      total,
      returned: items.length,
      items
    });
  });

  app.get<{
    Params: { theme: string; category: string; subcategory: string };
  }>("/themes/:theme/:category/:subcategory/flashcards", async (req, reply) => {
    const index = getIndex(store);
    const { theme, category, subcategory } = req.params;
    const found = findSub(index, theme, category, subcategory);
    if ("error" in found) return reply.status(404).send(found.error);
    const { s } = found;

    return reply.send({
      id: `${theme}/${category}/${subcategory}`,
      total: s.flashcards.length,
      items: s.flashcards
    });
  });
}
