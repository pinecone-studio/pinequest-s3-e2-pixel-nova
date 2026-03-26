import type { Question } from "../../types";
import { buttonGhost } from "../../styles";

type QuestionPreviewNavProps = {
  questions: Question[];
  previewIndex: number;
  setPreviewIndex: (index: number) => void;
  removeQuestion: (id: string) => void;
};

export default function QuestionPreviewNav({
  questions,
  previewIndex,
  setPreviewIndex,
  removeQuestion,
}: QuestionPreviewNavProps) {
  const activeQuestion = questions[previewIndex] ?? null;
  if (!activeQuestion) return null;

  return (
    <>
      <div className="mt-3 w-[98%] flex flex-wrap gap-2">
        {questions.map((question, index) => {
          const isMissingCorrect =
            question.type === "mcq" &&
            (!question.correctAnswer || !question.correctAnswer.trim());
          const isActive = index === previewIndex;
          const style = isActive
            ? isMissingCorrect
              ? "border-amber-400 bg-amber-50 text-amber-600"
              : "border-primary bg-primary/10 text-primary"
            : isMissingCorrect
              ? "border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100"
              : "border-border bg-card hover:bg-muted";
          return (
            <button
              key={question.id}
              className={`rounded-xl border px-3 py-2 text-sm transition ${style}`}
              onClick={() => setPreviewIndex(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-3 w-[98%] flex flex-wrap gap-4">
        <button
          className={buttonGhost}
          onClick={() => setPreviewIndex(Math.max(previewIndex - 1, 0))}
        >
          ← Өмнөх
        </button>
        <button
          className={buttonGhost}
          onClick={() =>
            setPreviewIndex(Math.min(previewIndex + 1, questions.length - 1))
          }
        >
          Дараах →
        </button>
        <button
          className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          onClick={() => removeQuestion(activeQuestion.id)}
        >
          Энэ асуултыг устгах
        </button>
      </div>
    </>
  );
}
