import { useEffect, useMemo, useState } from "react";
import {
  buttonGhost,
  buttonPrimary,
  cardClass,
  inputClass,
  selectClass,
} from "../styles";
import type { Question } from "../types";

type ExamCreateCardProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "text" | "open" | "mcq";
  setQuestionType: (value: "text" | "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
  questions: Question[];
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (id: string, optionIndex: number, value: string) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
  saveExam: () => void;
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  onPdfUpload: (file: File) => void;
  onCsvUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};

const optionLabels = ["A", "B", "C", "D", "E", "F"];

export default function ExamCreateCard({
  examTitle,
  setExamTitle,
  durationMinutes,
  setDurationMinutes,
  questionText,
  setQuestionText,
  questionType,
  setQuestionType,
  mcqOptions,
  setMcqOptions,
  questionAnswer,
  setQuestionAnswer,
  questions,
  addQuestion,
  removeQuestion,
  updateQuestion,
  updateQuestionOption,
  addQuestionOption,
  removeQuestionOption,
  saveExam,
  pdfUseOcr,
  setPdfUseOcr,
  answerKeyPage,
  setAnswerKeyPage,
  pdfLoading,
  pdfError,
  importError,
  onPdfUpload,
  onCsvUpload,
  onDocxUpload,
}: ExamCreateCardProps) {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (questions.length === 0) {
      setPreviewIndex(0);
      setEditMode(false);
      return;
    }
    if (previewIndex > questions.length - 1) {
      setPreviewIndex(questions.length - 1);
    }
  }, [previewIndex, questions.length]);

  const activeQuestion = questions[previewIndex] ?? null;

  const activeOptions = useMemo(
    () => activeQuestion?.options ?? [],
    [activeQuestion],
  );

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          Шалгалт үүсгэх
        </h2>
        <span className="text-xs text-muted-foreground">PDF / Review / Preview</span>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Файл импорт (PDF / CSV / DOCX)</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                PDF
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onPdfUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onCsvUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
                DOCX
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onDocxUpload(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={pdfUseOcr}
                onChange={(event) => setPdfUseOcr(event.target.checked)}
              />
              <span>Зөв хариултын зураг OCR ашиглах</span>
            </label>
            <input
              type="number"
              min={1}
              className="ml-auto w-24 rounded-lg border border-border bg-card px-2 py-1 text-[11px]"
              placeholder="Page"
              value={answerKeyPage === "last" ? "" : answerKeyPage}
              onChange={(event) => {
                const value = event.target.value;
                setAnswerKeyPage(value ? Number(value) : "last");
              }}
            />
            <span className="text-[11px] text-muted-foreground">(blank = last)</span>
          </div>

          {pdfLoading && <div className="mt-2 text-xs">PDF уншиж байна...</div>}
          {pdfError && <div className="mt-2 text-xs text-red-500">{pdfError}</div>}
          {importError && <div className="mt-2 text-xs text-red-500">{importError}</div>}
        </div>

        <input
          className={inputClass}
          placeholder="Шалгалтын нэр"
          value={examTitle}
          onChange={(event) => setExamTitle(event.target.value)}
        />

        <input
          type="number"
          min={10}
          className={inputClass}
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
          placeholder="Хугацаа (минут)"
        />

        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <input
            className={inputClass}
            placeholder="Асуултын текст"
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
          />
          <select
            className={selectClass}
            value={questionType}
            onChange={(event) =>
              setQuestionType(event.target.value as "text" | "open" | "mcq")
            }
          >
            <option value="text">Текст</option>
            <option value="open">Нөхөх</option>
            <option value="mcq">Сонголт</option>
          </select>
        </div>

        {questionType === "mcq" && (
          <div className="grid gap-2 md:grid-cols-2">
            {["A", "B", "C", "D"].map((label, index) => (
              <input
                key={label}
                className={inputClass}
                placeholder={`${label} сонголт`}
                value={mcqOptions[index] ?? ""}
                onChange={(event) => {
                  const next = [...mcqOptions];
                  next[index] = event.target.value;
                  setMcqOptions(next);
                }}
              />
            ))}
          </div>
        )}

        <input
          className={inputClass}
          placeholder={
            questionType === "mcq"
              ? "Зөв хариулт (A/B/C/D эсвэл option text)"
              : "Зөв хариулт"
          }
          value={questionAnswer}
          onChange={(event) => setQuestionAnswer(event.target.value)}
        />

        <div className="flex flex-wrap gap-2">
          <button className={buttonGhost} onClick={addQuestion}>
            + Асуулт нэмэх
          </button>
          <button className={buttonPrimary} onClick={saveExam}>
            Шалгалт хадгалах
          </button>
        </div>

        {activeQuestion && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Student Preview</div>
                <div className="text-xs text-muted-foreground">
                  Импортолсон асуултыг сурагч яаж харахыг эндээс шалгана.
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
                  {editMode ? "Close Edit" : "Edit"}
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">
                Question {previewIndex + 1}
              </div>

              {editMode ? (
                <div className="mt-3 grid gap-3">
                  <textarea
                    className={`${inputClass} min-h-24 resize-y`}
                    value={activeQuestion.text}
                    onChange={(event) =>
                      updateQuestion(activeQuestion.id, { text: event.target.value })
                    }
                  />

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
                      {activeOptions.map((option, optionIndex) => (
                        <div
                          key={`${activeQuestion.id}-${optionIndex}`}
                          className="flex items-center gap-2"
                        >
                          <button
                            className={`rounded-lg border px-3 py-2 text-sm ${
                              activeQuestion.correctAnswer === option
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-border bg-card"
                            }`}
                            onClick={() =>
                              updateQuestion(activeQuestion.id, {
                                correctAnswer: option,
                              })
                            }
                          >
                            {optionLabels[optionIndex] ?? optionIndex + 1}
                          </button>
                          <input
                            className={inputClass}
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

                      <div className="flex flex-wrap gap-2">
                        <button
                          className={buttonGhost}
                          onClick={() => addQuestionOption(activeQuestion.id)}
                        >
                          + Хариулт нэмэх
                        </button>
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
                <div className="mt-3 grid gap-3">
                  {activeQuestion.imageUrl && (
                    <img
                      src={activeQuestion.imageUrl}
                      alt="Асуултын зураг"
                      className="w-full rounded-xl border border-border object-contain"
                      style={{ maxHeight: 280 }}
                    />
                  )}
                  <div className="text-xl font-semibold leading-8">
                    {activeQuestion.text}
                  </div>

                  {activeQuestion.type === "mcq" ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {activeOptions.map((option, optionIndex) => (
                        <button
                          key={`${activeQuestion.id}-preview-${optionIndex}`}
                          className="rounded-2xl border border-border bg-background px-4 py-4 text-left text-base shadow-sm"
                          onClick={() =>
                            setEditMode(true)
                          }
                        >
                          <span className="font-semibold">
                            {optionLabels[optionIndex] ?? optionIndex + 1}.
                          </span>{" "}
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Сурагч энд хариултаа бичнэ.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    index === previewIndex
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card"
                  }`}
                  onClick={() => setPreviewIndex(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={buttonGhost}
                onClick={() => setPreviewIndex((prev) => Math.max(prev - 1, 0))}
              >
                Prev
              </button>
              <button
                className={buttonGhost}
                onClick={() =>
                  setPreviewIndex((prev) =>
                    Math.min(prev + 1, questions.length - 1),
                  )
                }
              >
                Next
              </button>
              <button
                className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600"
                onClick={() => removeQuestion(activeQuestion.id)}
              >
                Энэ асуултыг устгах
              </button>
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="rounded-xl border border-border bg-muted px-3 py-3 text-sm">
            <div className="text-xs text-muted-foreground">Parsed Questions</div>
            <div className="mt-2 space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                >
                  <button
                    className="min-w-0 flex-1 text-left text-sm"
                    onClick={() => setPreviewIndex(index)}
                  >
                    {index + 1}. {question.text}
                  </button>
                  <button
                    className="text-xs text-red-500 transition hover:opacity-80"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
