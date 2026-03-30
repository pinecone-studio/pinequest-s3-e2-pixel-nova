import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buttonGhost, inputClass, selectClass } from "../../styles";
import type { Question } from "../../types";
import QuestionEditPanel from "./QuestionEditPanel";
import QuestionImageCropModal from "./QuestionImageCropModal";
import QuestionPreviewContent from "./QuestionPreviewContent";
import {
  cropImageDataUrl,
  fetchImageAsDataUrl,
  readFileAsDataUrl,
  optionLabels,
} from "./question-preview-helpers";

type QuestionPreviewPanelProps = {
  questions: Question[];
  previewIndex: number;
  setPreviewIndex: (index: number) => void;
  editMode: boolean;
  setEditMode: (value: boolean | ((value: boolean) => boolean)) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (
    id: string,
    optionIndex: number,
    value: string,
  ) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
  removeQuestion: (id: string) => void;
};
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

  if (!activeQuestion || !editMode) return null;

  const missingCorrect =
    activeQuestion.type === "mcq" &&
    (!activeQuestion.correctAnswer || !activeQuestion.correctAnswer.trim());

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
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className={`w-full max-w-4xl rounded-[30px] border bg-white p-6 shadow-[0_36px_90px_-50px_rgba(15,23,42,0.45)] ${missingCorrect ? "border-amber-300" : "border-[#dce5ef]"}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Асуулт засварлах
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {previewIndex + 1}/{questions.length} дахь асуулт
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() => {
                removeQuestion(activeQuestion.id);
                setEditMode(false);
              }}
              type="button"
            >
              Устгах
            </button>
            <button
              className={buttonGhost}
              onClick={() => setEditMode(false)}
              type="button"
            >
              Хаах
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-[#e7edf5] bg-[#fbfdff] p-4">
            {activeQuestion.imageUrl && (
              <div className="mb-4 overflow-hidden rounded-2xl border border-[#dce5ef] bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeQuestion.imageUrl}
                  alt="Асуултын зураг"
                  className="w-full rounded-xl object-contain"
                  style={{ maxHeight: 280 }}
                />
              </div>
            )}

            <QuestionEditPanel
              activeQuestion={activeQuestion}
              activeOptions={activeOptions}
              imageBusy={imageBusy}
              attachInputRef={attachInputRef}
              onAttachFile={async (file) => {
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
              onOpenCrop={() => {
                if (!activeQuestion.imageUrl) return;
                void openCropEditor(activeQuestion.imageUrl);
              }}
              onRemoveImage={() =>
                updateQuestion(activeQuestion.id, { imageUrl: undefined })
              }
              updateQuestion={updateQuestion}
              updateQuestionOption={updateQuestionOption}
              addQuestionOption={addQuestionOption}
              removeQuestionOption={removeQuestionOption}
            />
          </div>

          <div className="rounded-[24px] border border-[#e7edf5] bg-[#fbfdff] p-4">
            <div className="text-sm font-semibold text-slate-800">
              Сурагчийн харагдах байдал
            </div>
            <div className="mt-4 rounded-[20px] border border-[#e7edf5] bg-white p-4">
              <QuestionPreviewContent
                activeQuestion={activeQuestion}
                activeOptions={activeOptions}
                previewIndex={previewIndex}
                interactive={false}
              />
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-semibold text-slate-500">
                Зөв хариулт
              </label>
              {activeQuestion.type === "mcq" ? (
                <div
                  className="relative mt-1"
                  tabIndex={0}
                  onBlur={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node)) {
                      return;
                    }
                    setEditCorrectOpen(false);
                  }}
                >
                  <button
                    className={`${selectClass} flex w-full items-center justify-between`}
                    onClick={() => setEditCorrectOpen(!editCorrectOpen)}
                    type="button"
                  >
                    <span className="truncate">
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
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
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
                        onMouseDown={(event) => event.preventDefault()}
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
              ) : (
                <input
                  className={`${inputClass} mt-1`}
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
          </div>
        </div>
      </div>

      <QuestionImageCropModal
        open={cropOpen}
        source={cropSource}
        cropTop={cropTop}
        setCropTop={setCropTop}
        cropBottom={cropBottom}
        setCropBottom={setCropBottom}
        imageBusy={imageBusy}
        onClose={() => setCropOpen(false)}
        onReset={() => {
          setCropTop(0);
          setCropBottom(1);
        }}
        onApply={() => void applyCrop()}
      />
    </div>,
    document.body,
  );
}
