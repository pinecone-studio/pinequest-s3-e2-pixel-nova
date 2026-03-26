import { useMemo, useRef, useState } from "react";
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

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Зураг уншиж чадсангүй."));
    reader.readAsDataURL(file);
  });

const fetchImageAsDataUrl = async (imageUrl: string) => {
  if (imageUrl.startsWith("data:image/")) return imageUrl;

  const response = await fetch(imageUrl, {
    credentials: "omit",
    mode: "cors",
  });
  if (!response.ok) {
    throw new Error("Зургийг татаж чадсангүй.");
  }

  const blob = await response.blob();
  return readFileAsDataUrl(
    new File([blob], "question-image", {
      type: blob.type || "image/jpeg",
    }),
  );
};

const cropImageDataUrl = async (
  dataUrl: string,
  topPercent: number,
  bottomPercent: number,
) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const top = Math.max(0, Math.min(0.95, topPercent));
      const bottom = Math.max(top + 0.02, Math.min(1, bottomPercent));
      const sourceY = Math.round(image.height * top);
      const sourceHeight = Math.max(
        1,
        Math.round(image.height * (bottom - top)),
      );

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas үүсгэж чадсангүй."));
        return;
      }

      context.drawImage(
        image,
        0,
        sourceY,
        image.width,
        sourceHeight,
        0,
        0,
        image.width,
        sourceHeight,
      );

      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => reject(new Error("Зураг ачаалж чадсангүй."));
    image.src = dataUrl;
  });

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
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropTop, setCropTop] = useState(0);
  const [cropBottom, setCropBottom] = useState(1);
  const [imageBusy, setImageBusy] = useState(false);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const activeQuestion = questions[previewIndex] ?? null;
  const activeOptions = useMemo(
    () => activeQuestion?.options ?? [],
    [activeQuestion],
  );

  if (!activeQuestion) return null;

  const openCropEditor = async (sourceUrl: string) => {
    setImageBusy(true);
    try {
      const nextSource = await fetchImageAsDataUrl(sourceUrl);
      setCropSource(nextSource);
      setCropTop(0);
      setCropBottom(1);
      setCropOpen(true);
    } catch {
      window.alert("Зургийг crop хийхэд бэлдэж чадсангүй.");
    } finally {
      setImageBusy(false);
    }
  };

  const applyCrop = async () => {
    if (!cropSource) return;
    setImageBusy(true);
    try {
      const cropped = await cropImageDataUrl(cropSource, cropTop, cropBottom);
      updateQuestion(activeQuestion.id, {
        imageUrl: cropped,
      });
      setCropOpen(false);
    } catch {
      window.alert("Зураг crop хийх үед алдаа гарлаа.");
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-[#dce5ef] bg-[#f8fbff] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-base font-semibold">Сурагчийн харагдах байдал</div>
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
            {editMode ? "Хаах" : "Засах"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#dce5ef] bg-white p-4">
        <div className="text-sm text-slate-500">
          Асуулт {previewIndex + 1} · Оноо {activeQuestion.points ?? 1}
        </div>

        {activeQuestion.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#dce5ef] bg-[#f8fbff] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeQuestion.imageUrl}
              alt="Асуултын зураг"
              className="w-full rounded-xl border border-border object-contain"
              style={{ maxHeight: 320 }}
            />
          </div>
        )}

        {editMode ? (
          <div className="mt-2 grid gap-2">
            <input
              ref={attachInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                setImageBusy(true);
                try {
                  const dataUrl = await readFileAsDataUrl(file);
                  setCropSource(dataUrl);
                  setCropTop(0);
                  setCropBottom(1);
                  setCropOpen(true);
                } catch {
                  window.alert("Зураг хавсаргаж чадсангүй.");
                } finally {
                  setImageBusy(false);
                }
              }}
            />

            <div className="flex flex-wrap gap-2 rounded-2xl border border-[#dce5ef] bg-[#f8fbff] p-3">
              <button
                className={buttonGhost}
                disabled={!activeQuestion.imageUrl || imageBusy}
                onClick={() => {
                  if (!activeQuestion.imageUrl) return;
                  void openCropEditor(activeQuestion.imageUrl);
                }}
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
                onClick={() =>
                  updateQuestion(activeQuestion.id, {
                    imageUrl: undefined,
                  })
                }
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
        ) : (
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

      {cropOpen && cropSource && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 py-6">
          <div className="w-full max-w-4xl rounded-[28px] border border-[#dce5ef] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Question Image Crop</div>
                <div className="text-xs text-slate-500">
                  Дээш, доош crop-оо тааруулаад хадгална.
                </div>
              </div>
              <button
                className={buttonGhost}
                onClick={() => setCropOpen(false)}
                type="button"
              >
                Хаах
              </button>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-[#dce5ef] bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold text-slate-500">
                  Original
                </div>
                <div className="mt-3 max-h-[480px] overflow-auto rounded-2xl border border-border bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cropSource}
                    alt="Crop source"
                    className="w-full rounded-xl border border-border object-contain"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#dce5ef] bg-[#f8fbff] p-4">
                <div className="text-xs font-semibold text-slate-500">
                  Cropped preview
                </div>
                <div className="mt-3 h-[320px] overflow-hidden rounded-2xl border border-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cropSource}
                    alt="Crop preview"
                    className="w-full object-cover"
                    style={{
                      height: `${100 / Math.max(cropBottom - cropTop, 0.02)}%`,
                      transform: `translateY(-${cropTop * 100}%)`,
                      transformOrigin: "top center",
                    }}
                  />
                </div>

                <div className="mt-4 space-y-4">
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-700">
                      Top crop: {Math.round(cropTop * 100)}%
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={95}
                      value={Math.round(cropTop * 100)}
                      onChange={(event) => {
                        const nextTop = Number(event.target.value) / 100;
                        setCropTop(Math.min(nextTop, cropBottom - 0.02));
                      }}
                    />
                  </label>

                  <label className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-700">
                      Bottom crop: {Math.round(cropBottom * 100)}%
                    </span>
                    <input
                      type="range"
                      min={5}
                      max={100}
                      value={Math.round(cropBottom * 100)}
                      onChange={(event) => {
                        const nextBottom = Number(event.target.value) / 100;
                        setCropBottom(Math.max(nextBottom, cropTop + 0.02));
                      }}
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    className={buttonGhost}
                    onClick={() => {
                      setCropTop(0);
                      setCropBottom(1);
                    }}
                    type="button"
                  >
                    Reset
                  </button>
                  <button
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    disabled={imageBusy}
                    onClick={() => void applyCrop()}
                    type="button"
                  >
                    {imageBusy ? "Хадгалж байна..." : "Apply crop"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
