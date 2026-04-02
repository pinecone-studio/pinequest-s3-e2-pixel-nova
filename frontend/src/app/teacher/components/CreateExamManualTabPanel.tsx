"use client";

import { Copy, Grip, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import QuestionTypeDropdown from "./exam-create/QuestionTypeDropdown";
import type { PendingQuestionDraft } from "../create-exam-dialog-state";
import type { ManualQuestionDraft } from "./CreateExamDialogContent.types";
import { Spinner } from "@/components/ui/spinner";

type Props = {
  title: string;
  titleError?: string;
  questionDraft: ManualQuestionDraft;
  questionError?: string;
  questionsError?: string;
  addedQuestions: PendingQuestionDraft[];
  onTitleChange: (value: string) => void;
  onQuestionDraftChange: (
    key: keyof ManualQuestionDraft,
    value: string | number,
  ) => void;
  onContinue: () => void;
  pending: boolean;
};

export default function CreateExamManualTabPanel({
  title,
  titleError,
  questionDraft,
  questionError,
  questionsError,
  addedQuestions,
  onTitleChange,
  onQuestionDraftChange,
  onContinue,
  pending,
}: Props) {
  return (
    <>
      <section className="mt-10 rounded-[22px] border border-[#e5e7eb] bg-white px-6 py-5 shadow-[0_1px_0_rgba(255,255,255,0.9)]">
        <label className="block text-[18px] font-semibold text-[#111827]">
          Шалгалтын сэдэв оруулна уу
        </label>
        <Input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Шалгалтын сэдвээ оруулна уу"
          className="mt-6 h-11 rounded-none border-x-0 border-t-0 border-b border-b-[#d7dde6] px-0 text-[14px] shadow-none focus-visible:ring-0"
        />
        {titleError && (
          <p className="mt-2 text-[12px] font-medium text-red-600">
            {titleError}
          </p>
        )}
      </section>

      <section className="mt-4 rounded-[22px] border border-[#e5e7eb] bg-white px-6 py-6 mb-10  shadow-[0_1px_0_rgba(255,255,255,0.85)]">
        <div className="rounded-[20px] border border-transparent px-1 py-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[12px] font-semibold text-[#2563eb]">
                  1
                </span>
                <div className="min-w-0 flex-1">
                  <input
                    value={questionDraft.text}
                    onChange={(event) =>
                      onQuestionDraftChange("text", event.target.value)
                    }
                    placeholder="Асуултаа оруулна уу."
                    className="w-full border-0 border-b border-b-[#dfe6ef] bg-transparent px-0 pb-1 text-[17px] font-medium text-[#111827] outline-none placeholder:text-[#111827] placeholder:opacity-100 focus:border-b-[#c9d3e0] focus:ring-0"
                  />
                </div>
              </div>
            </div>

            <QuestionTypeDropdown
              value={questionDraft.type}
              onChange={(value) => onQuestionDraftChange("type", value)}
              className="w-[168px]"
            />
          </div>

          <div className="mt-8 px-4">
            {questionDraft.type === "mcq" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {["A", "B", "C", "D"].map((label, index) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 rounded-[18px] border border-[#e6ecf3] bg-[#fbfcfd] px-4 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.14)]">
                      {label}
                    </span>
                    <input
                      className="w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
                      placeholder={`${label}. сонголт`}
                      value={questionDraft.mcqOptions[index] ?? ""}
                      onChange={(event) =>
                        onQuestionDraftChange(
                          "mcqOptions",
                          JSON.stringify(
                            questionDraft.mcqOptions.map(
                              (option, optionIndex) =>
                                optionIndex === index
                                  ? event.target.value
                                  : option,
                            ),
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
                <div>
                  <label className="mb-2 block text-[12px] font-medium text-[#6b7280]">
                    Хариулт
                  </label>
                  <input
                    className="h-10 w-full rounded-none border-x-0 border-t-0 border-b border-b-[#d7dde6] bg-transparent px-0 text-[14px] text-[#111827] shadow-none outline-none placeholder:text-[#b8c0cc]"
                    placeholder="Хариулт оруулна уу"
                    value={questionDraft.answer}
                    onChange={(event) =>
                      onQuestionDraftChange("answer", event.target.value)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="manual-question-points"
                    className="mb-2 block text-[12px] font-medium text-[#6b7280]">
                    Оноо
                  </label>
                  <input
                    id="manual-question-points"
                    type="number"
                    min={1}
                    value={questionDraft.points}
                    onChange={(event) =>
                      onQuestionDraftChange(
                        "points",
                        Math.max(1, Number(event.target.value) || 1),
                      )
                    }
                    className="h-10 w-full rounded-2xl border border-[#d7dde6] bg-white px-3 text-[14px] text-[#111827] outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className={`mt-4 flex flex-wrap items-center gap-4 px-2 text-[#6b7280] ${questionDraft.type === "mcq" ? "justify-between" : "justify-end"}`}>
            {questionDraft.type === "mcq" && (
              <div>
                <label
                  htmlFor="manual-question-points"
                  className="mb-2 block text-[12px] font-medium text-[#6b7280]">
                  Оноо
                </label>
                <input
                  id="manual-question-points"
                  type="number"
                  min={1}
                  value={questionDraft.points}
                  onChange={(event) =>
                    onQuestionDraftChange(
                      "points",
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                  className="h-10 w-full rounded-2xl border border-[#d7dde6] bg-white px-3 text-[14px] text-[#111827] outline-none focus:border-[#2563eb]"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Add image"
                className="transition hover:text-[#111827]">
                <ImagePlus className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Duplicate question"
                className="transition hover:text-[#111827]">
                <Copy className="size-4" />
              </button>
              <div className="h-5 w-px bg-[#d7dde6]" />
              <Button
                variant="outline"
                className="h-10 rounded-2xl border-[#d7e0ea] px-4 text-[14px] font-medium text-[#31558c]"
                onClick={onContinue}
                type="button">
                + Асуулт нэмэх
              </Button>
            </div>
          </div>

          {questionError && (
            <p className="mt-4 text-[12px] font-medium text-red-600">
              {questionError}
            </p>
          )}

          {questionsError && (
            <p className="mt-2 text-[12px] font-medium text-red-600">
              {questionsError}
            </p>
          )}

          {addedQuestions.length > 0 && (
            <div className="mt-4 grid gap-3 rounded-[22px] border border-[#e7edf5] bg-[#fbfdff] p-4">
              {addedQuestions.map((question, index) => (
                <div
                  key={`${question.text}-${index}`}
                  className="rounded-2xl border border-[#e6edf7] bg-white px-4 py-3 text-[13px] text-slate-700">
                  <div className="font-semibold text-slate-900">
                    Асуулт {index + 1}
                  </div>
                  <div className="mt-1 line-clamp-2">{question.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
