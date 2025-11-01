import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { parseYamlFileTyped } from "../utils/yaml";
import {
  ThemeMetaSchema,
  CategoryMetaSchema,
  SubcategoryMetaSchema,
  QuestionSchema,
  FlashcardSchema
} from "../domain/schemas";
import type { ContentIndex, ThemeIndex, CategoryIndex, SubcategoryIndex } from "../domain/indexTypes";

async function exists(p: string): Promise<boolean> {
  try { await fs.stat(p); return true; } catch { return false; }
}

export async function loadContent(contentDir: string): Promise<ContentIndex> {
  const themesRoot = path.join(contentDir, "themes");
  const out: ContentIndex = { root: contentDir, themes: {} };

  if (!await exists(themesRoot)) {
    // pas de contenu → retourne un index vide
    return out;
  }

  const themeDirs = (await fs.readdir(themesRoot, { withFileTypes: true }))
    .filter(d => d.isDirectory()).map(d => d.name);

  for (const theme of themeDirs) {
    const themeDir = path.join(themesRoot, theme);
    const themeMeta = await parseYamlFileTyped(path.join(themeDir, "meta.yaml"), ThemeMetaSchema);
    const themeIndex: ThemeIndex = { slug: theme, meta: themeMeta, categories: {} };

    const catDirs = (await fs.readdir(themeDir, { withFileTypes: true }))
      .filter(d => d.isDirectory()).map(d => d.name);

    for (const cat of catDirs) {
      const catDir = path.join(themeDir, cat);
      // ignore le dossier "themes/<theme>/meta.yaml" (pas un sous-dossier)
      if (!await exists(path.join(catDir, "meta.yaml"))) continue;

      const catMeta = await parseYamlFileTyped(path.join(catDir, "meta.yaml"), CategoryMetaSchema);
      const catIndex: CategoryIndex = { slug: cat, meta: catMeta, subcategories: {} };

      const subDirs = (await fs.readdir(catDir, { withFileTypes: true }))
        .filter(d => d.isDirectory()).map(d => d.name);

      for (const sub of subDirs) {
        const subDir = path.join(catDir, sub);
        const subMetaPath = path.join(subDir, "meta.yaml");
        if (!await exists(subMetaPath)) continue;

        const subMeta = await parseYamlFileTyped(subMetaPath, SubcategoryMetaSchema);

        // questions.yaml (liste)
        const qPath = path.join(subDir, "questions.yaml");
        let questions = [] as z.infer<typeof QuestionSchema>[];
        if (await exists(qPath)) {
          questions = await parseYamlFileTyped(qPath, z.array(QuestionSchema));
        }

        // flashcards.yaml (liste)
        const fPath = path.join(subDir, "flashcards.yaml");
        let flashcards = [] as z.infer<typeof FlashcardSchema>[];
        if (await exists(fPath)) {
          flashcards = await parseYamlFileTyped(fPath, z.array(FlashcardSchema));
        }

        const subIndex: SubcategoryIndex = {
          slug: sub,
          meta: subMeta,
          questions,
          flashcards
        };

        catIndex.subcategories[sub] = subIndex;
      }

      themeIndex.categories[cat] = catIndex;
    }

    out.themes[theme] = themeIndex;
  }

  return out;
}
