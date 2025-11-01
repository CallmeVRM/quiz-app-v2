import { z } from "zod";

/* ========== Métadonnées ========== */

export const ThemeMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});
export type ThemeMeta = z.infer<typeof ThemeMetaSchema>;

export const CategoryMetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});
export type CategoryMeta = z.infer<typeof CategoryMetaSchema>;

export const SubcategoryMetaSchema = z.object({
  title: z.string(),
  estimatedTimeMin: z.number().int().positive().optional(),
  description: z.string().optional(),
});
export type SubcategoryMeta = z.infer<typeof SubcategoryMetaSchema>;

/* ========== Questions ========== */

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["single", "multiple", "order"]).optional().default("single"),
  prompt: z.string(),
  
  // Pour questions "single" et "multiple"
  options: z.array(z.string().min(1)).min(2).optional(),
  
  // Pour questions "single" (ancienne méthode, rétrocompatible)
  correctIndex: z.number().int().nonnegative().optional(),
  
  // Pour questions "multiple" (plusieurs réponses possibles)
  correctIndices: z.array(z.number().int().nonnegative()).optional(),
  
  // Pour questions "order" (rangement)
  items: z.array(z.string().min(1)).optional(),
  correctOrder: z.array(z.number().int().nonnegative()).optional(),
  
  // Images attachées à la question
  images: z.array(z.string()).optional(),
  
  explanation: z.string().optional(),
}).refine((data) => {
  // Validation selon le type
  if (data.type === "order") {
    // Accepter correctOrder avec moins d'éléments que items (pour les questions avec distracteurs)
    return !!(data.items && data.items.length >= 2 && data.correctOrder && 
              data.correctOrder.length >= 2 && data.correctOrder.length <= data.items.length);
  }
  if (data.type === "multiple") {
    return !!(data.options && data.correctIndices && data.correctIndices.length > 0);
  }
  // Pour "single", accepter correctIndex ou correctIndices avec un seul élément
  return !!(data.options && (data.correctIndex !== undefined || (data.correctIndices && data.correctIndices.length === 1)));
}, {
  message: "Invalid question structure for the specified type"
});

export type Question = z.infer<typeof QuestionSchema>;

/* ========== Flashcards (bloc riche) ========== */
/**
 * Un bloc "riche" peut être :
 * - une string simple
 * - un objet { title?, code?, text? } (au moins une clé présente)
 */
export const FcBlockSchema = z.union([
  z.string(),
  z.object({
    title: z.string().optional(),
    code: z.string().optional(),
    text: z.string().optional(),
  }).refine((o) => !!(o.title || o.code || o.text), {
    message: "Empty rich block",
  }),
]);
export type FcBlock = z.infer<typeof FcBlockSchema>;

export const FlashcardSchema = z.object({
  id: z.string(),
  concept: FcBlockSchema.optional(),
  command: FcBlockSchema.optional(),
  examples: z.array(FcBlockSchema).optional(),
  image: z.string().url().nullable().optional(),
  explanation: FcBlockSchema.optional(),
});
export type Flashcard = z.infer<typeof FlashcardSchema>;
