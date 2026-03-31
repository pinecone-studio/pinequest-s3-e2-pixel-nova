import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, FileTextIcon } from "lucide-react";
import type { Exam } from "../types";
import QuestionPreviewContent from "./exam-create/QuestionPreviewContent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExamPreviewDialogProps = {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ExamPreviewDialog({
  exam,
  open,
  onOpenChange,
}: ExamPreviewDialogProps) {
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPreviewIndex(0);
  }, [exam?.id, open]);

  const questionCount = exam?.questions.length ?? 0;
  const activeQuestion = exam?.questions[previewIndex] ?? null;
  const activeOptions = useMemo(
    () => activeQuestion?.options ?? [],
    [activeQuestion],
  );

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[820px] gap-0 rounded-[30px] border border-[#dce5ef] bg-white p-0 shadow-[0_36px_90px_-50px_rgba(15,23,42,0.45)]">
        <DialogHeader className="border-b border-[#e8edf4] px-6 py-5">
          <DialogTitle className="text-[24px] font-semibold leading-8 text-slate-900">
            {exam.title}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-slate-500">
            {[exam.className, exam.description, `${questionCount} асуулт`]
              .filter(Boolean)
              .join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6">
          {activeQuestion ? (
            <>
              <div className="rounded-[24px] border border-[#e7edf5] bg-[#fbfdff] p-5">
                {activeQuestion.imageUrl ? (
                  <div className="mb-4 overflow-hidden rounded-2xl border border-[#dce5ef] bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeQuestion.imageUrl}
                      alt="Асуултын зураг"
                      className="w-full rounded-xl object-contain"
                      style={{ maxHeight: 280 }}
                    />
                  </div>
                ) : null}

                <QuestionPreviewContent
                  activeQuestion={activeQuestion}
                  activeOptions={activeOptions}
                  previewIndex={previewIndex}
                  interactive={false}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {exam.questions.map((question, index) => {
                  const isActive = index === previewIndex;
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setPreviewIndex(index)}
                      className={`rounded-xl border px-3 py-2 text-sm transition ${
                        isActive
                          ? "border-[#2563eb] bg-[#eff6ff] text-[#2563eb]"
                          : "border-[#dce5ef] bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[#dce5ef] bg-[#fbfdff] px-6 py-12 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#dce5ef] bg-white text-slate-400">
                <FileTextIcon className="size-5" />
              </div>
              <div className="mt-4 text-base font-semibold text-slate-800">
                Асуулт оруулаагүй шалгалт байна
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Энэ шалгалтад одоогоор preview хийх асуулт алга.
              </div>
            </div>
          )}
        </div>

        {activeQuestion ? (
          <div className="flex items-center justify-between border-t border-[#e8edf4] px-6 py-4">
            <div className="text-sm text-slate-500">
              Асуулт {previewIndex + 1} / {questionCount}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewIndex(Math.max(previewIndex - 1, 0))}
                disabled={previewIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dce5ef] px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeftIcon className="size-4" />
                Өмнөх
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewIndex(Math.min(previewIndex + 1, questionCount - 1))
                }
                disabled={previewIndex === questionCount - 1}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dce5ef] px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Дараах
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
