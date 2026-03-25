import { useMemo, useState } from "react";
import Image from "next/image";
import { buttonGhost, inputClass, selectClass } from "../../styles";
import type { Question } from "../../types";

type QuestionPreviewPanelProps = {
  questions: Question[];
  previewIndex: number;
  setPreviewIndex: (index: number) => void;
  editMode: boolean;
  setEditMode: (value: boolean | ((value: boolean) => boolean)) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (id: string, optionIndex: number, value: string) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
  removeQuestion: (id: string) => void;
};

const optionLabels = ["A", "B", "C", "D", "E", "F"];

export default function QuestionPreviewPanel({
  questions,
  previewIndex,
  setPreviewIndex,
  editMode,
  setEditMode,
  updateQuestion,
  updateQuestionOption,
  addQuestionOption,
  removeQuestionOption,
  removeQuestion,
}: QuestionPreviewPanelProps) {
  const [editCorrectOpen, setEditCorrectOpen] = useState(false);
  const activeQuestion = questions[previewIndex] ?? null;
  const activeOptions = useMemo(
    () => activeQuestion?.options ?? [],
    [activeQuestion],
  );

  if (!activeQuestion) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Student Preview</div>
          <div className="text-[11px] text-muted-foreground">
            Сурагчийн харагдах байдал.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs">
            {previewIndex + 1}/{questions.length}
          </span>
          <button
            className={buttonGhost}
            onClick={() => setEditMode((prev) => !prev)}
          >
            {editMode ? "Хаах" : "Edit"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-card p-3">
        <div className="text-sm text-muted-foreground">
          Асуулт {previewIndex + 1} · Оноо {activeQuestion.points ?? 1}
        </div>

        {editMode ? (
          <div className="mt-2 grid gap-2">
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
                          const wasCorrect =
                            activeQuestion.correctAnswer === option;
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
                        onClick={() => setEditCorrectOpen((prev) => !prev)}
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
                                (opt) =>
                                  opt === activeQuestion.correctAnswer,
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
                            className={`w-full rounded-lg px-3 py-2 text-left transition ${
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
        ) : (
          <div className="mt-2 grid gap-2">
            {activeQuestion.imageUrl && (
              <div className="relative w-full overflow-hidden rounded-xl border border-border">
                <Image
                  src={activeQuestion.imageUrl}
                  alt="Асуултын зураг"
                  width={960}
                  height={280}
                  className="h-auto w-full object-contain"
                  unoptimized
                />
              </div>
            )}
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
              <div className="rounded-2xl border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                Сурагч энд хариултаа бичнэ.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            className={`rounded-xl border px-3 py-2 text-sm transition ${
              index === previewIndex
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:bg-muted"
            }`}
            onClick={() => setPreviewIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}
