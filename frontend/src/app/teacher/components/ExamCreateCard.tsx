import { useEffect, useMemo, useState } from "react";
import {
  badgeClass,
  buttonGhost,
  buttonPrimary,
  cardClass,
  sectionDescriptionClass,
} from "../styles";
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
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
};

export default function ExamCreateCard({
  examTitle,
  setExamTitle,
  createDate,
  setCreateDate,
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
  pdfUseOcr,
  setPdfUseOcr,
  answerKeyPage,
  setAnswerKeyPage,
  pdfLoading,
  pdfError,
  importError,
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
          question.type === "mcq" && (!question.correctAnswer || !question.correctAnswer.trim()),
      ).length,
    [questions],
  );

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={badgeClass}>Create Exam</span>
          <h2 className="mt-3 flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Plus className="w-4 h-4" />
          Шалгалт үүсгэх
          </h2>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Гараар эсвэл файл импортолж асуултаа оруулаад нэг ижил бүтэцтэйгээр шалгалт хадгална.
          </p>
        </div>
        <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-slate-500">
          PDF / Review / Preview
        </span>
      </div>

      <div className="mt-6 grid gap-4">
        <ExamImportPanel
          pdfUseOcr={pdfUseOcr}
          setPdfUseOcr={setPdfUseOcr}
          answerKeyPage={answerKeyPage}
          setAnswerKeyPage={setAnswerKeyPage}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          importError={importError}
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
          questionPoints={questionPoints}
          setQuestionPoints={setQuestionPoints}
          questionCorrectIndex={questionCorrectIndex}
          setQuestionCorrectIndex={setQuestionCorrectIndex}
        />

        <div className="flex flex-wrap gap-3">
          <button className={buttonGhost} onClick={addQuestion}>
            + Асуулт нэмэх
          </button>
          <button className={buttonPrimary} onClick={saveExam} type="button">
            Шалгалт хадгалах
          </button>
          {missingCorrectCount > 0 && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
              ⚠️ Зөв хариулт сонгоогүй: {missingCorrectCount}
            </span>
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

        <QuestionListPanel
          questions={questions}
          onSelect={setPreviewIndex}
          onRemove={removeQuestion}
        />
      </div>
    </div>
  );
}
