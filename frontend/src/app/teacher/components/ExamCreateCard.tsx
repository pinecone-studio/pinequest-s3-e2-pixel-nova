import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { buttonPrimary, cardClass } from "../styles";
import type { Question } from "../types";
import ExamMetaFields from "./exam-create/ExamMetaFields";
import QuestionFormSection from "./exam-create/QuestionFormSection";
import QuestionPreviewPanel from "./exam-create/QuestionPreviewPanel";
import QuestionListPanel from "./exam-create/QuestionListPanel";

type ExamCreateCardProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "open" | "mcq";
  setQuestionType: (value: "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
  questionImageUrl?: string;
  setQuestionImageUrl: (value: string | undefined) => void;
  questionPoints: number;
  setQuestionPoints: (value: number) => void;
  questionCorrectIndex: number;
  setQuestionCorrectIndex: (value: number) => void;
  questions: Question[];
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (
    id: string,
    optionIndex: number,
    value: string,
  ) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
  saveExam: () => void;
  saving: boolean;
  hasUser: boolean;
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  importMcqCount: number;
  setImportMcqCount: (value: number) => void;
  importTextCount: number;
  setImportTextCount: (value: number) => void;
  importOpenCount: number;
  setImportOpenCount: (value: number) => void;
  shuffleImportedQuestions: boolean;
  setShuffleImportedQuestions: (value: boolean) => void;
  plannedQuestionCount: number;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  importLoading: boolean;
  importLoadingLabel: string | null;
  onPdfUpload: (file: File, options?: { preserveTitle?: boolean }) => void;
  onImageUpload: (file: File, options?: { preserveTitle?: boolean }) => void;
  onDocxUpload: (file: File, options?: { preserveTitle?: boolean }) => void;
  aiFlowStatus: "idle" | "loading" | "ready" | "error";
  aiFlowTopic: string;
};

export default function ExamCreateCard({
  examTitle,
  setExamTitle,
  questionText,
  setQuestionText,
  questionType,
  setQuestionType,
  mcqOptions,
  setMcqOptions,
  questionAnswer,
  setQuestionAnswer,
  questionImageUrl,
  setQuestionImageUrl,
  questionPoints,
  setQuestionPoints,
  questionCorrectIndex,
  setQuestionCorrectIndex,
  questions,
  addQuestion,
  removeQuestion,
  updateQuestion,
  updateQuestionOption,
  addQuestionOption,
  removeQuestionOption,
  saveExam,
  saving,
  hasUser,
  aiFlowStatus,
  aiFlowTopic,
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

  const missingCorrectCount = useMemo(
    () =>
      questions.filter(
        (question) =>
          question.type === "mcq" &&
          (!question.correctAnswer || !question.correctAnswer.trim()),
      ).length,
    [questions],
  );

  return (
    // <div
    //   className={`${cardClass} rounded-[34px] border-[#e3eaf2] bg-white/92 p-6 backdrop-blur`}>
    <div>
      <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[34px]">
            Шалгалт үүсгэх
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-slate-500 sm:text-[15px]">
            Та бэлтгэсэн материалаа зураг, pdf, docx хэлбэрээр оруулж хялбаргаар
            шалгалт үүсгээрэй.
          </p>
        </div>

        {aiFlowStatus !== "idle" && (
          <div
            className={`rounded-[22px] border px-4 py-3 text-sm shadow-[0_16px_30px_-26px_rgba(15,23,42,0.16)] ${
              aiFlowStatus === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : aiFlowStatus === "ready"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-[#dbe7fb] bg-[#eff6ff] text-[#1d4ed8]"
            }`}>
            {aiFlowStatus === "loading" && (
              <span>AI асуултууд үүсэж байна: {aiFlowTopic}...</span>
            )}
            {aiFlowStatus === "ready" && (
              <span>AI асуултууд бэлэн боллоо: {aiFlowTopic}</span>
            )}
            {aiFlowStatus === "error" && (
              <span>
                AI асуултууд үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.
              </span>
            )}
          </div>
        )}

        <ExamMetaFields examTitle={examTitle} setExamTitle={setExamTitle} />

        <div className="space-y-4 rounded-[22px] border border-[#d9dde6] bg-white p-5">
          <QuestionListPanel
            questions={questions}
            onEdit={(index) => {
              setPreviewIndex(index);
              setEditMode(true);
            }}
            onRemove={removeQuestion}
          />

          <div className="flex justify-end">
            <button
              className={`inline-flex items-center gap-2 ${buttonPrimary}`}
              onClick={saveExam}
              type="button"
              disabled={saving || !hasUser}>
              {saving && (
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeOpacity="0.28"
                    strokeWidth="2"
                  />
                  <path
                    d="M21 12a9 9 0 0 0-9-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              {!hasUser
                ? "Багш сонгогдоогүй"
                : saving
                  ? "Хадгалж байна..."
                  : "Шалгалт хадгалах"}
            </button>
          </div>
        </div>

        <div className="rounded-[30px] border border-[#e7edf5] bg-white p-5 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.16)]">
          <QuestionFormSection
            questionText={questionText}
            setQuestionText={setQuestionText}
            questionType={questionType}
            setQuestionType={setQuestionType}
            mcqOptions={mcqOptions}
            setMcqOptions={setMcqOptions}
            questionAnswer={questionAnswer}
            setQuestionAnswer={setQuestionAnswer}
            questionImageUrl={questionImageUrl}
            setQuestionImageUrl={setQuestionImageUrl}
            questionPoints={questionPoints}
            setQuestionPoints={setQuestionPoints}
            questionCorrectIndex={questionCorrectIndex}
            setQuestionCorrectIndex={setQuestionCorrectIndex}
            addQuestion={addQuestion}
          />
        </div>

        {aiFlowStatus === "error" && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            AI үүсгэлт амжилтгүй болсон тул асуулт нэмэгдээгүй байна. Дахин
            оролдоно уу.
          </div>
        )}

        {missingCorrectCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Зөв хариулт сонгоогүй: {missingCorrectCount}
          </span>
        )}

        {!hasUser && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Багшийн хэрэглэгч сонгогдоогүй байна. Role сонголтоор багш сонгоод
            дахин оролдоно уу.
          </div>
        )}

        {saving && (
          <div className="grid gap-3 rounded-[24px] border border-[#e8edf9] bg-[#f8fbff] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.14)]">
            <Skeleton className="h-4 w-40 rounded-full" />
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        )}
      </div>
      <QuestionPreviewPanel
        questions={questions}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
        editMode={editMode}
        setEditMode={setEditMode}
        updateQuestion={updateQuestion}
        updateQuestionOption={updateQuestionOption}
        addQuestionOption={addQuestionOption}
        removeQuestionOption={removeQuestionOption}
        removeQuestion={removeQuestion}
      />
    </div>
  );
}
