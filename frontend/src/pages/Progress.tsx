// src/pages/Progress.tsx
import { useEffect, useMemo, useState } from "react";
import useUser from "../store/user";
import { getProgress, resetProgress, type ProgressResponse } from "../lib/quizApi";
import ContentCard from "../components/ContentCard";

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const color = percentage >= 80 ? "#10b981" : percentage >= 50 ? "#f59e0b" : "#ef4444";
  
  return (
    <div style={{ 
      width: "100%", 
      height: "6px", 
      background: "var(--border)", 
      borderRadius: "3px",
      overflow: "hidden"
    }}>
      <div style={{ 
        width: `${percentage}%`, 
        height: "100%", 
        background: color,
        transition: "width 0.3s ease"
      }} />
    </div>
  );
}

export default function ProgressPage() {
  const user = useUser();
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>("");

  async function load() {
    setLoading(true); setErr(null);
    try {
      const j = await getProgress(user.uuid);
      setData(j);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allTotals = data?.totals ?? { answered: 0, correct: 0, totalQuestions: 0 };
  const allByTheme = data?.byTheme ?? [];
  const allByCategory = data?.byCategory ?? [];
  const allBySub = data?.bySubcategory ?? [];

  // Liste des thèmes disponibles
  const availableThemes = useMemo(() => {
    const themes = allByTheme.map(t => t.theme);
    return ["", ...themes]; // "" = tous les thèmes
  }, [allByTheme]);

  // Filtrer les données selon le thème sélectionné
  const { totals, byTheme, byCategory, bySub } = useMemo(() => {
    if (!selectedTheme) {
      // Afficher tout
      return {
        totals: allTotals,
        byTheme: allByTheme,
        byCategory: allByCategory,
        bySub: allBySub
      };
    }

    // Filtrer par thème
    const filteredByTheme = allByTheme.filter(t => t.theme === selectedTheme);
    const filteredByCategory = allByCategory.filter(c => c.theme === selectedTheme);
    const filteredBySub = allBySub.filter(s => s.theme === selectedTheme);

    // Calculer les totaux pour ce thème
    const themeTotals = filteredByTheme[0] ?? { answered: 0, correct: 0, totalQuestions: 0 };

    return {
      totals: themeTotals,
      byTheme: filteredByTheme,
      byCategory: filteredByCategory,
      bySub: filteredBySub
    };
  }, [selectedTheme, allTotals, allByTheme, allByCategory, allBySub]);

  const hasAny = useMemo(() => {
    return (totals.answered ?? 0) > 0 || byTheme.length + byCategory.length + bySub.length > 0;
  }, [totals, byTheme.length, byCategory.length, bySub.length]);

  async function onReset(theme?: string) {
    setBusy(true);
    try {
      await resetProgress(user.uuid, theme);
      if (theme && selectedTheme === theme) {
        setSelectedTheme(""); // Retour à la vue globale si on supprime le thème actif
      }
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Chargement…</div>;
  if (err) return <div style={{ padding: 16, color: "crimson" }}>Erreur: {err}</div>;

  const accuracy = pct(totals.correct, totals.answered);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.75rem" }}>Progression</h1>
        
        {/* Affichage de l'identifiant utilisateur */}
        <div style={{ 
          padding: "0.75rem 1rem", 
          background: "var(--bg-elev)", 
          border: "2px solid var(--border)",
          borderRadius: "8px",
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.375rem",
          maxWidth: "fit-content"
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            ID Session
          </span>
          <code style={{ 
            background: "var(--bg)", 
            padding: "0.5rem 0.75rem", 
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            color: "var(--text)",
            border: "1px solid var(--border)",
            wordBreak: "break-all",
            userSelect: "all"
          }}>
            {user.uuid}
          </code>
        </div>
        
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.75rem" }}>
          {/* Filtre par thème */}
          <div style={{ flex: "1", minWidth: "250px" }}>
            <label style={{ 
              display: "block", 
              fontSize: "0.8125rem", 
              fontWeight: 600, 
              color: "var(--muted)",
              marginBottom: "0.375rem"
            }}>
              Filtrer par thème
            </label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{
                width: "100%",
                padding: "0.625rem 0.75rem",
                background: "var(--bg-elev)",
                border: "2px solid var(--border)",
                borderRadius: "8px",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "var(--text)",
                cursor: "pointer",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <option value="">📊 Tous les thèmes</option>
              {availableThemes.slice(1).map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Indicateur de filtre actif */}
        {selectedTheme && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.75rem",
            background: "var(--accent-50)",
            border: "1px solid var(--accent)",
            borderRadius: "6px",
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--accent)"
          }}>
            <span>🎯 Thème: {selectedTheme}</span>
            <button
              onClick={() => setSelectedTheme("")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                padding: "0 0.25rem",
                fontSize: "1rem",
                fontWeight: 700
              }}
              title="Retirer le filtre"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {!hasAny ? (
        <ContentCard>
          <div style={{ color: "var(--muted)", textAlign: "center", padding: "2rem 1rem" }}>
            Aucune donnée pour le moment. Lance un QCM et termine-le pour alimenter la progression.
          </div>
        </ContentCard>
      ) : (
        <>
          {/* Statistiques principales */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem", marginBottom: "1rem" }}>
            <ContentCard>
              <div style={{ color: "var(--muted)", fontSize: "0.8125rem", marginBottom: "0.5rem", fontWeight: 600 }}>Total Réponses</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text)" }}>{totals.answered}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                sur {totals.totalQuestions} questions
              </div>
            </ContentCard>
            <ContentCard>
              <div style={{ color: "var(--muted)", fontSize: "0.8125rem", marginBottom: "0.5rem", fontWeight: 600 }}>Réponses Correctes</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "#10b981" }}>{totals.correct}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                {totals.answered - totals.correct} incorrectes
              </div>
            </ContentCard>
            <ContentCard>
              <div style={{ color: "var(--muted)", fontSize: "0.8125rem", marginBottom: "0.5rem", fontWeight: 600 }}>Taux de Réussite</div>
              <div style={{ 
                fontSize: "2rem", 
                fontWeight: 700, 
                color: accuracy >= 80 ? "#10b981" : accuracy >= 50 ? "#f59e0b" : "#ef4444"
              }}>
                {accuracy}%
              </div>
              <ProgressBar value={totals.correct} max={totals.answered} />
            </ContentCard>
          </div>

          {/* Statistiques de couverture */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <ContentCard style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📊</span>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{byTheme.length}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>Thème{byTheme.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            </ContentCard>
            <ContentCard style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📁</span>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{byCategory.length}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>Catégorie{byCategory.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            </ContentCard>
            <ContentCard style={{ padding: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "2rem" }}>📄</span>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{bySub.length}</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 500 }}>Sous-catégorie{bySub.length > 1 ? 's' : ''}</div>
                </div>
              </div>
            </ContentCard>
          </div>

          {!selectedTheme && (
            <ContentCard style={{ marginBottom: "1rem" }}>
              <h2 style={{ 
                fontSize: "1rem", 
                fontWeight: 700, 
                marginBottom: "1rem",
                color: "var(--text)",
                borderBottom: "2px solid var(--border)",
                paddingBottom: "0.5rem"
              }}>
                📊 Par thème
              </h2>
              {byTheme.length === 0 ? (
                <div style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>Aucune donnée</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Thème</th>
                        <th style={thStyleCenter}>Réponses</th>
                        <th style={thStyleCenter}>Correctes</th>
                        <th style={thStyleCenter}>Taux</th>
                        <th style={{ ...thStyle, width: "120px" }}>Progression</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byTheme.map((r, i) => {
                        const acc = pct(r.correct, r.answered);
                        return (
                          <tr key={i}>
                            <td style={tdStyle}>
                              <span style={{ fontWeight: 600, color: "var(--text)" }}>{r.theme}</span>
                            </td>
                            <td style={tdStyleCenter}>
                              {r.answered}
                            </td>
                            <td style={tdStyleCenter}>
                              <span style={{ color: "#10b981", fontWeight: 600 }}>{r.correct}</span>
                            </td>
                            <td style={tdStyleCenter}>
                              <span style={{ 
                                fontWeight: 700,
                                color: acc >= 80 ? "#10b981" : acc >= 50 ? "#f59e0b" : "#ef4444"
                              }}>
                                {acc}%
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <ProgressBar value={r.correct} max={r.answered} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ContentCard>
          )}

          <ContentCard style={{ marginBottom: "1rem" }}>
            <h2 style={{ 
              fontSize: "1rem", 
              fontWeight: 700, 
              marginBottom: "1rem",
              color: "var(--text)",
              borderBottom: "2px solid var(--border)",
              paddingBottom: "0.5rem"
            }}>
              📁 Par catégorie
            </h2>
            {byCategory.length === 0 ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>Aucune donnée</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {!selectedTheme && <th style={thStyle}>Thème</th>}
                      <th style={thStyle}>Catégorie</th>
                      <th style={thStyleCenter}>Réponses</th>
                      <th style={thStyleCenter}>Correctes</th>
                      <th style={thStyleCenter}>Taux</th>
                      <th style={{ ...thStyle, width: "100px" }}>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byCategory.map((r, i) => {
                      const acc = pct(r.correct, r.answered);
                      return (
                        <tr key={i}>
                          {!selectedTheme && (
                            <td style={tdStyle}>
                              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8125rem" }}>{r.theme}</span>
                            </td>
                          )}
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{r.category}</span>
                          </td>
                          <td style={tdStyleCenter}>
                            {r.answered}
                          </td>
                          <td style={tdStyleCenter}>
                            <span style={{ color: "#10b981", fontWeight: 600 }}>{r.correct}</span>
                          </td>
                          <td style={tdStyleCenter}>
                            <span style={{ 
                              fontWeight: 700,
                              color: acc >= 80 ? "#10b981" : acc >= 50 ? "#f59e0b" : "#ef4444"
                            }}>
                              {acc}%
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <ProgressBar value={r.correct} max={r.answered} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ContentCard>

          <ContentCard>
            <h2 style={{ 
              fontSize: "1rem", 
              fontWeight: 700, 
              marginBottom: "1rem",
              color: "var(--text)",
              borderBottom: "2px solid var(--border)",
              paddingBottom: "0.5rem"
            }}>
              📄 Par sous-catégorie
            </h2>
            {bySub.length === 0 ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "1rem" }}>Aucune donnée</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {!selectedTheme && <th style={thStyle}>Thème</th>}
                      <th style={thStyle}>Catégorie</th>
                      <th style={thStyle}>Sous-catégorie</th>
                      <th style={thStyleCenter}>Tentatives</th>
                      <th style={thStyleCenter}>Moyenne</th>
                      <th style={thStyleCenter}>Meilleur</th>
                      <th style={{ ...thStyle, width: "100px" }}>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bySub.map((r, i) => {
                      const hasAttempts = r.attempts && r.attempts > 0;
                      return (
                        <tr key={i}>
                          {!selectedTheme && (
                            <td style={tdStyle}>
                              <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8125rem" }}>{r.theme}</span>
                            </td>
                          )}
                          <td style={tdStyle}>
                            <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.8125rem" }}>{r.category}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: "var(--text)" }}>{r.subcategory}</span>
                          </td>
                          <td style={tdStyleCenter}>
                            {hasAttempts ? (
                              <span style={{ 
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: "2rem",
                                height: "1.5rem",
                                padding: "0 0.5rem",
                                background: "var(--accent-50)",
                                color: "var(--accent)",
                                borderRadius: "12px",
                                fontSize: "0.8125rem",
                                fontWeight: 600
                              }}>
                                {r.attempts}
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                          <td style={tdStyleCenter}>
                            {hasAttempts ? (
                              <span style={{ 
                                fontWeight: 700,
                                color: (r.avgScore ?? 0) >= 80 ? "#10b981" : (r.avgScore ?? 0) >= 50 ? "#f59e0b" : "#ef4444"
                              }}>
                                {r.avgScore}%
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                          <td style={tdStyleCenter}>
                            {hasAttempts ? (
                              <span style={{ 
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontWeight: 700,
                                color: "#10b981"
                              }}>
                                🏆 {r.bestScore}%
                              </span>
                            ) : (
                              <span style={{ color: "var(--muted)" }}>—</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <ProgressBar value={r.correct} max={r.answered} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </ContentCard>
        </>
      )}

      {hasAny && (
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
          {selectedTheme && (
            <button 
              onClick={() => onReset(selectedTheme)} 
              disabled={busy}
              className="btn"
              style={{
                padding: "0.75rem 1.25rem",
                background: "#f59e0b",
                color: "#fff",
                border: "2px solid #d97706",
                borderRadius: "10px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!busy) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#d97706";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#f59e0b";
              }}
            >
              {busy ? "⏳ Réinitialisation..." : `🗑️ Reset ${selectedTheme}`}
            </button>
          )}
          <button 
            onClick={() => onReset()} 
            disabled={busy}
            className="btn"
            style={{
              padding: "0.75rem 1.25rem",
              background: "#ef4444",
              color: "#fff",
              border: "2px solid #dc2626",
              borderRadius: "10px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!busy) {
                (e.currentTarget as HTMLButtonElement).style.background = "#dc2626";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#ef4444";
            }}
          >
            {busy ? "⏳ Réinitialisation..." : "🔄 Reset Complet"}
          </button>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = { 
  textAlign: "left", 
  padding: "0.75rem 0.5rem", 
  color: "var(--muted)", 
  fontWeight: 600,
  fontSize: "0.8125rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid var(--border)"
};

const thStyleCenter: React.CSSProperties = { 
  ...thStyle,
  textAlign: "center"
};

const tdStyle: React.CSSProperties = { 
  padding: "0.875rem 0.5rem", 
  borderBottom: "1px solid var(--border)",
  fontSize: "0.875rem"
};

const tdStyleCenter: React.CSSProperties = { 
  ...tdStyle, 
  textAlign: "center",
  fontWeight: 500
};