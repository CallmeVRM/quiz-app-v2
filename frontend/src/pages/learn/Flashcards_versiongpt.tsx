import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLearnSession from "../../store/sessionLearn";
import useFlash from "../../store/flash";
import { fetchSubcatFlashcards } from "../../lib/quizApi";

// Types très souples pour éviter les blocages de rendu
type AnyObj = Record<string, any>;
type Flashcard = {
  id: string;
  concept?: any;
  command?: any;
  examples?: any;
  image?: string | null;
  explanation?: any;
};

type FCItem = {
  theme: string;
  category: string;
  subcat: string;
  fc: Flashcard;
};

// Helpers robustes pour le rendu (ne JAMAIS passer un objet direct à React)
function isObject(v: any): v is AnyObj {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre style={{
      background: "#f8f8f8",
      border: "1px solid #eee",
      borderRadius: 8,
      padding: 8,
      overflow: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }}>
      {children}
    </pre>
  );
}

// Rend un "contenu code-like" (string | array | object {code|cmd|command})
function renderCodeLike(value: any): React.ReactNode {
  if (value == null) return null;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <CodeBlock>{String(value)}</CodeBlock>;
  }

  if (Array.isArray(value)) {
    return (
      <div style={{ display: "grid", gap: 8 }}>
        {value.map((v, i) => (
          <div key={i}>{renderCodeLike(v)}</div>
        ))}
      </div>
    );
  }

  if (isObject(value)) {
    const code = value.code ?? value.cmd ?? value.command ?? null;
    const title = value.title ?? value.name ?? null;
    return (
      <div>
        {title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{String(title)}</div> : null}
        {code ? <CodeBlock>{String(code)}</CodeBlock> : <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock>}
      </div>
    );
  }

  // fallback
  return <CodeBlock>{String(value)}</CodeBlock>;
}

// Rend un "contenu texte" (string | array | object pretty)
function renderTextLike(value: any): React.ReactNode {
  if (value == null) return <span style={{ color: "#666" }}>—</span>;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    return (
      <ul style={{ marginTop: 4 }}>
        {value.map((v, i) => (
          <li key={i}>{renderTextLike(v)}</li>
        ))}
      </ul>
    );
  }

  if (isObject(value)) {
    // Cas fréquent { title, code } => on affiche title + code
    const title = value.title ?? value.name ?? null;
    const code = value.code ?? value.cmd ?? value.command ?? null;
    if (title || code) {
      return (
        <div>
          {title ? <div style={{ fontWeight: 600, marginBottom: 6 }}>{String(title)}</div> : null}
          {code ? <CodeBlock>{String(code)}</CodeBlock> : null}
          {!code && !title ? <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock> : null}
        </div>
      );
    }
    // Sinon pretty-print
    return <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock>;
  }

  return <span>{String(value)}</span>;
}

export default function LearnFlashcards() {
  const nav = useNavigate();
  const { selection, reset } = useLearnSession();

  const marks = useFlash((st) => st.marks);
  const toggleMark = useFlash((st) => st.toggleMark);
  const clearMarks = useFlash((st) => st.clear);

  const [items, setItems] = useState<FCItem[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);
  const [filterMarked, setFilterMarked] = useState<boolean>(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // redirect si pas de sélection
  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) {
      nav("/flashcards");
    }
  }, [selection, nav]);

  // chargement des flashcards
  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) return;
    let stop = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res: FCItem[] = [];
        for (const tok of selection.subcategories) {
          const [cat, sub] = tok.split("::");
          const j = await fetchSubcatFlashcards(selection.theme!, cat, sub);
          for (const fcRaw of j.items as Flashcard[]) {
            // Normalisation soft : examples -> array
            const fc: Flashcard = {
              ...fcRaw,
              examples: Array.isArray(fcRaw.examples)
                ? fcRaw.examples
                : (fcRaw.examples != null ? [fcRaw.examples] : []),
            };
            res.push({ theme: selection.theme!, category: cat, subcat: sub, fc });
          }
        }
        if (!stop) { setItems(res); setIdx(0); setShowBack(false); }
      } catch (e) {
        if (!stop) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [selection]);

  const filtered = useMemo(() => {
    if (!filterMarked) return items;
    return items.filter(it => marks[`${it.category}::${it.subcat}::${it.fc.id}`]);
  }, [items, marks, filterMarked]);

  useEffect(() => {
    if (idx >= filtered.length) setIdx(0);
  }, [filtered.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selection.theme || selection.subcategories.length === 0) return null;
  if (loading) return <div style={{ padding: 16 }}>Chargement…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Erreur: {err}</div>;
  if (filtered.length === 0) return <div style={{ padding: 16 }}>Aucune flashcard à afficher (vérifie le filtre “Marquées”).</div>;

  const cur = filtered[idx];
  const key = `${cur.category}::${cur.subcat}::${cur.fc.id}`;
  const isMarked = !!marks[key];

  function prev() { setShowBack(false); setIdx(i => Math.max(0, i - 1)); }
  function next() { setShowBack(false); setIdx(i => Math.min(filtered.length - 1, i + 1)); }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div><b>{idx + 1}</b> / {filtered.length}</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={filterMarked} onChange={e => setFilterMarked(e.target.checked)} />
            Afficher uniquement les “à revoir”
          </label>
          <button onClick={() => { clearMarks(); }} disabled={Object.keys(marks).length === 0}>
            Reset marques
          </button>
        </div>
      </div>

      <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          {cur.theme} / {cur.category} / {cur.subcat} — <code>{String(cur.fc.id)}</code>
        </div>

        {!showBack ? (
          <div>
            {cur.fc.image && (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={String(cur.fc.image)}
                  alt={typeof cur.fc.concept === "string" ? String(cur.fc.concept) : "flashcard"}
                  style={{ maxWidth: "100%", borderRadius: 8 }}
                />
              </div>
            )}

            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              {renderTextLike(cur.fc.concept ?? "Concept")}
            </div>

            {cur.fc.command && (
              <div style={{ marginBottom: 12 }}>
                {renderCodeLike(cur.fc.command)}
              </div>
            )}

            {Array.isArray(cur.fc.examples) && cur.fc.examples.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Exemples</div>
                <ul style={{ marginTop: 4 }}>
                  {cur.fc.examples.map((ex, i) => (
                    <li key={i}>{renderTextLike(ex)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Explications</div>
            {renderTextLike(cur.fc.explanation)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <button onClick={prev} disabled={idx === 0}>← Précédente</button>
          <button onClick={() => setShowBack(b => !b)}>{showBack ? "Afficher recto" : "Retourner"}</button>
          <button onClick={next} disabled={idx === filtered.length - 1}>Suivante →</button>

          <button onClick={() => toggleMark(key)} style={{ marginLeft: 8 }}>
            {isMarked ? "Retirer “à revoir”" : "Marquer “à revoir”"}
          </button>

          <button onClick={() => { reset(); nav("/flashcards"); }} style={{ marginLeft: "auto" }}>
            Reset sélection
          </button>
        </div>
      </div>
    </div>
  );
}