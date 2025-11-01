import type { FastifyInstance } from "fastify";
import type { Pool } from "pg";
import { z } from "zod";
import { makeErrorReply } from "../utils/errors";
import { upsertProgress, resetProgress, getAggregates, insertAttempt } from "../dal/progress";

function requireDb(pool: Pool | null) {
  if (!pool) {
    return {
      error: { status: 503, payload: makeErrorReply("PERSISTENCE_DISABLED", "Progression persistence is disabled (DATABASE_URL not set).") }
    };
  }
  return { pool };
}

const UpsertSchema = z.object({
  theme: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  totalQuestions: z.coerce.number().int().min(0),
  answered: z.coerce.number().int().min(0),
  correct: z.coerce.number().int().min(0)
}).superRefine((v, ctx) => {
  if (v.answered > v.totalQuestions) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["answered"], message: "answered > totalQuestions" });
  }
  if (v.correct > v.answered) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["correct"], message: "correct > answered" });
  }
});

export function registerProgressRoutes(app: FastifyInstance, pool: Pool | null) {
  // GET /progress/:uuid
  app.get<{ Params: { uuid: string } }>("/progress/:uuid", async (req, reply) => {
    const need = requireDb(pool);
    if ("error" in need) return reply.status(need.error!.status).send(need.error!.payload);

    const { uuid } = req.params;
    try {
      const agg = await getAggregates(need.pool, uuid);
      return reply.send({ uuid, ...agg });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send(makeErrorReply("DB_ERROR", msg));
    }
  });

  // POST /progress/:uuid (upsert)
  app.post<{ Params: { uuid: string }; Body: unknown }>("/progress/:uuid", async (req, reply) => {
    const need = requireDb(pool);
    if ("error" in need) return reply.status(need.error!.status).send(need.error!.payload);

    const parsed = UpsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", parsed.error.message, parsed.error.format()));
    }

    const { uuid } = req.params;
    const p = parsed.data;

    try {
      await upsertProgress(need.pool, {
        uuid,
        theme: p.theme,
        category: p.category,
        subcategory: p.subcategory,
        totalQuestions: p.totalQuestions,
        answered: p.answered,
        correct: p.correct
      });
      return reply.send({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send(makeErrorReply("DB_ERROR", msg));
    }
  });

  // DELETE /progress/:uuid (reset) - with optional theme query param
  app.delete<{ Params: { uuid: string }; Querystring: { theme?: string } }>("/progress/:uuid", async (req, reply) => {
    const need = requireDb(pool);
    if ("error" in need) return reply.status(need.error!.status).send(need.error!.payload);

    const { uuid } = req.params;
    const { theme } = req.query;
    try {
      await resetProgress(need.pool, uuid, theme);
      return reply.send({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send(makeErrorReply("DB_ERROR", msg));
    }
  });

  // POST /progress/:uuid/attempt (record a quiz attempt with score)
  const AttemptSchema = z.object({
    theme: z.string().min(1),
    category: z.string().min(1),
    subcategory: z.string().min(1),
    totalQuestions: z.coerce.number().int().min(0),
    answered: z.coerce.number().int().min(0),
    correct: z.coerce.number().int().min(0),
    score: z.coerce.number().int().min(0).max(100)
  });

  app.post<{ Params: { uuid: string }; Body: unknown }>("/progress/:uuid/attempt", async (req, reply) => {
    const need = requireDb(pool);
    if ("error" in need) return reply.status(need.error!.status).send(need.error!.payload);

    const parsed = AttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", parsed.error.message, parsed.error.format()));
    }

    const { uuid } = req.params;
    const a = parsed.data;

    try {
      await insertAttempt(need.pool, {
        uuid,
        theme: a.theme,
        category: a.category,
        subcategory: a.subcategory,
        totalQuestions: a.totalQuestions,
        answered: a.answered,
        correct: a.correct,
        score: a.score
      });
      return reply.send({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send(makeErrorReply("DB_ERROR", msg));
    }
  });
}
