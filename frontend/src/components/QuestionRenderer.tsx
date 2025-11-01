// src/components/QuestionRenderer.tsx
import type { Question } from "../lib/quizApi";
import QuestionChoice from "./QuestionChoice";
import QuestionOrder from "./QuestionOrder";

type QuestionRendererProps = {
  question: Question;
  answer: number | number[] | undefined;
  onAnswerChange: (answer: number | number[]) => void;
  checked?: { correctAnswer: any; isCorrect: boolean } | null;
  theme: string;
  category: string;
  subcat: string;
};

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  checked,
  theme,
  category,
  subcat,
}: QuestionRendererProps) {
  const questionType = question.type || "single";

  if (questionType === "order") {
    if (!question.items || question.items.length === 0) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">
            ⚠️ Question de type "order" sans éléments à ranger.
          </p>
        </div>
      );
    }

    return (
      <QuestionOrder
        question={{
          id: question.id,
          prompt: question.prompt,
          items: question.items,
        }}
        answer={Array.isArray(answer) ? answer : undefined}
        onAnswerChange={onAnswerChange}
        checked={checked}
      />
    );
  }

  // Questions single ou multiple
  if (!question.options || question.options.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">
          ⚠️ Question sans options disponibles.
        </p>
      </div>
    );
  }

  return (
    <QuestionChoice
      question={{
        id: question.id,
        prompt: question.prompt,
        options: question.options,
        images: question.images,
      }}
      type={questionType === "multiple" ? "multiple" : "single"}
      answer={answer}
      onAnswerChange={onAnswerChange}
      checked={checked}
      theme={theme}
      category={category}
      subcat={subcat}
    />
  );
}
