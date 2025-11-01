import chokidar from "chokidar";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { IndexStore } from "./store";
import type { ContentIndex, ThemeIndex, CategoryIndex, SubcategoryIndex } from "../domain/indexTypes";
import {
  ThemeMetaSchema,
  CategoryMetaSchema,
  SubcategoryMetaSchema,
  QuestionSchema,
  FlashcardSchema
} from "../domain/schemas";
import { parseYamlFileTyped } from "../utils/yaml";

type Scope =
  | { kind: "themeMeta"; theme: string; dir: string }
  | { kind: "categoryMeta"; theme: string; category: string; dir: string }
  | { kind: "subcategoryMeta"; theme: string; category: string; sub: string; dir: string }
  | { kind: "questions"; theme: string; category: string; sub: string; file: string }
  | { kind: "flashcards"; theme: string; category: string; sub: string; file: string }
  | { kind: "unknown" };

function normalize(p: string) {
  return p.replace(/\\/g, "/");
}

function pathToScope(root: string, filePath: string): Scope {
  const p = normalize(path.relative(root, filePath));
  // attendu: themes/<theme>/meta.yaml
  //          themes/<theme>/<category>/meta.yaml
  //          themes/<theme>/<category>/<sub>/meta.yaml|questions.yaml|flashcards.yaml
  const parts = p.split("/");
  if (parts[0] !== "themes") return { kind: "unknown" };

  if (parts.length === 3 && parts[2] === "meta.yaml") {
    const theme = parts[1];
    return { kind: "themeMeta", theme, dir: path.join(root, "themes", theme) };
  }

  if (parts.length === 4 && parts[3] === "meta.yaml") {
    const theme = parts[1], category = parts[2];
    return { kind: "categoryMeta", theme, category, dir: path.join(root, "themes", theme, category) };
  }

  if (parts.length === 5 && parts[4] === "meta.yaml") {
    const theme = parts[1], category = parts[2], sub = parts[3];
    return { kind: "subcategoryMeta", theme, category, sub, dir: path.join(root, "themes", theme, category, sub) };
  }

  if (parts.length === 5 && (parts[4] === "questions.yaml" || parts[4] === "flashcards.yaml")) {
    const theme = parts[1], category = parts[2], sub = parts[3];
    if (parts[4] === "questions.yaml") {
      return { kind: "questions", theme, category, sub, file: path.join(root, "themes", theme, category, sub, "questions.yaml") };
    } else {
      return { kind: "flashcards", theme, category, sub, file: path.join(root, "themes", theme, category, sub, "flashcards.yaml") };
    }
  }

  return { kind: "unknown" };
}

async function fileExists(p: string) {
  try { await fs.stat(p); return true; } catch { return false; }
}

async function reloadTheme(root: string, store: IndexStore, theme: string) {
  const dir = path.join(root, "themes", theme);
  const metaPath = path.join(dir, "meta.yaml");
  if (!(await fileExists(metaPath))) {
    // suppression du thème
    delete store.current.themes[theme];
    return;
  }
  const meta = await parseYamlFileTyped(metaPath, ThemeMetaSchema);

  // préserver catégories existantes si présentes
  const existing = store.current.themes[theme]?.categories ?? {};
  const t: ThemeIndex = { slug: theme, meta, categories: existing };
  store.current.themes[theme] = t;
}

async function reloadCategory(root: string, store: IndexStore, theme: string, category: string) {
  const dir = path.join(root, "themes", theme, category);
  const metaPath = path.join(dir, "meta.yaml");
  const themeNode = store.current.themes[theme];
  if (!themeNode) return; // thème absent
  if (!(await fileExists(metaPath))) {
    delete themeNode.categories[category];
    return;
  }
  const meta = await parseYamlFileTyped(metaPath, CategoryMetaSchema);
  const existing = themeNode.categories[category]?.subcategories ?? {};
  const c: CategoryIndex = { slug: category, meta, subcategories: existing };
  themeNode.categories[category] = c;
}

