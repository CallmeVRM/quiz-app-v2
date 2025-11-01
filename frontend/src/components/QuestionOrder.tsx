// src/components/QuestionOrder.tsx - Drag & Drop: gauche (source) → droite (ordre)
import { useState } from "react";

type QuestionOrderProps = {
  question: {
    id: string;
    prompt: string;
    items: string[];
  };
  answer: number[] | undefined;
  onAnswerChange: (answer: number[]) => void;
  checked?: { correctAnswer: number[]; isCorrect: boolean } | null;
};

export default function QuestionOrder({
  question,
  answer,
  onAnswerChange,
  checked,
}: QuestionOrderProps) {
  const [draggedItem, setDraggedItem] = useState<{
    originalIndex: number;
    fromRight: boolean;
  } | null>(null);

  // Liste ordonnée des réponses sélectionnées (indices originaux)
  const selectedOrder = answer || [];
  
  // Items disponibles à gauche (non encore sélectionnés)
  const availableItems = question.items
    .map((item, idx) => ({ item, originalIndex: idx }))
    .filter(({ originalIndex }) => !selectedOrder.includes(originalIndex));

  const handleDragStart = (originalIndex: number, fromRight: boolean) => {
    if (checked) return;
    setDraggedItem({ originalIndex, fromRight });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnRight = (targetPosition?: number) => {
    if (!draggedItem || checked) return;

    let newOrder = [...selectedOrder];

    if (draggedItem.fromRight) {
      // Déplacer dans la liste de droite
      const currentPos = newOrder.indexOf(draggedItem.originalIndex);
      if (currentPos !== -1) {
        newOrder.splice(currentPos, 1);
        const insertPos = targetPosition !== undefined ? targetPosition : newOrder.length;
        newOrder.splice(insertPos, 0, draggedItem.originalIndex);
      }
    } else {
      // Ajouter depuis la gauche
      const insertPos = targetPosition !== undefined ? targetPosition : newOrder.length;
      newOrder.splice(insertPos, 0, draggedItem.originalIndex);
    }

    onAnswerChange(newOrder);
    setDraggedItem(null);
  };

  const handleRemoveFromRight = (originalIndex: number) => {
    if (checked) return;
    const newOrder = selectedOrder.filter(idx => idx !== originalIndex);
    onAnswerChange(newOrder);
  };

  const getItemStyle = (isCorrect?: boolean, isWrong?: boolean): React.CSSProperties => {
    if (checked) {
      if (isCorrect) {
        return {
          border: "2px solid var(--success, #22c55e)",
          background: "color-mix(in srgb, var(--success, #22c55e) 10%, var(--bg-elev))",
          borderRadius: "var(--radius, 12px)",
          padding: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          transition: "all 0.2s ease"
        };
      }
      if (isWrong) {
        return {
          border: "2px solid var(--error, #ef4444)",
          background: "color-mix(in srgb, var(--error, #ef4444) 10%, var(--bg-elev))",
          borderRadius: "var(--radius, 12px)",
          padding: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          transition: "all 0.2s ease"
        };
      }
    }

    return {
      border: "2px solid var(--border)",
      borderRadius: "var(--radius, 12px)",
      padding: "0.875rem",
      cursor: checked ? "default" : "move",
      background: "var(--bg-elev)",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem"
    };
  };

  return (
    <div>
      <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", lineHeight: 1.4 }}>
        {question.prompt}
      </h3>
      
      {!checked && (
        <p style={{ marginBottom: "1rem", color: "var(--text-secondary, #666)", fontSize: "0.9rem" }}>
          🖱️ Glissez les éléments de gauche vers la droite pour construire votre réponse dans le bon ordre.
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Colonne gauche - Items disponibles */}
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Éléments disponibles
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: "150px" }}>
            {availableItems.length === 0 && !checked && (
              <div style={{ 
                padding: "2rem", 
                textAlign: "center", 
                color: "var(--text-secondary)", 
                fontSize: "0.9rem",
                border: "2px dashed var(--border)",
                borderRadius: "var(--radius, 12px)"
              }}>
                Tous les éléments ont été sélectionnés
              </div>
            )}
            {availableItems.map(({ item, originalIndex }) => (
              <div
                key={originalIndex}
                draggable={!checked}
                onDragStart={() => handleDragStart(originalIndex, false)}
                style={getItemStyle()}
              >
                <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>⋮⋮</span>
                <span style={{ flex: 1 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite - Ordre de réponse */}
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: "0.75rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Votre réponse (dans l'ordre)
          </h4>
          <div
            onDragOver={handleDragOver}
            onDrop={() => handleDropOnRight()}
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: "0.5rem",
              minHeight: "150px",
              padding: selectedOrder.length === 0 ? "2rem" : "0.5rem",
              border: selectedOrder.length === 0 ? "2px dashed var(--border)" : "none",
              borderRadius: "var(--radius, 12px)",
              background: selectedOrder.length === 0 ? "var(--bg-elev)" : "transparent"
            }}
          >
            {selectedOrder.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Glissez les éléments ici
              </div>
            )}
            {selectedOrder.map((originalIndex, position) => {
              const isCorrect = checked ? checked.correctAnswer[position] === originalIndex : false;
              const isWrong = checked ? checked.correctAnswer[position] !== originalIndex : false;

              return (
                <div
                  key={`${originalIndex}-${position}`}
                  draggable={!checked}
                  onDragStart={() => handleDragStart(originalIndex, true)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => { e.stopPropagation(); handleDropOnRight(position); }}
                  style={getItemStyle(isCorrect, isWrong)}
                >
                  <span style={{ fontWeight: 700, minWidth: "1.5rem", color: "var(--text-secondary)" }}>
                    {position + 1}.
                  </span>
                  <span style={{ flex: 1 }}>{question.items[originalIndex]}</span>
                  {!checked && (
                    <button
                      onClick={() => handleRemoveFromRight(originalIndex)}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                        color: "var(--error, #ef4444)",
                        padding: "0.25rem"
                      }}
                      aria-label="Retirer"
                    >
                      ✕
                    </button>
                  )}
                  {checked && (
                    <span style={{ fontSize: "1.2rem" }}>
                      {isCorrect ? "✓" : "✗"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback global */}
      {checked && (
        <div style={{ 
          marginTop: "1.5rem", 
          padding: "0.75rem", 
          borderRadius: "var(--radius, 8px)",
          background: checked.isCorrect 
            ? "color-mix(in srgb, var(--success, #22c55e) 10%, var(--bg-elev))"
            : "color-mix(in srgb, var(--error, #ef4444) 10%, var(--bg-elev))",
          color: checked.isCorrect ? "var(--success, #22c55e)" : "var(--error, #ef4444)",
          fontWeight: 500
        }}>
          {checked.isCorrect ? "✓ Bonne réponse !" : "✗ Mauvaise réponse"}
        </div>
      )}

      {checked && !checked.isCorrect && (
        <div style={{ 
          marginTop: "1rem", 
          padding: "1rem",
          background: "color-mix(in srgb, var(--info, #3b82f6) 10%, var(--bg-elev))",
          borderLeft: "4px solid var(--info, #3b82f6)",
          borderRadius: "var(--radius, 8px)"
        }}>
          <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Ordre correct :</p>
          <ol style={{ margin: 0, paddingLeft: "1.5rem" }}>
            {checked.correctAnswer.map((idx: number) => (
              <li key={idx}>{question.items[idx]}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
