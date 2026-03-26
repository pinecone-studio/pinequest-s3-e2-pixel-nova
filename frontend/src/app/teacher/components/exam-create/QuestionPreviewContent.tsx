import type { Question } from "../../types";
import { optionLabels } from "./question-preview-helpers";

type QuestionPreviewContentProps = {
  activeQuestion: Question;
  activeOptions: string[];
  previewIndex: number;
  setEditMode: (value: boolean) => void;
};

export default function QuestionPreviewContent({
  activeQuestion,
  activeOptions,
  previewIndex,
  setEditMode,
}: QuestionPreviewContentProps) {
  return (
    <div className="mt-2 grid gap-2">
      <div className="text-lg font-semibold leading-7">
        {activeQuestion.text}
      </div>

      {activeQuestion.type === "mcq" ? (
        <div className="grid gap-2 md:grid-cols-2">
          {activeOptions.map((option, optionIndex) => (
            <button
              key={`${activeQuestion.id}-preview-${optionIndex}`}
              className="rounded-2xl border border-border bg-background px-4 py-4 text-left text-base shadow-sm"
              onClick={() => setEditMode(true)}
            >
              <span className="font-semibold">
                {(optionLabels[optionIndex] ?? optionIndex + 1) + ". "}
              </span>{" "}
              {option}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-3 py-3 text-sm text-slate-500">
          Сурагч энд хариултаа бичнэ.
        </div>
      )}
      {activeQuestion.type !== "mcq" && null}
    </div>
  );
}
