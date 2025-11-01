import fs from "node:fs/promises";
import { parse as parseYamlRaw } from "yaml";
import { ZodSchema } from "zod";
import { makeErrorReply, summarizeZodIssues } from "./errors";

/** Parse YAML (string) + validation Zod → renvoie l'objet typé ou lance une erreur 422 */
export function parseYamlTyped<T>(text: string, schema: ZodSchema<T>): T {
  let raw: unknown;
  try {
    raw = parseYamlRaw(text);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const err: any = new Error(`Invalid YAML: ${msg}`);
    err.statusCode = 422;
    err.payload = makeErrorReply("UNPROCESSABLE_ENTITY", err.message);
    throw err;
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const msg = summarizeZodIssues(parsed.error.issues);
    const err: any = new Error(`Schema validation failed: ${msg}`);
    err.statusCode = 422;
    err.payload = makeErrorReply("UNPROCESSABLE_ENTITY", err.message, parsed.error.format());
    throw err;
  }
  return parsed.data;
}

/** Parse un fichier YAML + validation Zod → renvoie l'objet typé (utilitaire pour l'étape 2) */
export async function parseYamlFileTyped<T>(filePath: string, schema: ZodSchema<T>): Promise<T> {
  const buf = await fs.readFile(filePath, "utf8");
  return parseYamlTyped(buf, schema);
}
