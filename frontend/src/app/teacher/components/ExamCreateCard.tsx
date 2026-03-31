import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { cardClass } from "../styles";
import type { Question } from "../types";
import ExamImportPanel from "./exam-create/ExamImportPanel";
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
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
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
  pdfUseOcr,
  setPdfUseOcr,
  answerKeyPage,
  setAnswerKeyPage,
  importMcqCount,
  setImportMcqCount,
  importOpenCount,
  setImportOpenCount,
  shuffleImportedQuestions,
  setShuffleImportedQuestions,
  plannedQuestionCount,
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
    <div className={`${cardClass} rounded-[34px] border-[#e3eaf2] bg-white/92 p-6 backdrop-blur`}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(430px,520px)] lg:items-start">
        <div className="rounded-[30px] border border-[#e8eef7] bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] p-6 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.18)]">
          <span className="inline-flex rounded-full border border-[#dbe7fb] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">
            Exam Builder
          </span>
          <h2 className="mt-4 text-[36px] font-semibold tracking-[-0.04em] text-slate-900">
            Шалгалт үүсгэх
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-500">
            Та бэлдсэн материалаа зураг, PDF, DOCX хэлбэрээр оруулж хялбараар
            шалгалт үүсгээрэй. Импортын тохиргоогоор яг хэдэн төрлийн асуулт
            авахыг урьдчилж нарийн зааж болно.
          </p>
        </div>

        <ExamImportPanel
          pdfUseOcr={pdfUseOcr}
          setPdfUseOcr={setPdfUseOcr}
          answerKeyPage={answerKeyPage}
          setAnswerKeyPage={setAnswerKeyPage}
          importMcqCount={importMcqCount}
          setImportMcqCount={setImportMcqCount}
          importOpenCount={importOpenCount}
          setImportOpenCount={setImportOpenCount}
          shuffleImportedQuestions={shuffleImportedQuestions}
          setShuffleImportedQuestions={setShuffleImportedQuestions}
          plannedQuestionCount={plannedQuestionCount}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          importError={importError}
          importLoading={importLoading}
          importLoadingLabel={importLoadingLabel}
          onPdfUpload={onPdfUpload}
          onImageUpload={onImageUpload}
          onDocxUpload={onDocxUpload}
        />
      </div>

      <div className="mt-6 rounded-[36px] border border-[#e7edf5] bg-white p-5 shadow-[0_20px_48px_-38px_rgba(15,23,42,0.16)]">
        <div className="grid gap-6">
          <ExamMetaFields
            examTitle={examTitle}
            setExamTitle={setExamTitle}
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
            addQuestion={addQuestion}
            saveExam={saveExam}
            saving={saving}
            hasUser={hasUser}
          />
        </div>
      </div>

      <div className="mt-4">
        {missingCorrectCount > 0 && (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Зөв хариулт сонгоогүй: {missingCorrectCount}
          </span>
        )}
      </div>

      {!hasUser && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Багшийн хэрэглэгч сонгоогдоогүй байна. Role сонголтоор багш сонгоод
          дахин оролдоно уу.
        </div>
      )}

      {saving && (
        <div className="mt-4 grid gap-3 rounded-[24px] border border-[#e8edf9] bg-[#f8fbff] p-4 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.14)]">
          <Skeleton className="h-4 w-40 rounded-full" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      )}

      <div className="mt-6">
        <QuestionListPanel
          questions={questions}
          onEdit={(index) => {
            setPreviewIndex(index);
            setEditMode(true);
          }}
          onRemove={removeQuestion}
        />
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
