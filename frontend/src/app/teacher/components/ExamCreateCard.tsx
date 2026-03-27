import { useEffect, useMemo, useState } from "react";
import { buttonGhost, buttonPrimary, cardClass } from "../styles";
import type { Question } from "../types";
import { Plus } from "lucide-react";
import ExamImportPanel from "./exam-create/ExamImportPanel";
import ExamMetaFields from "./exam-create/ExamMetaFields";
import QuestionFormSection from "./exam-create/QuestionFormSection";
import QuestionPreviewPanel from "./exam-create/QuestionPreviewPanel";
import QuestionListPanel from "./exam-create/QuestionListPanel";

type ExamCreateCardProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
  createDate: string;
  setCreateDate: (value: string) => void;
  expectedStudentsCount: number;
  setExpectedStudentsCount: (value: number) => void;
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
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  importLoading: boolean;
  importLoadingLabel: string | null;
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};

export default function ExamCreateCard({
  examTitle,
  setExamTitle,
  createDate,
  setCreateDate,
  expectedStudentsCount,
  setExpectedStudentsCount,
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
  pdfUseOcr,
  setPdfUseOcr,
  answerKeyPage,
  setAnswerKeyPage,
  pdfLoading,
  pdfError,
  importError,
  importLoading,
  importLoadingLabel,
  onPdfUpload,
  onImageUpload,
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
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3"></div>

      <div className="mt-6 grid gap-4">
        <ExamImportPanel
          pdfUseOcr={pdfUseOcr}
          setPdfUseOcr={setPdfUseOcr}
          answerKeyPage={answerKeyPage}
          setAnswerKeyPage={setAnswerKeyPage}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          importError={importError}
          importLoading={importLoading}
          importLoadingLabel={importLoadingLabel}
          onPdfUpload={onPdfUpload}
          onImageUpload={onImageUpload}
          onDocxUpload={onDocxUpload}
        />

        <ExamMetaFields
          examTitle={examTitle}
          setExamTitle={setExamTitle}
          createDate={createDate}
          setCreateDate={setCreateDate}
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          expectedStudentsCount={expectedStudentsCount}
          setExpectedStudentsCount={setExpectedStudentsCount}
        />

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
        />

        <div className="flex flex-wrap gap-3">
          <button className={buttonGhost} onClick={addQuestion}>
            + Асуулт нэмэх
          </button>
          <button
            className={`${buttonPrimary} ${saving || !hasUser ? "opacity-70" : ""}`}
            onClick={saveExam}
            type="button"
            disabled={saving || !hasUser}
          >
            {!hasUser
              ? "Багш сонгоогдоогүй"
              : saving
                ? "Хадгалж байна..."
                : "Шалгалт хадгалах"}
          </button>
          {missingCorrectCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              ⚠️ Зөв хариулт сонгоогүй: {missingCorrectCount}
            </span>
          )}
        </div>

        {!hasUser && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Багшийн хэрэглэгч сонгоогдоогүй байна. Role сонголтоор багш сонгоод
            дахин оролдоно уу.
          </div>
        )}

        {saving && (
          <div className="grid gap-3 rounded-2xl border border-[#e8edf9] bg-[#f8faff] p-4">
            <div className="h-4 w-40 animate-pulse rounded-full bg-[#e6ecfb]" />
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="h-20 animate-pulse rounded-2xl bg-white/80" />
              <div className="h-20 animate-pulse rounded-2xl bg-white/80" />
            </div>
          </div>
        )}

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

        <QuestionListPanel
          questions={questions}
          onSelect={setPreviewIndex}
          onRemove={removeQuestion}
        />
      </div>
    </div>
  );
}
