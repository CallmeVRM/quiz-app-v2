// src/components/QuestionChoice.tsx
import { useState } from "react";
import ImageModal from "./ImageModal";

type QuestionChoiceProps = {
  question: {
    id: string;
    prompt: string;
    options: string[];
    images?: string[];
  };
  type: "single" | "multiple";
  answer: number | number[] | undefined;
  onAnswerChange: (answer: number | number[]) => void;
  checked?: { correctAnswer: any; isCorrect: boolean } | null;
  theme: string;
  category: string;
  subcat: string;
};

export default function QuestionChoice({
  question,
  type,
  answer,
  onAnswerChange,
  checked,
  theme,
  category,
  subcat,
}: QuestionChoiceProps) {
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

  const handleSingleChange = (index: number) => {
    onAnswerChange(index);
  };

  const handleMultipleChange = (index: number) => {
    const current = Array.isArray(answer) ? answer : [];
    if (current.includes(index)) {
      onAnswerChange(current.filter((i) => i !== index));
    } else {
      onAnswerChange([...current, index].sort((a, b) => a - b));
    }
  };

  const isSelected = (index: number): boolean => {
    if (type === "single") {
      return answer === index;
    } else {
      return Array.isArray(answer) && answer.includes(index);
    }
  };

  const getOptionStyle = (index: number): React.CSSProperties => {
    const selected = isSelected(index);

    if (!checked) {
      // Mode normal
      return {
        border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "var(--radius, 12px)",
        padding: "0.875rem",
        cursor: "pointer",
        background: selected ? "var(--bg-elev)" : "transparent",
        transition: "all 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem"
      };
    }

    // Mode correction
    const correctAnswer = checked.correctAnswer;
    const isCorrectOption = type === "single" 
      ? index === correctAnswer 
      : Array.isArray(correctAnswer) && correctAnswer.includes(index);

    const wrongPicked = selected && !isCorrectOption;

    return {
      border: `2px solid ${
        isCorrectOption ? "var(--success, #22c55e)" : 
        wrongPicked ? "var(--error, #ef4444)" : 
        selected ? "var(--accent)" : "var(--border)"
      }`,
      borderRadius: "var(--radius, 12px)",
      padding: "0.875rem",
      cursor: "default",
      background: isCorrectOption 
        ? "color-mix(in srgb, var(--success, #22c55e) 10%, var(--bg-elev))" 
        : wrongPicked 
          ? "color-mix(in srgb, var(--error, #ef4444) 10%, var(--bg-elev))"
          : selected 
            ? "var(--bg-elev)" 
            : "transparent",
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

      {/* Images */}
      {question.images && question.images.length > 0 && (
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", flexWrap: "wrap" }}>
          {question.images.map((img, idx) => {
            const imageUrl = `${BASE}/images/${theme}/${category}/${subcat}/${img}`;
            return (
              <button
                key={idx}
                onClick={() => setImageModalUrl(imageUrl)}
                style={{
                  padding: "0.75rem 1.25rem",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius, 8px)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: 500,
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
              >
                <span style={{ fontSize: "1.2rem" }}>📷</span>
                <span>Image {idx + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Options */}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {question.options.map((option, index) => (
          <label
            key={index}
            style={getOptionStyle(index)}
          >
            <input
              type={type === "single" ? "radio" : "checkbox"}
              checked={isSelected(index)}
              onChange={() =>
                type === "single"
                  ? handleSingleChange(index)
                  : handleMultipleChange(index)
              }
              disabled={!!checked}
              style={{ 
                accentColor: "var(--accent)",
                width: "1.125rem",
                height: "1.125rem",
                cursor: checked ? "default" : "pointer"
              }}
            />
            <span style={{ flex: 1, fontSize: "1rem" }}>{option}</span>
          </label>
        ))}
      </div>

      {/* Feedback après correction */}
      {checked && (
        <div style={{ 
          marginTop: "1rem", 
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

      {/* Modal image */}
      {imageModalUrl && (
        <ImageModal
          imageUrl={imageModalUrl}
          onClose={() => setImageModalUrl(null)}
        />
      )}
    </div>
  );
}
