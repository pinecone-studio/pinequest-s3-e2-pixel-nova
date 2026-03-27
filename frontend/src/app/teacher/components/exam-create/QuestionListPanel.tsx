import type { Question } from "../../types";
import QuestionPreviewContent from "./QuestionPreviewContent";

type QuestionListPanelProps = {
  questions: Question[];
  onEdit: (index: number) => void;
  onRemove: (id: string) => void;
};

export default function QuestionListPanel({
  questions,
  onEdit,
  onRemove,
}: QuestionListPanelProps) {
  if (questions.length === 0) return null;

  return (
    <div className="space-y-4">
      {questions.map((question, index) => {
        const isMissingCorrect =
          question.type === "mcq" &&
          (!question.correctAnswer || !question.correctAnswer.trim());

        return (
          <div
            key={question.id}
            className={`rounded-[24px] border bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.16)] ${
              isMissingCorrect ? "border-amber-300" : "border-[#e7edf5]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm font-semibold text-slate-700">
                Сурагчийн харагдах байдал
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-full border border-[#dce5ef] bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#bfd3ff] hover:text-[#2563eb]"
                  onClick={() => onEdit(index)}
                  type="button"
                >
                  Засах
                </button>
                <button
                  className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-white text-red-500 transition hover:bg-red-50"
                  onClick={() => onRemove(question.id)}
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              className={`mt-4 rounded-[20px] border p-4 ${
                isMissingCorrect
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-[#ebf0f7] bg-[#fcfdff]"
              }`}
            >
              {question.imageUrl && (
                <div className="mb-4 overflow-hidden rounded-[16px] border border-[#e7edf5] bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={question.imageUrl}
                    alt={`Question ${index + 1}`}
                    className="w-full rounded-xl object-contain"
                    style={{ maxHeight: 240 }}
                  />
                </div>
              )}

              <QuestionPreviewContent
                activeQuestion={question}
                activeOptions={question.options ?? []}
                previewIndex={index}
                interactive={false}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
