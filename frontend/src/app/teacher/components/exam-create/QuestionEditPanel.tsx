import type { RefObject } from "react";
import { buttonGhost, inputClass, selectClass } from "../../styles";
import type { Question } from "../../types";
import { optionLabels } from "./question-preview-helpers";

type QuestionEditPanelProps = {
  activeQuestion: Question;
  activeOptions: string[];
  imageBusy: boolean;
  attachInputRef: RefObject<HTMLInputElement | null>;
  editCorrectOpen: boolean;
  setEditCorrectOpen: (value: boolean) => void;
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
  editCorrectOpen,
  setEditCorrectOpen,
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
        <button
          className={buttonGhost}
          disabled={!activeQuestion.imageUrl || imageBusy}
          onClick={onOpenCrop}
          type="button"
        >
          {imageBusy ? "Ачаалж байна..." : "Re-crop image"}
        </button>
        <button
          className={buttonGhost}
          onClick={() => attachInputRef.current?.click()}
          type="button"
        >
          Attach page crop
        </button>
        <button
          className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          disabled={!activeQuestion.imageUrl}
          onClick={onRemoveImage}
          type="button"
        >
          Remove wrong image
        </button>
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_140px]">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={activeQuestion.text}
          onChange={(event) =>
            updateQuestion(activeQuestion.id, {
              text: event.target.value,
            })
          }
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

      <select
        className={selectClass}
        value={activeQuestion.type}
        onChange={(event) => {
          const nextType = event.target.value as "text" | "open" | "mcq";
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
      >
        <option value="open">Нөхөх / задгай</option>
        <option value="mcq">Сонголт</option>
        <option value="text">Текст</option>
      </select>

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

          <div className="grid gap-2 md:grid-cols-[1fr_200px]">
            <button
              className={buttonGhost}
              onClick={() => addQuestionOption(activeQuestion.id)}
            >
              + Хариулт нэмэх
            </button>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground">
                Зөв хариулт
              </label>
              <div
                className="relative mt-1"
                tabIndex={0}
                onBlur={() => setEditCorrectOpen(false)}
              >
                <button
                  className={`${selectClass} flex w-full items-center justify-between`}
                  onClick={() => setEditCorrectOpen(!editCorrectOpen)}
                  type="button"
                >
                  <span>
                    {(() => {
                      if (!activeQuestion.correctAnswer) {
                        return "Зөв хариулт сонгох";
                      }
                      const idx = Math.max(
                        0,
                        activeOptions.findIndex(
                          (opt) => opt === activeQuestion.correctAnswer,
                        ),
                      );
                      const label = optionLabels[idx] ?? "A";
                      return `${label}. ${activeQuestion.correctAnswer}`;
                    })()}
                  </span>
                  <svg
                    className={`h-4 w-4 transition-transform ${
                      editCorrectOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div
                  className={`absolute z-20 mt-2 w-full rounded-xl border border-border bg-card p-2 text-sm shadow-xl transition ${
                    editCorrectOpen
                      ? "opacity-100 translate-y-0"
                      : "pointer-events-none opacity-0 -translate-y-1"
                  }`}
                >
                  {activeOptions.map((option, idx) => (
                    <button
                      key={`${option}-${idx}`}
                      className={`w-full rounded-xl px-3 py-2 text-left transition ${
                        activeQuestion.correctAnswer === option
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        updateQuestion(activeQuestion.id, {
                          correctAnswer: option,
                        });
                        setEditCorrectOpen(false);
                      }}
                      type="button"
                    >
                      {(optionLabels[idx] ?? idx + 1) + ". "}
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeQuestion.type !== "mcq" && (
        <input
          className={inputClass}
          placeholder="Зөв хариулт"
          value={activeQuestion.correctAnswer}
          onChange={(event) =>
            updateQuestion(activeQuestion.id, {
              correctAnswer: event.target.value,
            })
          }
        />
      )}
    </div>
  );
}