async function reloadSubMeta(root: string, store: IndexStore, theme: string, category: string, sub: string) {
  const dir = path.join(root, "themes", theme, category, sub);
  const metaPath = path.join(dir, "meta.yaml");
  const themeNode = store.current.themes[theme];
  if (!themeNode) return;
  const catNode = themeNode.categories[category];
  if (!catNode) return;

  if (!(await fileExists(metaPath))) {
    delete catNode.subcategories[sub];
    return;
  }
  const meta = await parseYamlFileTyped(metaPath, SubcategoryMetaSchema);
  const existing = catNode.subcategories[sub] ?? { slug: sub, meta, questions: [], flashcards: [] };
  const s: SubcategoryIndex = { slug: sub, meta, questions: existing.questions ?? [], flashcards: existing.flashcards ?? [] };
  catNode.subcategories[sub] = s;
}

async function reloadQuestions(root: string, store: IndexStore, theme: string, category: string, sub: string) {
  const dir = path.join(root, "themes", theme, category, sub);
  const file = path.join(dir, "questions.yaml");
  const themeNode = store.current.themes[theme];
  if (!themeNode) return;
  const catNode = themeNode.categories[category];
  if (!catNode) return;
  const subNode = catNode.subcategories[sub];
  if (!subNode) return;

  if (!(await fileExists(file))) { subNode.questions = []; return; }
  const arr = await parseYamlFileTyped(file, z.array(QuestionSchema));
  subNode.questions = arr;
}

async function reloadFlashcards(root: string, store: IndexStore, theme: string, category: string, sub: string) {
  const dir = path.join(root, "themes", theme, category, sub);
  const file = path.join(dir, "flashcards.yaml");
  const themeNode = store.current.themes[theme];
  if (!themeNode) return;
  const catNode = themeNode.categories[category];
  if (!catNode) return;
  const subNode = catNode.subcategories[sub];
  if (!subNode) return;

  if (!(await fileExists(file))) { subNode.flashcards = []; return; }
  const arr = await parseYamlFileTyped(file, z.array(FlashcardSchema));
  subNode.flashcards = arr;
}

export function startContentWatcher(root: string, store: IndexStore, log?: (o: any, m?: string) => void) {
  const watcher = chokidar.watch(path.join(root, "themes"), {
    ignoreInitial: true,
    depth: 5,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  });

  function l(info: any, msg: string) {
    try { log?.(info, msg); } catch { /* no-op */ }
  }

  async function onFileChange(event: string, filePath: string) {
    const scope = pathToScope(root, filePath);
    if (scope.kind === "unknown") return;

    try {
      switch (scope.kind) {
        case "themeMeta":
          await reloadTheme(root, store, scope.theme);
          l({ event, scope }, "Theme meta reloaded");
          break;
        case "categoryMeta":
          await reloadCategory(root, store, scope.theme, scope.category);
          l({ event, scope }, "Category meta reloaded");
          break;
        case "subcategoryMeta":
          await reloadSubMeta(root, store, scope.theme, scope.category, scope.sub);
          l({ event, scope }, "Subcategory meta reloaded");
          break;
        case "questions":
          await reloadQuestions(root, store, scope.theme, scope.category, scope.sub);
          l({ event, scope }, "Questions reloaded");
          break;
        case "flashcards":
          await reloadFlashcards(root, store, scope.theme, scope.category, scope.sub);
          l({ event, scope }, "Flashcards reloaded");
          break;
      }
    } catch (e) {
      l({ event, scope, error: e instanceof Error ? e.message : String(e) }, "Watcher reload error");
    }
  }

  watcher
    .on("add", (p) => onFileChange("add", p))
    .on("change", (p) => onFileChange("change", p))
    .on("unlink", (p) => onFileChange("unlink", p))
    .on("addDir", async (p) => {
      // si un sous-dossier est créé, tenter un reload minimal (meta si présent)
      const s = pathToScope(root, path.join(p, "meta.yaml"));
      if (s.kind === "subcategoryMeta") await onFileChange("addDir-meta", path.join(p, "meta.yaml"));
    })
    .on("unlinkDir", async (p) => {
      // suppression de sous-dossier → recalcul via meta manquante
      const s = pathToScope(root, path.join(p, "meta.yaml"));
      if (s.kind === "subcategoryMeta") await onFileChange("unlinkDir-meta", path.join(p, "meta.yaml"));
    });

  return watcher;
}
