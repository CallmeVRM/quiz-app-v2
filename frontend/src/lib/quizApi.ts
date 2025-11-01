// src/lib/quizApi.ts
const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

/* ===================== QCM ===================== */

export type Question = {
  id: string;
  type?: "single" | "multiple" | "order";
  prompt: string;
  // Pour single et multiple
  options?: string[];
  // Pour order
  items?: string[];
  // Images attachées
  images?: string[];
  // Champs pour la correction (optionnels côté client)
  correctIndex?: number | null;
  correctIndices?: number[];
  correctOrder?: number[];
  explanation?: string | null;
};

export async function fetchSubcatQuestions(
  theme: string,
  category: string,
  sub: string,
  shuffle = true,
  limit?: number,
  seed?: string
) {
  const p = new URLSearchParams();
  if (shuffle) p.set("shuffle", "1");
  if (typeof limit === "number") p.set("limit", String(limit));
  if (seed) p.set("seed", seed);
  const url = `${BASE}/themes/${encodeURIComponent(theme)}/${encodeURIComponent(category)}/${encodeURIComponent(sub)}/questions?${p.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET questions ${theme}/${category}/${sub} -> ${r.status}`);
  return (await r.json()) as {
    id: string;
    shuffled: boolean;
    seed: string | null;
    total: number;
    returned: number;
    items: Question[];
  };
}

export type QuestionAnswer = {
  questionId: string;
  selectedIndex?: number;
  selectedIndices?: number[];
  selectedOrder?: number[];
};

export async function verifySubcatAnswers(
  theme: string,
  category: string,
  sub: string,
  answers: QuestionAnswer[]
) {
  const url = `${BASE}/themes/${encodeURIComponent(theme)}/${encodeURIComponent(category)}/${encodeURIComponent(sub)}/verify`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ answers })
  });
  if (!r.ok) throw new Error(`POST verify ${theme}/${category}/${sub} -> ${r.status}`);
  return (await r.json()) as {
    id: string;
    totalQuestions: number;
    answered: number;
    correct: number;
    results: Array<{ 
      questionId: string; 
      selectedAnswer: any; 
      correctAnswer: any; 
      isCorrect: boolean 
    }>;
  };
}

/* ===================== Flashcards ===================== */

export type Flashcard = {
  id: string;
  concept?: string;
  command?: string | { title: string; code: string };
  examples?: Array<string | { title: string; code: string }>;
  image?: string | null;
  explanation?: string;
};

export async function fetchSubcatFlashcards(theme: string, category: string, sub: string) {
  const url = `${BASE}/themes/${encodeURIComponent(theme)}/${encodeURIComponent(category)}/${encodeURIComponent(sub)}/flashcards`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET flashcards ${theme}/${category}/${sub} -> ${r.status}`);
  return (await r.json()) as {
    id: string;
    total: number;
    returned: number;
    items: Flashcard[];
  };
}

/* ===================== Progress (Postgres) ===================== */

export type ProgressTotals = { answered: number; correct: number; totalQuestions: number };
export type ProgByTheme = { theme: string; answered: number; correct: number; totalQuestions: number };
export type ProgByCategory = { theme: string; category: string; answered: number; correct: number; totalQuestions: number };
export type ProgBySubcat = { 
  theme: string; 
  category: string; 
  subcategory: string; 
  answered: number; 
  correct: number; 
  totalQuestions: number;
  attempts?: number;
  avgScore?: number;
  bestScore?: number;
};

export type ProgressResponse = {
  uuid: string;
  totals?: ProgressTotals;
  byTheme?: ProgByTheme[];
  byCategory?: ProgByCategory[];
  bySubcategory?: ProgBySubcat[];
};

/** Upsert d’un agrégat par sous-catégorie pour un utilisateur (UUID) */
export async function postProgress(
  uuid: string,
  payload: {
    theme: string;
    category: string;
    subcategory: string;
    answered: number;
    correct: number;
    totalQuestions: number;
  }
) {
  const url = `${BASE}/progress/${encodeURIComponent(uuid)}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`POST /progress/${uuid} -> ${r.status}`);
  return (await r.json()) as { ok: true };
}

/** Vue d’ensemble + agrégats */
export async function getProgress(uuid: string) {
  const url = `${BASE}/progress/${encodeURIComponent(uuid)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`GET /progress/${uuid} -> ${r.status}`);
  return (await r.json()) as ProgressResponse;
}

/** Reset global ou par thème (supprime la progression) */
export async function resetProgress(uuid: string, theme?: string) {
  const url = theme 
    ? `${BASE}/progress/${encodeURIComponent(uuid)}?theme=${encodeURIComponent(theme)}`
    : `${BASE}/progress/${encodeURIComponent(uuid)}`;
  const r = await fetch(url, { method: "DELETE" });
  if (!r.ok) throw new Error(`DELETE /progress/${uuid} -> ${r.status}`);
  return (await r.json()) as { ok: true };
}

/** Enregistrer une tentative de quiz avec score */
export async function postAttempt(
  uuid: string,
  payload: {
    theme: string;
    category: string;
    subcategory: string;
    answered: number;
    correct: number;
    totalQuestions: number;
    score: number;
  }
) {
  const url = `${BASE}/progress/${encodeURIComponent(uuid)}/attempt`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`POST /progress/${uuid}/attempt -> ${r.status}`);
  return (await r.json()) as { ok: true };
}

