import type { Question } from "../../types";

type QuestionListPanelProps = {
  questions: Question[];
  onSelect: (index: number) => void;
  onRemove: (id: string) => void;
};

export default function QuestionListPanel({
  questions,
  onSelect,
  onRemove,
}: QuestionListPanelProps) {
  if (questions.length === 0) return null;

  return (
    <div className="rounded-[22px] border border-[#e7edf5] bg-white px-4 py-4 text-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Асуултын жагсаалт
      </div>
      <div className="mt-3 space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#edf2f7] bg-[#fbfdff] px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <button
                className="min-w-0 text-left text-sm text-slate-700 transition hover:text-[#2563eb]"
                onClick={() => onSelect(index)}
                type="button"
              >
                {`${index + 1}. ${question.text}`}
              </button>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-white px-2 py-1">
                  {question.type === "mcq"
                    ? "Сонголт"
                    : question.type === "open"
                      ? "Нээлттэй"
                      : "Текст"}
                </span>
                {question.imageUrl && (
                  <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-[#2563eb]">
                    Image
                  </span>
                )}
              </div>
            </div>
            <button
              className="text-xs text-red-500 transition hover:opacity-80"
              onClick={() => onRemove(question.id)}
              type="button"
            >
              Устгах
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
