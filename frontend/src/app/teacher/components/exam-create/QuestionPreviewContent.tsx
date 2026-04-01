import type { Question } from "../../types";
import MathText from "@/components/MathText";
import MongolianText from "@/components/MongolianText";
import { hasTraditionalMongolian } from "@/lib/mongolian-script";
import { optionLabels } from "./question-preview-helpers";

type QuestionPreviewContentProps = {
  activeQuestion: Question;
  activeOptions: string[];
  previewIndex: number;
  setEditMode?: (value: boolean) => void;
  interactive?: boolean;
};

export default function QuestionPreviewContent({
  activeQuestion,
  activeOptions,
  previewIndex,
  setEditMode,
  interactive = true,
}: QuestionPreviewContentProps) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <div>Асуулт {previewIndex + 1}</div>
        <div className="font-medium text-slate-700">
          Оноо {activeQuestion.points ?? 1}
        </div>
      </div>

      <div className="text-base font-semibold leading-7 text-slate-800">
        {hasTraditionalMongolian(activeQuestion.text) ? (
          <MongolianText text={activeQuestion.text} />
        ) : (
          <MathText text={activeQuestion.text} />
        )}
      </div>

      {activeQuestion.type === "mcq" ? (
        <div className="grid gap-2 md:grid-cols-2">
          {activeOptions.map((option, optionIndex) => (
            <button
              key={`${activeQuestion.id}-preview-${optionIndex}`}
              className={`rounded-[16px] border border-[#e3eaf3] bg-[#f7f9fc] px-4 py-3 text-left text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${interactive ? "transition hover:border-[#bfd3ff] hover:bg-white" : "cursor-default"}`}
              onClick={() => {
                if (!interactive || !setEditMode) return;
                setEditMode(true);
              }}
              type="button"
            >
              <span className="font-semibold text-slate-800">
                {(optionLabels[optionIndex] ?? optionIndex + 1) + ". "}
              </span>
              {hasTraditionalMongolian(option) ? (
                <MongolianText text={option} className="inline-flex" />
              ) : (
                <MathText text={option} className="inline-flex" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-[16px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-4 text-sm text-slate-500">
          Сурагч энд хариултаа бичнэ.
        </div>
      )}
    </div>
  );
}
