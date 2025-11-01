import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { AppConfig } from "./config";
import { makeErrorReply } from "./utils/errors";
import {
  ThemeMetaSchema,
  CategoryMetaSchema,
  SubcategoryMetaSchema,
  QuestionSchema,
  FlashcardSchema
} from "./domain/schemas";
import { parseYamlTyped } from "./utils/yaml";

function registerDevValidationRoute(app: FastifyInstance) {
  app.addContentTypeParser("text/plain", { parseAs: "string" }, (_req, body, done) => done(null, body as string));

  app.post<{
    Params: { kind: "theme" | "category" | "subcategory" | "question" | "flashcard" };
    Body: string;
  }>("/dev/validate/:kind", async (req, reply) => {
    const { kind } = req.params;
    const yaml = req.body;

    let data: any;
    try {
      switch (kind) {
        case "theme":
          data = parseYamlTyped(yaml, ThemeMetaSchema);
          break;
        case "category":
          data = parseYamlTyped(yaml, CategoryMetaSchema);
          break;
        case "subcategory":
          data = parseYamlTyped(yaml, SubcategoryMetaSchema);
          break;
        case "question":
          data = parseYamlTyped(yaml, QuestionSchema);
          break;
        case "flashcard":
          data = parseYamlTyped(yaml, FlashcardSchema);
          break;
      }
      return reply.status(200).send({ ok: true, kind, data });
    } catch (e: any) {
      const status = e?.statusCode ?? 422;
      return reply.status(status).send(e?.payload ?? makeErrorReply("UNPROCESSABLE_ENTITY", e?.message ?? "Invalid payload"));
    }
  });
}

export function buildApp(cfg: AppConfig) {
  const app = Fastify({ logger: true });

  // --- CORS désactivé - Traefik gère le routage
  // Pas de restriction d'origine
  app.register(cors, {
    origin: true,  // Accepte toutes les origines
    credentials: true
  });

  // --- Rate-limit (429)
  app.register(rateLimit, {
    max: cfg.RATE_LIMIT_MAX,
    timeWindow: cfg.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_req, _ctx) => makeErrorReply(
      "RATE_LIMITED",
      `Too many requests. Try again later.`,
    )
  });

  // --- Routes de base
  app.get("/health", async () => {
    return {
      status: "ok",
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
  });

  // Dev-only validator
  registerDevValidationRoute(app);

  // --- Error handler uniforme
  app.setErrorHandler((err, _req, reply) => {
    const status = (err as any)?.statusCode ?? 500;
    const code =
      status === 404 ? "NOT_FOUND" :
      status === 400 ? "BAD_REQUEST" :
      status === 422 ? "UNPROCESSABLE_ENTITY" :
      status === 429 ? "RATE_LIMITED" :
      "INTERNAL_ERROR";

    const payload = (err as any)?.payload ?? makeErrorReply(code, err.message || "Unexpected error");
    reply.status(status).send(payload);
  });

  return app;
}
