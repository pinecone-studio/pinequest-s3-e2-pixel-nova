import { buttonGhost, buttonPrimary, cardClass, inputClass, selectClass } from "../styles";
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
  saveExam: () => void;
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null; importError: string | null;
  onPdfUpload: (file: File) => void;
  onCsvUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};
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
        <span className="text-xs text-muted-foreground">Тест / Задгай</span>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-dashed border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>Файл импорт (PDF / CSV / DOCX)</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-1 text-xs text-foreground transition hover:bg-muted">
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
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16v16H4z" />
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                  <path d="M8 16h6" />
                </svg>
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
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
                  <path d="M14 2v6h6" />
                  <path d="M8 13h8" />
                  <path d="M8 17h6" />
                </svg>
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
          <div className="mt-2 flex items-center gap-2">
            <input
              id="ocr-toggle"
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              checked={pdfUseOcr}
              onChange={(event) => setPdfUseOcr(event.target.checked)}
            />
            <label htmlFor="ocr-toggle" className="text-xs">
              Зөв хариултын зураг OCR ашиглах
            </label>
            <input
              type="number"
              min={1}
              className="ml-auto w-24 rounded-lg border border-border bg-card px-2 py-1 text-[11px]"
              placeholder="Хуудас"
              value={answerKeyPage === "last" ? "" : answerKeyPage}
              onChange={(event) => {
                const value = event.target.value;
                setAnswerKeyPage(value ? Number(value) : "last");
              }}
            />
            <span className="text-[11px] text-muted-foreground">
              (хоосон бол сүүлийн хуудас)
            </span>
          </div>
          {pdfLoading && (
            <div className="mt-2 text-xs text-muted-foreground">
              PDF уншиж байна...
            </div>
          )}
          {pdfError && <div className="mt-2 text-xs text-red-500">{pdfError}</div>}
          {importError && (
            <div className="mt-2 text-xs text-red-500">{importError}</div>
          )}
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
            <option value="open">Задгай</option>
            <option value="mcq">Сонголт (A,B,C,D)</option>
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
              ? "Зөв хариулт (A/B/C/D эсвэл сонголтын текст)"
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
        {questions.length > 0 && (
          <div className="rounded-xl border border-border bg-muted px-3 py-2 text-sm">
            <div className="text-xs text-muted-foreground">Нэмсэн асуултууд</div>
            <div className="mt-2 space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-2 py-1"
                >
                  <div className="text-xs">
                    {index + 1}. {question.text} ({
                      question.type === "text"
                        ? "Текст"
                        : question.type === "open"
                          ? "Задгай"
                          : "Сонголт"
                    })
                  </div>
                  <button
                    className="text-xs text-red-500 transition hover:opacity-80"
                    onClick={() => removeQuestion(question.id)}
                  >
                    Устгах
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
