import { useMemo, useRef, useState } from "react";
import { buttonGhost } from "../../styles";
import type { Question } from "../../types";
import QuestionEditPanel from "./QuestionEditPanel";
import QuestionImageCropModal from "./QuestionImageCropModal";
import QuestionPreviewContent from "./QuestionPreviewContent";
import QuestionPreviewNav from "./QuestionPreviewNav";
import {
  cropImageDataUrl,
  fetchImageAsDataUrl,
  optionLabels,
  readFileAsDataUrl,
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

  if (!activeQuestion) return null;

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

  return (
    <div
      className={`rounded-[28px] border bg-[#f8fbff] flex flex-col items-center p-4 ${missingCorrect ? "border-amber-400" : "border-[#dce5ef]"}`}
    >
      <div className="flex items-center w-[98%] justify-between gap-3">
        <div>
          <div className="text-base font-semibold">
            Сурагчийн харагдах байдал
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

      <div className="mt-4 w-[98%] rounded-[24px] border border-[#dce5ef] bg-white p-4">
        <div className="w-full flex justify-between">
          <div className="text-[16px] text-slate-500">
            Асуулт {previewIndex + 1}
          </div>
          <div className="text-[16px] text-black">
            Оноо {activeQuestion.points ?? 1}
          </div>
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
          <QuestionEditPanel
            activeQuestion={activeQuestion}
            activeOptions={activeOptions}
            imageBusy={imageBusy}
            attachInputRef={attachInputRef}
            editCorrectOpen={editCorrectOpen}
            setEditCorrectOpen={setEditCorrectOpen}
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
        ) : (
          <QuestionPreviewContent
            activeQuestion={activeQuestion}
            activeOptions={activeOptions}
            previewIndex={previewIndex}
            setEditMode={setEditMode}
          />
        )}
      </div>

      <QuestionPreviewNav
        questions={questions}
        previewIndex={previewIndex}
        setPreviewIndex={setPreviewIndex}
        removeQuestion={removeQuestion}
      />

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
    </div>
  );
}
