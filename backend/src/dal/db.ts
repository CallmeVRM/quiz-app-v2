import { Pool } from "pg";

/** Crée un pool PostgreSQL à partir de DATABASE_URL */
export function createPool(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  return pool;
}

/** Crée le schéma minimal si absent */
export async function ensureSchema(pool: Pool) {
  await pool.query(`
    create table if not exists progress (
      uuid            text not null,
      theme           text not null,
      category        text not null,
      subcategory     text not null,
      total_questions integer not null,
      answered        integer not null,
      correct         integer not null,
      updated_at      timestamptz not null default now(),
      primary key (uuid, theme, category, subcategory)
    );
    create index if not exists idx_progress_uuid on progress (uuid);
    create index if not exists idx_progress_uuid_theme on progress (uuid, theme);
    create index if not exists idx_progress_uuid_theme_cat on progress (uuid, theme, category);

    create table if not exists attempts (
      id              serial primary key,
      uuid            text not null,
      theme           text not null,
      category        text not null,
      subcategory     text not null,
      total_questions integer not null,
      answered        integer not null,
      correct         integer not null,
      score           integer not null, -- pourcentage 0-100
      created_at      timestamptz not null default now()
    );
    create index if not exists idx_attempts_uuid on attempts (uuid);
    create index if not exists idx_attempts_uuid_theme on attempts (uuid, theme);
    create index if not exists idx_attempts_uuid_subcat on attempts (uuid, theme, category, subcategory);
  `);
}
