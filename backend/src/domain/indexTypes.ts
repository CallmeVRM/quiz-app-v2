import type { ThemeMeta, CategoryMeta, SubcategoryMeta, Question, Flashcard } from "./schemas";

export type ThemeId = string;
export type CategoryId = string;
export type SubcategoryId = string;

export interface SubcategoryIndex {
  slug: SubcategoryId;
  meta: SubcategoryMeta;
  questions: Question[];
  flashcards: Flashcard[];
}

export interface CategoryIndex {
  slug: CategoryId;
  meta: CategoryMeta;
  subcategories: Record<SubcategoryId, SubcategoryIndex>;
}

export interface ThemeIndex {
  slug: ThemeId;
  meta: ThemeMeta;
  categories: Record<CategoryId, CategoryIndex>;
}

export interface ContentIndex {
  root: string;
  themes: Record<ThemeId, ThemeIndex>;
}
