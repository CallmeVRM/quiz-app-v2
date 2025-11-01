import type { FastifyInstance } from "fastify";
import type { IndexStore } from "../services/store";
import { makeErrorReply } from "../utils/errors";
import { z } from "zod";

function getIndex(store: IndexStore) {
  return store.current;
}

function findSub(index: ReturnType<typeof getIndex>, theme: string, category: string, sub: string) {
  const t = index.themes[theme];
  if (!t) return { error: makeErrorReply("NOT_FOUND", `Unknown theme '${theme}'`) };
  const c = t.categories[category];
  if (!c) return { error: makeErrorReply("NOT_FOUND", `Unknown category '${category}' for theme '${theme}'`) };
  const s = c.subcategories[sub];
  if (!s) return { error: makeErrorReply("NOT_FOUND", `Unknown subcategory '${sub}' for ${theme}/${category}`) };
  return { t, c, s };
}

const VerifySchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      // Pour single choice
      selectedIndex: z.number().int().nonnegative().optional(),
      // Pour multiple choice
      selectedIndices: z.array(z.number().int().nonnegative()).optional(),
      // Pour order questions
      selectedOrder: z.array(z.number().int().nonnegative()).optional()
    })
  ).min(1)
});

export function registerQuizRoutes(app: FastifyInstance, store: IndexStore) {
  app.post<{
    Params: { theme: string; category: string; subcategory: string };
    Body: unknown;
  }>("/themes/:theme/:category/:subcategory/verify", async (req, reply) => {
    const { theme, category, subcategory } = req.params;

    // 1) Sous-arbre
    const index = getIndex(store);
    const found = findSub(index, theme, category, subcategory);
    if ("error" in found) return reply.status(404).send(found.error);
    const { s } = found;

    // 2) Parse + invariants sur le payload
    const parsed = VerifySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", parsed.error.message, parsed.error.format()));
    }
    const { answers } = parsed.data;

    // 3) Index des questions (source de vérité)
    const qById = new Map(s.questions.map(q => [q.id, q]));

    // 3.a) Duplicates ?
    const seen = new Set<string>();
    for (const a of answers) {
      if (seen.has(a.questionId)) {
        return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `Duplicate questionId '${a.questionId}'`));
      }
      seen.add(a.questionId);
    }

    // 3.b) Validation selon le type de question
    for (const a of answers) {
      const q = qById.get(a.questionId);
      if (!q) {
        return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `Unknown questionId '${a.questionId}'`));
      }

      const qType = q.type || "single";
      
      if (qType === "order") {
        if (!a.selectedOrder || !q.items) {
          return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `Invalid order answer for '${a.questionId}'`));
        }
        // Pour les questions avec distracteurs, accepter selectedOrder.length === correctOrder.length
        const expectedLength = q.correctOrder?.length || q.items.length;
        if (a.selectedOrder.length !== expectedLength) {
          return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `selectedOrder length mismatch for '${a.questionId}' (expected ${expectedLength}, got ${a.selectedOrder.length})`));
        }
      } else if (qType === "multiple") {
        if (!a.selectedIndices || !q.options) {
          return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `Invalid multiple choice answer for '${a.questionId}'`));
        }
        for (const idx of a.selectedIndices) {
          if (idx >= q.options.length) {
            return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `selectedIndex out of range for '${a.questionId}'`));
          }
        }
      } else {
        // single choice
        if (a.selectedIndex === undefined || !q.options) {
          return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `Invalid single choice answer for '${a.questionId}'`));
        }
        if (a.selectedIndex >= q.options.length) {
          return reply.status(422).send(makeErrorReply("UNPROCESSABLE_ENTITY", `selectedIndex out of range for '${a.questionId}'`));
        }
      }
    }

    // 4) Calcul serveur - logique selon le type
    const results = answers.map(a => {
      const q = qById.get(a.questionId)!;
      const qType = q.type || "single";
      
      let isCorrect = false;
      let correctAnswer: any;

      if (qType === "order") {
        correctAnswer = q.correctOrder;
        isCorrect = JSON.stringify(a.selectedOrder) === JSON.stringify(q.correctOrder);
      } else if (qType === "multiple") {
        correctAnswer = q.correctIndices;
        // Vérifier que toutes les bonnes réponses sont sélectionnées et aucune mauvaise
        const selected = new Set(a.selectedIndices || []);
        const correct = new Set(q.correctIndices || []);
        isCorrect = selected.size === correct.size && [...correct].every(idx => selected.has(idx));
      } else {
        // single choice - support des deux formats
        correctAnswer = q.correctIndex !== undefined ? q.correctIndex : (q.correctIndices?.[0]);
        isCorrect = a.selectedIndex === correctAnswer;
      }

      return {
        questionId: a.questionId,
        selectedAnswer: a.selectedIndex ?? a.selectedIndices ?? a.selectedOrder,
        correctAnswer,
        isCorrect
      };
    });

    const correct = results.filter(r => r.isCorrect).length;

    return reply.send({
      id: `${theme}/${category}/${subcategory}`,
      totalQuestions: s.questions.length,
      answered: answers.length,
      correct,
      results
    });
  });
}
