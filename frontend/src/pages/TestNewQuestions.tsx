// src/pages/TestNewQuestions.tsx - Page de test pour les nouveaux types de questions
import { useState, useEffect } from "react";
import ContentCard from "../components/ContentCard";
import QuestionRenderer from "../components/QuestionRenderer";
import { ActionBar, ActionButton } from "../components/ActionBar";
import type { Question, QuestionAnswer } from "../lib/quizApi";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

export default function TestNewQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [checked, setChecked] = useState<Record<string, { correctAnswer: any; isCorrect: boolean }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les questions de test
    fetch(`${BASE}/themes/az-104/compute/vm-linux/questions`)
      .then(r => r.json())
      .then(data => {
        setQuestions(data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const current = questions[idx];
  if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Chargement...</div>;
  if (questions.length === 0) return <div style={{ padding: "2rem", textAlign: "center" }}>Aucune question</div>;

  const currentAnswer = answers[current.id];
  const currentChecked = checked[current.id];

  const handleCheck = async () => {
    const qType = current.type || "single";
    
    // Vérifier qu'il y a une réponse selon le type
    if (qType === "order" && (!Array.isArray(currentAnswer) || currentAnswer.length === 0)) {
      return; // Pas de réponse pour question d'ordre
    }
    if (qType === "multiple" && (!Array.isArray(currentAnswer) || currentAnswer.length === 0)) {
      return; // Pas de réponse pour question multiple
    }
    if (qType === "single" && currentAnswer === undefined) {
      return; // Pas de réponse pour question simple
    }

    const questionAnswer: QuestionAnswer = { questionId: current.id };

    if (qType === "order") {
      questionAnswer.selectedOrder = Array.isArray(currentAnswer) ? currentAnswer : [];
    } else if (qType === "multiple") {
      questionAnswer.selectedIndices = Array.isArray(currentAnswer) ? currentAnswer : [];
    } else {
      questionAnswer.selectedIndex = typeof currentAnswer === "number" ? currentAnswer : 0;
    }

    try {
      const response = await fetch(`${BASE}/themes/az-104/compute/vm-linux/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: [questionAnswer] })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend validation error:", errorData);
        console.error("Sent data:", { answers: [questionAnswer] });
        return;
      }

      const result = await response.json();
      if (!result.results) {
        console.error("No results in response:", result);
        return;
      }
      
      const r = result.results.find((x: any) => x.questionId === current.id);
      if (r) {
        setChecked(prev => ({
          ...prev,
          [current.id]: { correctAnswer: r.correctAnswer, isCorrect: r.isCorrect }
        }));
      }
    } catch (error) {
      console.error("Error verifying answer:", error);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem", paddingBottom: "100px" }}>
      <ContentCard
        title={`🧪 Test - Question ${idx + 1} / ${questions.length}`}
        subtitle={`Type: ${current.type || "single"}`}
        progress={((idx + 1) / questions.length) * 100}
        style={{ marginBottom: "1.5rem" }}
      />

      <ContentCard style={{ marginBottom: "1.5rem" }}>
        <QuestionRenderer
          question={current}
          answer={currentAnswer}
          onAnswerChange={(answer) => {
            setAnswers(prev => ({ ...prev, [current.id]: answer }));
            setChecked(prev => {
              const newChecked = { ...prev };
              delete newChecked[current.id];
              return newChecked;
            });
          }}
          checked={currentChecked || null}
          theme="az-104"
          category="compute"
          subcat="vm-linux"
        />

        {currentChecked && current.explanation && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: currentChecked.isCorrect
              ? "color-mix(in srgb, var(--success, #22c55e) 10%, var(--bg-elev))"
              : "color-mix(in srgb, var(--info, #3b82f6) 10%, var(--bg-elev))",
            borderLeft: `4px solid var(${currentChecked.isCorrect ? '--success, #22c55e' : '--info, #3b82f6'})`,
            borderRadius: "var(--radius, 8px)"
          }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              {currentChecked.isCorrect ? "✓ Correct !" : "ℹ️ Explication"}
            </div>
            <div style={{ lineHeight: 1.6 }}>{current.explanation}</div>
          </div>
        )}
      </ContentCard>

      <ActionBar>
        <ActionButton
          onClick={() => window.history.back()}
          variant="secondary"
        >
          ← Retour
        </ActionButton>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          {idx > 0 && (
            <ActionButton
              onClick={() => setIdx(idx - 1)}
              variant="secondary"
            >
              ← Précédent
            </ActionButton>
          )}

          {!currentChecked && (
            <ActionButton
              onClick={handleCheck}
              disabled={
                current.type === "order" 
                  ? !Array.isArray(currentAnswer) || currentAnswer.length === 0
                  : current.type === "multiple"
                    ? !Array.isArray(currentAnswer) || currentAnswer.length === 0
                    : currentAnswer === undefined
              }
              variant="primary"
            >
              Vérifier
            </ActionButton>
          )}

          {idx < questions.length - 1 && (
            <ActionButton
              onClick={() => setIdx(idx + 1)}
              variant="secondary"
            >
              Suivant →
            </ActionButton>
          )}
        </div>
      </ActionBar>
    </div>
  );
}
