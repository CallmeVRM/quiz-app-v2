import type { Pool } from "pg";

export type ProgressUpsert = {
  uuid: string;
  theme: string;
  category: string;
  subcategory: string;
  totalQuestions: number;
  answered: number;
  correct: number;
};

export async function upsertProgress(pool: Pool, p: ProgressUpsert) {
  await pool.query(
    `
    insert into progress (uuid, theme, category, subcategory, total_questions, answered, correct, updated_at)
    values ($1,$2,$3,$4,$5,$6,$7, now())
    on conflict (uuid, theme, category, subcategory)
    do update set
      total_questions = excluded.total_questions,
      answered        = excluded.answered,
      correct         = excluded.correct,
      updated_at      = now()
    `,
    [p.uuid, p.theme, p.category, p.subcategory, p.totalQuestions, p.answered, p.correct]
  );
}

export async function resetProgress(pool: Pool, uuid: string, theme?: string) {
  if (theme) {
    // Reset un thème spécifique
    await pool.query(`delete from progress where uuid = $1 and theme = $2`, [uuid, theme]);
    await pool.query(`delete from attempts where uuid = $1 and theme = $2`, [uuid, theme]);
  } else {
    // Reset complet
    await pool.query(`delete from progress where uuid = $1`, [uuid]);
    await pool.query(`delete from attempts where uuid = $1`, [uuid]);
  }
}

export type AttemptInsert = {
  uuid: string;
  theme: string;
  category: string;
  subcategory: string;
  totalQuestions: number;
  answered: number;
  correct: number;
  score: number;
};

export async function insertAttempt(pool: Pool, a: AttemptInsert) {
  await pool.query(
    `
    insert into attempts (uuid, theme, category, subcategory, total_questions, answered, correct, score, created_at)
    values ($1, $2, $3, $4, $5, $6, $7, $8, now())
    `,
    [a.uuid, a.theme, a.category, a.subcategory, a.totalQuestions, a.answered, a.correct, a.score]
  );
}

export type AggRow = { key: string; total: number; answered: number; correct: number };

export async function getAggregates(pool: Pool, uuid: string) {
  const byTheme = await pool.query<{ theme: string; total: number; answered: number; correct: number }>(
    `
    select theme,
           sum(total_questions) as total,
           sum(answered) as answered,
           sum(correct) as correct
    from progress
    where uuid = $1
    group by theme
    order by theme
    `,
    [uuid]
  );

  const byCategory = await pool.query<{ theme: string; category: string; total: number; answered: number; correct: number }>(
    `
    select theme, category,
           sum(total_questions) as total,
           sum(answered) as answered,
           sum(correct) as correct
    from progress
    where uuid = $1
    group by theme, category
    order by theme, category
    `,
    [uuid]
  );

  const bySubcategory = await pool.query<
    { theme: string; category: string; subcategory: string; total: number; answered: number; correct: number; updated_at: string }
  >(
    `
    select theme, category, subcategory,
           total_questions as total,
           answered, correct,
           to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
    from progress
    where uuid = $1
    order by theme, category, subcategory
    `,
    [uuid]
  );

  const totals = await pool.query<{ total: number; answered: number; correct: number }>(
    `
    select coalesce(sum(total_questions),0) as total,
           coalesce(sum(answered),0)        as answered,
           coalesce(sum(correct),0)         as correct
    from progress
    where uuid = $1
    `,
    [uuid]
  );

  // Get attempt statistics (average score and best score)
  const attemptStats = await pool.query<{
    theme: string;
    category: string;
    subcategory: string;
    attempts: number;
    avg_score: number;
    best_score: number;
  }>(
    `
    select theme, category, subcategory,
           count(*) as attempts,
           round(avg(score)) as avg_score,
           max(score) as best_score
    from attempts
    where uuid = $1
    group by theme, category, subcategory
    order by theme, category, subcategory
    `,
    [uuid]
  );

  // Create a map for quick lookup
  const statsMap = new Map<string, { attempts: number; avgScore: number; bestScore: number }>();
  attemptStats.rows.forEach(row => {
    const key = `${row.theme}::${row.category}::${row.subcategory}`;
    statsMap.set(key, {
      attempts: row.attempts,
      avgScore: row.avg_score,
      bestScore: row.best_score
    });
  });

  // Transform data to match frontend expectations
  return {
    byTheme: byTheme.rows.map(r => ({ 
      theme: r.theme, 
      answered: r.answered, 
      correct: r.correct, 
      totalQuestions: r.total 
    })),
    byCategory: byCategory.rows.map(r => ({ 
      theme: r.theme, 
      category: r.category, 
      answered: r.answered, 
      correct: r.correct, 
      totalQuestions: r.total 
    })),
    bySubcategory: bySubcategory.rows.map(r => {
      const key = `${r.theme}::${r.category}::${r.subcategory}`;
      const stats = statsMap.get(key) || { attempts: 0, avgScore: 0, bestScore: 0 };
      return {
        theme: r.theme, 
        category: r.category, 
        subcategory: r.subcategory, 
        answered: r.answered, 
        correct: r.correct, 
        totalQuestions: r.total,
        attempts: stats.attempts,
        avgScore: stats.avgScore,
        bestScore: stats.bestScore
      };
    }),
    totals: totals.rows[0] ? { 
      answered: totals.rows[0].answered, 
      correct: totals.rows[0].correct, 
      totalQuestions: totals.rows[0].total 
    } : { answered: 0, correct: 0, totalQuestions: 0 }
  };
}
