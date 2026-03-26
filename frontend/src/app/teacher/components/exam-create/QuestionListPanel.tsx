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
    <div className="rounded-[24px] border border-[#dce5ef] bg-[#f8fbff] px-4 py-4 text-sm">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Импортолсон асуултууд
      </div>
      <div className="mt-3 space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[#dce5ef] bg-white px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <button
                className="min-w-0 text-left text-sm transition hover:text-primary"
                onClick={() => onSelect(index)}
                type="button"
              >
                {`${index + 1}. ${question.text}`}
              </button>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-full bg-[#f3f7fb] px-2 py-1">
                  {question.type === "mcq"
                    ? "Test"
                    : question.type === "open"
                      ? "Нээлттэй"
                      : "Text"}
                </span>
                {question.imageUrl && (
                  <span className="rounded-full bg-[#eef6ff] px-2 py-1 text-primary">
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
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
