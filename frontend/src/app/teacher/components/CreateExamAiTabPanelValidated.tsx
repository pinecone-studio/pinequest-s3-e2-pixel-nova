"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import TeacherSelect from "./TeacherSelect";
import type { AiExamGeneratorInput } from "../types";
import type { AiErrors } from "./CreateExamDialogContent.types";

const fieldClass =
  "h-9 rounded-2xl border border-[#d9dde6] bg-white px-4 text-[14px] text-[#111827] shadow-none placeholder:text-[#9aa2af] focus-visible:ring-0";

type Props = {
  input: AiExamGeneratorInput;
  errors: AiErrors;
  onChange: <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => void;
  onContinue: () => void;
  pending: boolean;
};

export default function CreateExamAiTabPanelValidated({
  input,
  errors,
  onChange,
  onContinue,
  pending,
}: Props) {
  return (
    <>
      <section className="mt-4 rounded-[22px] border border-[#d9dde6] bg-white px-5 py-5">
        <h3 className="text-[16px] font-semibold text-[#111827]">
          AI-аар шалгалтын ноорог үүсгэх
        </h3>
        <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
          Доорх асуултуудыг бөглөснөөр засварлахад бэлэн шалгалтын ноорог үүснэ.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Шалгалтын гарчиг
            </span>
            <Input
              value={input.topic}
              onChange={(event) => onChange("topic", event.target.value)}
              placeholder="Жишээ нь: Present simple tense"
              className={fieldClass}
            />
            {errors.topic && (
              <p className="text-[12px] font-medium text-red-600">
                {errors.topic}
              </p>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Хичээл
            </span>
            <Input
              value={input.subject ?? ""}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="Жишээ нь: Англи хэл"
              className={fieldClass}
            />
            {errors.subject && (
              <p className="text-[12px] font-medium text-red-600">
                {errors.subject}
              </p>
            )}
          </label>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1.25fr)_214px_214px]">
          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">Анги</span>
            <Input
              value={input.gradeOrClass ?? ""}
              onChange={(event) => onChange("gradeOrClass", event.target.value)}
              placeholder="Хэддүгээр ангид зориулэх вэ?"
              className={fieldClass}
            />
            {errors.gradeOrClass && (
              <p className="text-[12px] font-medium text-red-600">
                {errors.gradeOrClass}
              </p>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Түвшин
            </span>
            <TeacherSelect
              compact
              value={input.difficulty}
              onChange={(event) =>
                onChange(
                  "difficulty",
                  event.target.value as AiExamGeneratorInput["difficulty"],
                )
              }
              options={[
                { value: "easy", label: "Анхан шат" },
                { value: "medium", label: "Дунд шат" },
                { value: "hard", label: "Ахисан шат" },
              ]}
            />
            {errors.difficulty && (
              <p className="text-[12px] font-medium text-red-600">
                {errors.difficulty}
              </p>
            )}
          </label>

          <label className="block space-y-2">
            <span className="text-[14px] font-medium text-[#111827]">
              Асуултын тоо
            </span>
            <Input
              type="number"
              min={1}
              value={String(input.questionCount)}
              onChange={(event) =>
                onChange(
                  "questionCount",
                  Math.max(1, Number(event.target.value) || 1),
                )
              }
              placeholder="Хэдэн асуулттай байх"
              className={fieldClass}
            />
            {errors.questionCount && (
              <p className="text-[12px] font-medium text-red-600">
                {errors.questionCount}
              </p>
            )}
          </label>
        </div>

        <label className="mt-6 block space-y-2">
          <span className="text-[14px] font-medium text-[#111827]">
            Нэмэлт мэдээлэл
          </span>
          <textarea
            rows={4}
            value={input.instructions ?? ""}
            onChange={(event) => onChange("instructions", event.target.value)}
            placeholder="Жишээ нь: 70 хувь нь задгай даалгавар, 30 хувь нь нэг хариулттай гэх мэт..."
            className="min-h-[82px] w-full rounded-2xl border border-[#d9dde6] bg-white px-4 py-3 text-[14px] text-[#111827] outline-none placeholder:text-[#9aa2af]"
          />
          {errors.instructions && (
            <p className="text-[12px] font-medium text-red-600">
              {errors.instructions}
            </p>
          )}
        </label>
      </section>

      <DialogFooter className="mt-4 border-t-0 bg-transparent px-8 pb-8 pt-0 sm:justify-end">
        <Button
          className="h-10 rounded-2xl bg-[#2563eb] px-6 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
          onClick={onContinue}
          disabled={pending}
        >
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            {pending ? "Нээж байна..." : "Ноорог үүсгэх"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}
