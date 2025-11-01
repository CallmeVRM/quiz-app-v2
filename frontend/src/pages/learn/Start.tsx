import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useLearnSession from "../../store/sessionLearn";
import ContentCard from "../../components/ContentCard";
import { ActionBar, ActionButton } from "../../components/ActionBar";

export default function LearnStart() {
  const nav = useNavigate();
  const { selection } = useLearnSession();

  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) {
      nav("/flashcards");
    }
  }, [selection, nav]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem", paddingBottom: "100px" }}>
      <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1.5rem", color: "var(--text)" }}>
        Flashcards — Prêt à démarrer
      </h1>
      
      <ContentCard>
        <div style={{ marginBottom: "0.75rem" }}>
          <strong style={{ color: "var(--text)" }}>Thème :</strong>{" "}
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{selection.theme ?? "-"}</span>
        </div>
        <div>
          <strong style={{ color: "var(--text)" }}>Sous-catégories :</strong>
          <ul style={{ marginTop: "0.75rem", marginLeft: "1.25rem", color: "var(--muted)" }}>
            {selection.subcategories.map((tok) => (
              <li key={tok} style={{ marginBottom: "0.375rem" }}>
                <code style={{ 
                  background: "var(--bg)", 
                  padding: "0.25rem 0.5rem", 
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  color: "var(--text)"
                }}>
                  {tok}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </ContentCard>

      <ActionBar>
        <ActionButton
          variant="ghost"
          onClick={() => nav("/flashcards")}
        >
          Retour
        </ActionButton>
        <ActionButton
          variant="primary"
          onClick={() => nav("/flashcards/run")}
          disabled={!selection.theme || selection.subcategories.length === 0}
        >
          Démarrer
        </ActionButton>
      </ActionBar>
    </div>
  );
}
