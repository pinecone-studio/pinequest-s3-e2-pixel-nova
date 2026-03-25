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
    <div className="rounded-xl border border-border bg-muted px-3 py-3 text-sm">
      <div className="text-xs text-muted-foreground">Импортолсон асуултууд</div>
      <div className="mt-2 space-y-2">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
          >
            <button
              className="min-w-0 flex-1 text-left text-sm transition hover:text-primary"
              onClick={() => onSelect(index)}
            >
              {`${index + 1}. ${question.text}`}
            </button>
            <button
              className="text-xs text-red-500 transition hover:opacity-80"
              onClick={() => onRemove(question.id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
