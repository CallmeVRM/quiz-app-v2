const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export type ThemeItem = {
  slug: string;
  title?: string;
  description?: string;
};

export type CategoryItem = {
  slug: string;
  title?: string;
  counts?: { questions?: number; flashcards?: number };
};

export type SubcategoryItem = {
  slug: string;
  title?: string;
  estimatedTimeMin?: number;
  counts?: { questions?: number; flashcards?: number };
};

export async function listThemes(): Promise<{ themes: ThemeItem[] }> {
  const r = await fetch(`${BASE}/themes`);
  if (!r.ok) throw new Error(`GET /themes -> ${r.status}`);
  return r.json();
}

export async function getTheme(theme: string): Promise<{ theme: ThemeItem; categories: CategoryItem[] }> {
  const r = await fetch(`${BASE}/themes/${encodeURIComponent(theme)}`);
  if (!r.ok) throw new Error(`GET /themes/${theme} -> ${r.status}`);
  return r.json();
}

export async function getCategory(theme: string, category: string): Promise<{
  theme: ThemeItem;
  category: CategoryItem;
  subcategories: SubcategoryItem[];
}> {
  const r = await fetch(`${BASE}/themes/${encodeURIComponent(theme)}/${encodeURIComponent(category)}`);
  if (!r.ok) throw new Error(`GET /themes/${theme}/${category} -> ${r.status}`);
  return r.json();
}
