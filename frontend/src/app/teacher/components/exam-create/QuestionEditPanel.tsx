import type { RefObject } from "react";
import { buttonGhost, inputClass } from "../../styles";
import type { Question } from "../../types";
import { optionLabels } from "./question-preview-helpers";
import QuestionTypeDropdown from "./QuestionTypeDropdown";

type QuestionEditPanelProps = {
  activeQuestion: Question;
  activeOptions: string[];
  imageBusy: boolean;
  attachInputRef: RefObject<HTMLInputElement | null>;
  onAttachFile: (file: File) => void;
  onOpenCrop: () => void;
  onRemoveImage: () => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (
    id: string,
    optionIndex: number,
    value: string,
  ) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
};

export default function QuestionEditPanel({
  activeQuestion,
  activeOptions,
  imageBusy,
  attachInputRef,
  onAttachFile,
  onOpenCrop,
  onRemoveImage,
  updateQuestion,
  updateQuestionOption,
  addQuestionOption,
  removeQuestionOption,
}: QuestionEditPanelProps) {
  return (
    <div className="mt-2 grid gap-2">
      <input
        ref={attachInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          onAttachFile(file);
        }}
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#dce5ef] bg-[#f8fbff] p-3">
        {activeQuestion.imageUrl ? (
          <>
            <button
              className={buttonGhost}
              disabled={imageBusy}
              onClick={onOpenCrop}
              type="button"
            >
              {imageBusy ? "Ачаалж байна..." : "Re-crop image"}
            </button>
            <button
              className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              disabled={imageBusy}
              onClick={onRemoveImage}
              type="button"
            >
              Remove wrong image
            </button>
          </>
        ) : (
          <button
            className={buttonGhost}
            onClick={() => attachInputRef.current?.click()}
            type="button"
          >
            Attach page crop
          </button>
        )}
      </div>

      <textarea
        className={`${inputClass} min-h-[116px] resize-y leading-6`}
        value={activeQuestion.text}
        onChange={(event) =>
          updateQuestion(activeQuestion.id, {
            text: event.target.value,
          })
        }
      />

      <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)]">
        <QuestionTypeDropdown
          value={activeQuestion.type === "text" ? "open" : activeQuestion.type}
          onChange={(nextType) => {
            updateQuestion(activeQuestion.id, {
              type: nextType,
              options:
                nextType === "mcq"
                  ? activeQuestion.options?.length
                    ? activeQuestion.options
                    : ["", "", "", ""]
                  : undefined,
            });
          }}
        />
        <input
          type="number"
          min={1}
          className={inputClass}
          value={activeQuestion.points ?? 1}
          onChange={(event) =>
            updateQuestion(activeQuestion.id, {
              points: Math.max(1, Number(event.target.value || 1)),
            })
          }
          placeholder="Оноо"
        />
      </div>

      {activeQuestion.type === "mcq" && (
        <div className="grid gap-2">
          <div className="grid gap-2">
            {activeOptions.map((option, optionIndex) => (
              <div
                key={`${activeQuestion.id}-${optionIndex}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2"
              >
                <span className="grid h-6 w-6 place-items-center rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground">
                  {optionLabels[optionIndex] ?? optionIndex + 1}
                </span>
                <input
                  className="w-full bg-transparent text-sm outline-none"
                  value={option}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    const wasCorrect = activeQuestion.correctAnswer === option;
                    updateQuestionOption(
                      activeQuestion.id,
                      optionIndex,
                      nextValue,
                    );
                    if (wasCorrect) {
                      updateQuestion(activeQuestion.id, {
                        correctAnswer: nextValue,
                      });
                    }
                  }}
                />
                <button
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600"
                  onClick={() =>
                    removeQuestionOption(activeQuestion.id, optionIndex)
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            className={buttonGhost}
            onClick={() => addQuestionOption(activeQuestion.id)}
          >
            + Хариулт нэмэх
          </button>
        </div>
      )}
    </div>
  );
}
