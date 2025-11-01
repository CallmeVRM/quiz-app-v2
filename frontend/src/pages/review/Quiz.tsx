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
  // Pour order: items mélangés
  shuffledItems?: string[];
  itemsMap?: number[]; // originalIndex -> shuffledIndex
};

export default function ReviewQuiz() {
  const nav = useNavigate();
  const user = useUser();
  const { selection } = useReviewSession();

  const [items, setItems] = useState<QItem[]>([]);
  const [idx, setIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, number | number[]>>({});
  const [checked, setChecked] = useState<Record<string, { correctAnswer: any; isCorrect: boolean }>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [finished, setFinished] = useState<boolean>(false);
  const [score, setScore] = useState<{ total: number; correct: number } | null>(null);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

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

            const seed = `${user.uuid}:${selection.theme}:${cat}:${sub}:${q.id}:${Date.now()}`;

            // Shuffle pour single/multiple
            if (qType === "single" || qType === "multiple") {
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
            
            // Shuffle pour order
            if (qType === "order" && q.items) {
              const indices = Array.from({ length: q.items.length }, (_, i) => i);
              const shuffledIndices = shuffleSeeded(indices, seed);
              const shuffledItems = shuffledIndices.map(i => q.items![i]);
              
              const itemsMap = Array(q.items.length).fill(0);
              shuffledIndices.forEach((originalIdx, newIdx) => {
                itemsMap[originalIdx] = newIdx;
              });
              
              item.shuffledItems = shuffledItems;
              item.itemsMap = itemsMap;
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
      // Convertir les indices shuffled vers originaux
      const shuffledOrder = Array.isArray(ans) ? ans : [];
      const originalOrder = cur.itemsMap 
        ? shuffledOrder.map(si => cur.itemsMap!.indexOf(si))
        : shuffledOrder;
      questionAnswer.selectedOrder = originalOrder;
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
        // Convertir correctAnswer (indices originaux) vers indices shufflés pour l'affichage
        let displayCorrectAnswer = r.correctAnswer;
        if (qType === "single" && typeof r.correctAnswer === "number" && cur.shuffleMap) {
          displayCorrectAnswer = cur.shuffleMap[r.correctAnswer];
        } else if (qType === "multiple" && Array.isArray(r.correctAnswer) && cur.shuffleMap) {
          displayCorrectAnswer = r.correctAnswer.map(origIdx => cur.shuffleMap![origIdx]).sort((a,b) => a-b);
        } else if (qType === "order" && Array.isArray(r.correctAnswer) && cur.itemsMap) {
          displayCorrectAnswer = r.correctAnswer.map(origIdx => cur.itemsMap![origIdx]);
        }
        
        setChecked(prev => ({ ...prev, [key]: { correctAnswer: displayCorrectAnswer, isCorrect: r.isCorrect } }));
        setVerified(prev => ({ ...prev, [key]: true }));
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
    // 1. D'abord, vérifier toutes les réponses non vérifiées
    const bySub = new Map<string, QuestionAnswer[]>();
    const allResults: Record<string, { correctAnswer: any; isCorrect: boolean }> = { ...checked };
    
    for (const item of items) {
      const key = getQuestionKey(item);
      const ans = answers[key];
      
      // Si pas de réponse, ignorer
      if (ans === undefined) continue;

      const qType = item.q.type || "single";
      let questionAnswer: QuestionAnswer = { questionId: item.q.id };

      // Préparer la réponse pour envoi au backend
      if (qType === "order") {
        const shuffledOrder = Array.isArray(ans) ? ans : [];
        const originalOrder = item.itemsMap 
          ? shuffledOrder.map(si => item.itemsMap!.indexOf(si))
          : shuffledOrder;
        questionAnswer.selectedOrder = originalOrder;
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

    // 2. Vérifier toutes les réponses auprès du backend
    for (const [subKey, questionAnswers] of bySub) {
      const [cat, sub] = subKey.split("::");
      try {
        const out = await verifySubcatAnswers(selection.theme!, cat, sub, questionAnswers);
        
        // Stocker les résultats de vérification
        for (const result of out.results) {
          const item = items.find(i => i.q.id === result.questionId);
          if (!item) continue;
          
          const key = getQuestionKey(item);
          const qType = item.q.type || "single";
          
          // Convertir correctAnswer (indices originaux) vers indices shufflés pour l'affichage
          let displayCorrectAnswer = result.correctAnswer;
          if (qType === "single" && typeof result.correctAnswer === "number" && item.shuffleMap) {
            displayCorrectAnswer = item.shuffleMap[result.correctAnswer];
          } else if (qType === "multiple" && Array.isArray(result.correctAnswer) && item.shuffleMap) {
            displayCorrectAnswer = result.correctAnswer.map(origIdx => item.shuffleMap![origIdx]).sort((a,b) => a-b);
          } else if (qType === "order" && Array.isArray(result.correctAnswer) && item.itemsMap) {
            displayCorrectAnswer = result.correctAnswer.map(origIdx => item.itemsMap![origIdx]);
          }
          
          allResults[key] = { correctAnswer: displayCorrectAnswer, isCorrect: result.isCorrect };
        }
      } catch (e) {
        console.error("Erreur vérification:", e);
      }
    }

    // 3. Mettre à jour l'état checked avec tous les résultats
    setChecked(allResults);

    // 4. Calculer le score total
    let correct = 0;
    let answered = 0;

    for (const item of items) {
      const key = getQuestionKey(item);
      const ans = answers[key];
      if (ans !== undefined) {
        answered++;
        const result = allResults[key];
        if (result && result.isCorrect) correct++;
      }
    }

    setScore({ total: answered, correct });
    setFinished(true);

    // 5. Envoyer la progression par sous-catégorie (bySub contient déjà les résultats vérifiés)
    for (const [subKey, questionAnswers] of bySub) {
      const [cat, sub] = subKey.split("::");
      
      // Calculer le score pour cette sous-catégorie
      let subCorrect = 0;
      let subAnswered = questionAnswers.length;
      
      for (const qa of questionAnswers) {
        const item = items.find(i => i.q.id === qa.questionId);
        if (item) {
          const key = getQuestionKey(item);
          const result = allResults[key];
          if (result && result.isCorrect) subCorrect++;
        }
      }
      
      const quizScore = subAnswered > 0 ? Math.round((subCorrect / subAnswered) * 100) : 0;
      const totalQuestionsInSubcat = items.filter(i => i.category === cat && i.subcat === sub).length;

      try {
        await postAttempt(user.uuid, {
          theme: selection.theme!,
          category: cat,
          subcategory: sub,
          answered: subAnswered,
          correct: subCorrect,
          totalQuestions: totalQuestionsInSubcat,
          score: quizScore,
        });

        await postProgress(user.uuid, {
          theme: selection.theme!,
          category: cat,
          subcategory: sub,
          answered: subAnswered,
          correct: subCorrect,
          totalQuestions: totalQuestionsInSubcat,
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

  if (loading) return <ContentCard title="Chargement…"><p>Chargement des questions...</p></ContentCard>;
  if (err) return <ContentCard title="Erreur"><p>{err}</p></ContentCard>;
  if (!current) return <ContentCard title="Aucune question"><p>Pas de questions disponibles.</p></ContentCard>;

  const currentAnswer = answers[currentKey];
  const currentChecked = checked[currentKey] || null;
  const qType = current.q.type || "single";

  const wrongAnswers = items.filter(item => {
    const key = getQuestionKey(item);
    const c = checked[key];
    return c && !c.isCorrect;
  });

  const onReviewWrong = () => {
    const firstWrong = items.findIndex(item => {
      const key = getQuestionKey(item);
      const c = checked[key];
      return c && !c.isCorrect;
    });
    if (firstWrong !== -1) {
      setFinished(false);
      setReviewMode(true);
      setIdx(firstWrong);
    }
  };

  // Liste des questions à afficher selon le mode
  const displayedItems = reviewMode ? wrongAnswers : items;
  const displayedIdx = reviewMode 
    ? wrongAnswers.findIndex(item => getQuestionKey(item) === currentKey)
    : idx;
  const displayedTotal = displayedItems.length;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "1rem", paddingBottom: "100px" }}>
      {finished && score ? (
        <ContentCard style={{ 
          textAlign: "center", 
          background: "linear-gradient(135deg, var(--accent-50) 0%, var(--bg-elev) 100%)",
          border: "2px solid var(--accent)",
          padding: "2rem"
        }}>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "var(--accent)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Quiz Terminé !
          </div>
          <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--accent)", marginBottom: "0.5rem", lineHeight: 1 }}>
            {Math.round((score.correct / score.total) * 100)}%
          </div>
          <div style={{ fontSize: "1.25rem", color: "var(--text)", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, color: score.correct === score.total ? "#10b981" : "var(--text)" }}>
              {score.correct}
            </span>
            {" / "}
            <span style={{ color: "var(--muted)" }}>{score.total}</span>
            {" "}réponses correctes
          </div>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: score.correct / score.total >= 0.8 ? "#10b981" : score.correct / score.total >= 0.5 ? "#f59e0b" : "#ef4444",
            color: "#fff",
            borderRadius: "50px",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "1rem"
          }}>
            {score.correct / score.total >= 0.8 ? "Excellent" : score.correct / score.total >= 0.5 ? "Bien" : "Continue !"}
          </div>
          
          <div style={{ 
            display: "flex", 
            gap: "0.75rem", 
            justifyContent: "center", 
            flexWrap: "wrap",
            marginTop: "1.5rem" 
          }}>
            <button
              onClick={onRestart}
              style={{
                padding: "0.75rem 1.5rem",
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                borderRadius: "var(--radius, 8px)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Refaire le quiz
            </button>
            
            {wrongAnswers.length > 0 && (
              <button
                onClick={onReviewWrong}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "var(--error, #ef4444)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius, 8px)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                Revoir les erreurs ({wrongAnswers.length})
              </button>
            )}
            
            <button
              onClick={() => nav("/progress")}
              style={{
                padding: "0.75rem 1.5rem",
                background: "var(--bg-elev)",
                color: "var(--text)",
                border: "2px solid var(--border)",
                borderRadius: "var(--radius, 8px)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Voir la progression
            </button>
            
            <button
              onClick={() => nav("/qcm")}
              style={{
                padding: "0.75rem 1.5rem",
                background: "var(--bg-elev)",
                color: "var(--text)",
                border: "2px solid var(--border)",
                borderRadius: "var(--radius, 8px)",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Nouveau quiz
            </button>
          </div>
          
          <div style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
            Cette tentative a été enregistrée dans votre progression
          </div>
        </ContentCard>
      ) : (
        <>
          <ContentCard title={reviewMode ? `Erreur ${displayedIdx + 1} / ${displayedTotal}` : `Question ${idx + 1} / ${total}`}>
            {qType === "order" ? (
              <QuestionOrder
                question={{
                  id: current.q.id,
                  prompt: current.q.prompt,
                  items: current.shuffledItems || current.q.items || []
                }}
                answer={Array.isArray(currentAnswer) ? currentAnswer : undefined}
                onAnswerChange={(arr) => {
                  if (!verified[currentKey]) {
                    setAnswers(prev => ({ ...prev, [currentKey]: arr }));
                  }
                }}
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
                  if (!verified[currentKey]) {
                    setAnswers(prev => ({ ...prev, [currentKey]: val }));
                  }
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
            {reviewMode ? (
              <>
                <ActionButton 
                  onClick={() => {
                    const currentWrongIdx = wrongAnswers.findIndex(item => getQuestionKey(item) === currentKey);
                    if (currentWrongIdx > 0) {
                      const prevWrong = wrongAnswers[currentWrongIdx - 1];
                      setIdx(items.findIndex(item => getQuestionKey(item) === getQuestionKey(prevWrong)));
                    }
                  }} 
                  disabled={displayedIdx === 0}
                >
                  Erreur précédente
                </ActionButton>
                
                <ActionButton 
                  onClick={() => {
                    const currentWrongIdx = wrongAnswers.findIndex(item => getQuestionKey(item) === currentKey);
                    if (currentWrongIdx < wrongAnswers.length - 1) {
                      const nextWrong = wrongAnswers[currentWrongIdx + 1];
                      setIdx(items.findIndex(item => getQuestionKey(item) === getQuestionKey(nextWrong)));
                    }
                  }} 
                  disabled={displayedIdx === displayedTotal - 1}
                >
                  Erreur suivante
                </ActionButton>
                
                <ActionButton onClick={() => { setReviewMode(false); setFinished(true); }}>
                  Retour au résumé
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton onClick={onPrev} disabled={idx === 0}>Précédent</ActionButton>
                
                {!verified[currentKey] && (
                  <ActionButton 
                    onClick={onCheck} 
                    disabled={currentAnswer === undefined || (Array.isArray(currentAnswer) && currentAnswer.length === 0)}
                  >
                    Vérifier
                  </ActionButton>
                )}
                
                <ActionButton onClick={onNext} disabled={idx === total - 1}>Suivant</ActionButton>
                
                {idx === total - 1 && (
                  <ActionButton onClick={onFinish}>Terminer</ActionButton>
                )}
              </>
            )}
          </ActionBar>
        </>
      )}
    </div>
  );
}
