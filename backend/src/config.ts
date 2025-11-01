import { z } from "zod";
import path from "node:path";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  CONTENT_DIR: z.string().default(path.resolve(process.cwd(), "content")),
  DATABASE_URL: z.string().url().optional(),
  // CORS: liste séparée par des virgules (ex: "http://localhost:5173,https://example.com")
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  // Rate-limit basique
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),          // 120 req / fenêtre
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000)   // fenêtre 60s
});

export type AppConfig = z.infer<typeof EnvSchema>;

export function readConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.format());
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}
