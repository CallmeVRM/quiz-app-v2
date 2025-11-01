import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useLearnSession from "../../store/sessionLearn";
import useFlash from "../../store/flash";
import { fetchSubcatFlashcards, type Flashcard } from "../../lib/quizApi";
import { shuffleSeeded } from "../../utils/shuffle";
import { ActionBar, ActionButton } from "../../components/ActionBar";
import ContentCard from "../../components/ContentCard";

type FCItem = {
  theme: string;
  category: string;
  subcat: string;
  fc: Flashcard;
};

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

  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) nav("/flashcards");
  }, [selection, nav]);

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
          for (const fc of j.items) res.push({ theme: selection.theme!, category: cat, subcat: sub, fc });
        }
        // Mélange aléatoire des flashcards à chaque session
        const seed = `${selection.theme}/${selection.subcategories.join(",")}:${Date.now()}`;
        const shuffled = shuffleSeeded(res, seed);
        if (!stop) { setItems(shuffled); setIdx(0); setShowBack(false); }
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
    // si filtre actif et plus d'items visibles, on remonte à 0
    if (idx >= filtered.length) setIdx(0);
  }, [filtered.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selection.theme || selection.subcategories.length === 0) return null;
  if (loading) return <div>Chargement…</div>;
  if (err) return <div style={{ color: "crimson" }}>Erreur: {err}</div>;
  if (filtered.length === 0) return <div>Aucune flashcard à afficher (vérifie le filtre "Marquées").</div>;

  const cur = filtered[idx];
  const key = `${cur.category}::${cur.subcat}::${cur.fc.id}`;
  const isMarked = !!marks[key];

  function prev() { setShowBack(false); setIdx(i => Math.max(0, i - 1)); }
  function next() { setShowBack(false); setIdx(i => Math.min(filtered.length - 1, i + 1)); }

  return (
    <div style={{ 
      maxWidth: 900, 
      margin: "0 auto", 
      padding: "1rem",
      paddingBottom: "100px" // Space for ActionBar
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "1.5rem",
        padding: "1rem",
        background: "var(--bg-elev)",
        border: "1px solid var(--border)",
        borderRadius: "12px"
      }}>
        <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text)" }}>
          <b>{idx + 1}</b> / {filtered.length}
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9375rem" }}>
            <input 
              type="checkbox" 
              checked={filterMarked} 
              onChange={e => setFilterMarked(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--accent)", cursor: "pointer" }}
            />
            Afficher "à revoir"
          </label>
          <button 
            onClick={() => { clearMarks(); }} 
            disabled={Object.keys(marks).length === 0}
            style={{
              padding: "0.5rem 1rem",
              background: "var(--bg-elev)",
              border: "2px solid var(--border)",
              borderRadius: "8px",
              cursor: Object.keys(marks).length === 0 ? "not-allowed" : "pointer",
              opacity: Object.keys(marks).length === 0 ? 0.5 : 1,
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text)",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (Object.keys(marks).length > 0) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
            }}
          >
            Reset marques
          </button>
        </div>
      </div>

      <ContentCard 
        style={{ 
          position: "relative",
          border: isMarked ? "3px solid #f59e0b" : "1px solid var(--border)",
          boxShadow: isMarked ? "0 4px 12px rgba(245, 158, 11, 0.2)" : "0 2px 8px rgba(0,0,0,0.04)"
        }}
      >
        {isMarked && (
          <div style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "#f59e0b",
            color: "#fff",
            padding: "0.375rem 0.75rem",
            borderRadius: "50px",
            fontSize: "0.75rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "0.25rem"
          }}>
            À revoir
          </div>
        )}
        
        <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginBottom: "1rem" }}>
          {cur.theme} › {cur.category} › {cur.subcat}
        </div>

        {!showBack ? (
          // Recto - Concept
          <div>
            {cur.fc.image && (
              <div style={{ marginBottom: "1rem" }}>
                <img src={cur.fc.image} alt={String(cur.fc.concept ?? "flashcard")} style={{ maxWidth: "100%", borderRadius: "var(--radius, 8px)" }} />
              </div>
            )}
            <div style={{ 
              fontSize: "1.5rem", 
              fontWeight: 700, 
              marginBottom: "1.5rem",
              color: "var(--text)",
              lineHeight: 1.4
            }}>
              {String(cur.fc.concept ?? "Concept")}
            </div>
            <div style={{
              textAlign: "center",
              padding: "1.5rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius, 8px)",
              border: "2px dashed var(--border)",
              color: "var(--muted)",
              fontSize: "0.9375rem"
            }}>
              Cliquez sur "Retourner" pour voir la réponse
            </div>
          </div>
        ) : (
          // Verso - Command
          <div>
            <div style={{ 
              fontSize: "1.125rem",
              fontWeight: 700, 
              marginBottom: "0.75rem",
              color: "var(--accent)"
            }}>
              {cur.fc.command && typeof cur.fc.command === 'object' && 'title' in cur.fc.command 
                ? String(cur.fc.command.title)
                : "Commande"}
            </div>
            {cur.fc.command && typeof cur.fc.command === 'object' && 'code' in cur.fc.command ? (
              <pre style={{ 
                background: "#282c34", 
                color: "#abb2bf",
                border: "1px solid var(--border)", 
                borderRadius: "var(--radius, 8px)", 
                padding: "1rem", 
                overflow: "auto",
                fontSize: "0.9375rem",
                lineHeight: 1.6,
                fontFamily: "'Courier New', monospace"
              }}>
                {String(cur.fc.command.code).trim()}
              </pre>
            ) : cur.fc.command ? (
              <pre style={{ 
                background: "#282c34", 
                color: "#abb2bf",
                border: "1px solid var(--border)", 
                borderRadius: "var(--radius, 8px)", 
                padding: "1rem", 
                overflow: "auto",
                fontSize: "0.9375rem",
                lineHeight: 1.6
              }}>
                {String(cur.fc.command)}
              </pre>
            ) : null}
            
            {cur.fc.explanation && (
              <div style={{ 
                marginTop: "1rem", 
                padding: "1rem",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius, 8px)",
                color: "var(--muted)",
                fontSize: "0.9375rem",
                lineHeight: 1.6
              }}>
                <strong style={{ color: "var(--text)" }}>Explication : </strong>
                {String(cur.fc.explanation)}
              </div>
            )}
          </div>
        )}

      </ContentCard>

      {/* Action Bar */}
      <ActionBar>
        <ActionButton
          variant="ghost"
          onClick={() => { reset(); nav("/"); }}
        >
          Accueil
        </ActionButton>
        
        <ActionButton
          variant="secondary"
          onClick={prev}
          disabled={idx === 0}
        >
          Précédente
        </ActionButton>
        
        <ActionButton
          variant="primary"
          onClick={() => setShowBack(b => !b)}
        >
          {showBack ? "Voir le recto" : "Retourner"}
        </ActionButton>
        
        <ActionButton
          variant="secondary"
          onClick={next}
          disabled={idx === filtered.length - 1}
        >
          Suivante
        </ActionButton>
        
        <button
          onClick={() => toggleMark(key)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            fontSize: "0.9375rem",
            fontWeight: 600,
            borderRadius: "10px",
            border: "1px solid",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            background: isMarked ? "#f59e0b" : "var(--accent)",
            borderColor: isMarked ? "#f59e0b" : "var(--accent)",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
          }}
          onMouseEnter={(e) => {
            if (isMarked) {
              e.currentTarget.style.background = "#ea8a0a";
              e.currentTarget.style.borderColor = "#ea8a0a";
            } else {
              e.currentTarget.style.background = "var(--accent-600)";
            }
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isMarked ? "#f59e0b" : "var(--accent)";
            e.currentTarget.style.borderColor = isMarked ? "#f59e0b" : "var(--accent)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
          }}
        >
          {isMarked ? "Marquée" : "Marquer"}
        </button>
      </ActionBar>
    </div>
  );
}
