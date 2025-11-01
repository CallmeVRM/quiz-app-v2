// src/pages/review/QuizV2.tsx - Version modernisée avec support de tous les types de questions
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useReviewSession from "../../store/sessionReview";
import useUser from "../../store/user";
import { shuffleSeeded } from "../../utils/shuffle";
import {
  fetchSubcatQuestions,
  verifySubcatAnswers,
  postProgress,
  postAttempt,
  type Question,
  type QuestionAnswer
} from "../../lib/quizApi";
import ContentCard from "../../components/ContentCard";
import { ActionBar, ActionButton } from "../../components/ActionBar";
import QuestionChoice from "../../components/QuestionChoice";
import QuestionOrder from "../../components/QuestionOrder";

type QItem = {
  theme: string;
  category: string;
  subcat: string;
  q: Question;
  // Pour single/multiple: options mélangées
  shuffledOptions?: string[];
  shuffleMap?: number[]; // originalIndex -> shuffledIndex
};

export default function QuizV2() {
  const nav = useNavigate();
  const user = useUser();
  const { selection, reset } = useReviewSession();

  const [items, setItems] = useState<QItem[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [checked, setChecked] = useState<Record<string, { correctAnswer: any; isCorrect: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const [score, setScore] = useState<{ total: number; correct: number } | null>(null);

  const getQuestionKey = (item: QItem) => `${item.theme}::${item.category}::${item.subcat}::${item.q.id}`;

  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) nav("/qcm");
  }, [selection, nav]);

  useEffect(() => {
    if (!selection.theme || selection.subcategories.length === 0) return;
    let stop = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res: QItem[] = [];
        for (const tok of selection.subcategories) {
          const [cat, sub] = tok.split("::");
          const j = await fetchSubcatQuestions(selection.theme!, cat, sub, false, undefined);
          
          for (const q of j.items) {
            const qType = q.type || "single";
            let item: QItem = { theme: selection.theme!, category: cat, subcat: sub, q };

            // Shuffle seulement pour single/multiple
            if (qType === "single" || qType === "multiple") {
              const seed = `${user.uuid}:${selection.theme}:${cat}:${sub}:${q.id}`;
              const indices = Array.from({ length: q.options!.length }, (_, i) => i);
              const shuffledIndices = shuffleSeeded(indices, seed);
              const shuffledOptions = shuffledIndices.map(i => q.options![i]);
              
              const shuffleMap = Array(q.options!.length).fill(0);
              shuffledIndices.forEach((originalIdx, newIdx) => {
                shuffleMap[originalIdx] = newIdx;
              });
              
              item.shuffledOptions = shuffledOptions;
              item.shuffleMap = shuffleMap;
            }
            
            res.push(item);
          }
        }
        
        // Shuffle des questions avec timestamp pour ordre aléatoire à chaque session
        const seed = `${user.uuid}:${selection.theme}/${selection.subcategories.join(",")}:${Date.now()}`;
        const all = shuffleSeeded(res, seed);
        if (!stop) { setItems(all); setIdx(0); }
      } catch (e) {
        if (!stop) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [selection, user.uuid, nav]);

  const current = items[idx];
  const currentKey = current ? getQuestionKey(current) : "";
  const total = items.length;

  async function onCheck() {
    const cur = current;
    if (!cur) return;
    const key = currentKey;
    const ans = answers[key];
    if (ans === undefined) return;

    const qType = cur.q.type || "single";
    let questionAnswer: QuestionAnswer = { questionId: cur.q.id };

    if (qType === "order") {
      questionAnswer.selectedOrder = Array.isArray(ans) ? ans : [];
    } else if (qType === "multiple") {
      // Convertir les indices shuffled vers originaux
      const shuffledIndices = Array.isArray(ans) ? ans : [];
      const originalIndices = shuffledIndices.map(si => cur.shuffleMap!.indexOf(si)).sort((a,b) => a-b);
      questionAnswer.selectedIndices = originalIndices;
    } else {
      // single
      const shuffledIndex = typeof ans === "number" ? ans : 0;
      const originalIndex = cur.shuffleMap!.indexOf(shuffledIndex);
      questionAnswer.selectedIndex = originalIndex;
    }

    try {
      const out = await verifySubcatAnswers(cur.theme, cur.category, cur.subcat, [questionAnswer]);
      const r = out.results.find(x => x.questionId === cur.q.id);
      if (r) {
        setChecked(prev => ({ ...prev, [key]: { correctAnswer: r.correctAnswer, isCorrect: r.isCorrect } }));
      }
    } catch (e) {
      console.error("Erreur vérification:", e);
    }
  }

  function onNext() {
    if (idx < total - 1) setIdx(idx + 1);
  }

  function onPrev() {
    if (idx > 0) setIdx(idx - 1);
  }

  async function onFinish() {
    // Calculer le score total
    let correct = 0;
    let answered = 0;

    for (const item of items) {
      const key = getQuestionKey(item);
      const chk = checked[key];
      if (chk) {
        answered++;
        if (chk.isCorrect) correct++;
      }
    }

    setScore({ total: answered, correct });
    setFinished(true);

    // Envoyer la progression par sous-catégorie
    const bySub = new Map<string, QuestionAnswer[]>();
    
    for (const item of items) {
      const key = getQuestionKey(item);
      const ans = answers[key];
      if (ans === undefined) continue;

      const qType = item.q.type || "single";
      let questionAnswer: QuestionAnswer = { questionId: item.q.id };

      if (qType === "order") {
        questionAnswer.selectedOrder = Array.isArray(ans) ? ans : [];
      } else if (qType === "multiple") {
        const shuffledIndices = Array.isArray(ans) ? ans : [];
        const originalIndices = shuffledIndices.map(si => item.shuffleMap!.indexOf(si));
        questionAnswer.selectedIndices = originalIndices;
      } else {
        const shuffledIndex = typeof ans === "number" ? ans : 0;
        const originalIndex = item.shuffleMap!.indexOf(shuffledIndex);
        questionAnswer.selectedIndex = originalIndex;
      }

      const subKey = `${item.category}::${item.subcat}`;
      if (!bySub.has(subKey)) bySub.set(subKey, []);
      bySub.get(subKey)!.push(questionAnswer);
    }

    // Envoyer les résultats
    for (const [subKey, answers] of bySub) {
      const [cat, sub] = subKey.split("::");
      try {
        const out = await verifySubcatAnswers(selection.theme!, cat, sub, answers);
        const quizScore = out.answered > 0 ? Math.round((out.correct / out.answered) * 100) : 0;

        await postAttempt(user.uuid, {
          theme: selection.theme!,
          category: cat,
          subcategory: sub,
          answered: out.answered,
          correct: out.correct,
          totalQuestions: out.totalQuestions,
          score: quizScore,
        });

        await postProgress(user.uuid, {
          theme: selection.theme!,
          category: cat,
          subcategory: sub,
          answered: out.answered,
          correct: out.correct,
          totalQuestions: out.totalQuestions,
        });
      } catch (e) {
        console.error("Erreur post:", e);
      }
    }
  }

  function onRestart() {
    setAnswers({});
    setChecked({});
    setFinished(false);
    setScore(null);
    setIdx(0);
  }

  function onBack() {
    reset();
    nav("/qcm");
  }

  if (loading) return <ContentCard title="Chargement…"><p>Chargement des questions...</p></ContentCard>;
  if (err) return <ContentCard title="Erreur"><p>{err}</p></ContentCard>;
  if (!current) return <ContentCard title="Aucune question"><p>Pas de questions disponibles.</p></ContentCard>;

  const currentAnswer = answers[currentKey];
  const currentChecked = checked[currentKey] || null;
  const qType = current.q.type || "single";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem", paddingBottom: "100px" }}>
      {finished ? (
        <ContentCard title="🎉 Quiz Terminé">
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
              Score : <strong>{score?.correct}</strong> / {score?.total}
            </p>
            <p style={{ fontSize: "1.2rem", color: "var(--accent)" }}>
              {score && score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%
            </p>
          </div>
          <ActionBar>
            <ActionButton onClick={onRestart}>🔄 Recommencer</ActionButton>
            <ActionButton onClick={onBack}>🏠 Retour</ActionButton>
          </ActionBar>
        </ContentCard>
      ) : (
        <>
          <ContentCard title={`Question ${idx + 1} / ${total}`}>
            {qType === "order" ? (
              <QuestionOrder
                question={{
                  id: current.q.id,
                  prompt: current.q.prompt,
                  items: current.q.items || []
                }}
                answer={Array.isArray(currentAnswer) ? currentAnswer : undefined}
                onAnswerChange={(arr) => setAnswers(prev => ({ ...prev, [currentKey]: arr }))}
                checked={currentChecked}
              />
            ) : (
              <QuestionChoice
                question={{
                  id: current.q.id,
                  prompt: current.q.prompt,
                  options: current.shuffledOptions || current.q.options || [],
                  images: current.q.images
                }}
                type={qType as "single" | "multiple"}
                answer={currentAnswer}
                onAnswerChange={(val) => {
                  setAnswers(prev => ({ ...prev, [currentKey]: val }));
                  setChecked(prev => { const cp = { ...prev }; delete cp[currentKey]; return cp; });
                }}
                checked={currentChecked}
                theme={current.theme}
                category={current.category}
                subcat={current.subcat}
              />
            )}

            {currentChecked && current.q.explanation && (
              <div style={{
                marginTop: "1.5rem",
                padding: "1rem",
                background: "var(--bg-elev)",
                borderRadius: "var(--radius, 8px)",
                borderLeft: "4px solid var(--accent)"
              }}>
                <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>💡 Explication :</p>
                <p>{current.q.explanation}</p>
              </div>
            )}
          </ContentCard>

          <ActionBar>
            <ActionButton onClick={onPrev} disabled={idx === 0}>⬅ Précédent</ActionButton>
            
            {!currentChecked ? (
              <ActionButton 
                onClick={onCheck} 
                disabled={currentAnswer === undefined || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
              >
                ✓ Vérifier
              </ActionButton>
            ) : idx === total - 1 ? (
              <ActionButton onClick={onFinish}>🏁 Terminer</ActionButton>
            ) : (
              <ActionButton onClick={onNext}>Suivant ➡</ActionButton>
            )}
          </ActionBar>
        </>
      )}
    </div>
  );
}
