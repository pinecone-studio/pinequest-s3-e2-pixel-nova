"use client";

import { CloudUpload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { PdfErrors, PdfCountKey } from "./CreateExamDialogContent.types";

type Props = {
  examTitle: string;
  onExamTitleChange: (value: string) => void;
  counts: Record<PdfCountKey, number>;
  onCountChange: (key: PdfCountKey, value: number) => void;
  selectedFileName: string | null;
  onPickFile: () => void;
  errors: PdfErrors;
  importError?: string | null;
  generatedCount?: number;
  generatedPreview?: string[];
  onContinue: () => void;
  onOpenEditor?: () => void;
  pending: boolean;
};

const countCards: Array<{
  key: PdfCountKey;
  label: string;
}> = [
  { key: "mcq", label: "Сонгох тест" },
  { key: "text", label: "Холбох тест" },
  { key: "open", label: "Задгай тест" },
];

export default function CreateExamPdfTabPanelValidated({
  examTitle,
  onExamTitleChange,
  counts,
  onCountChange,
  selectedFileName,
  onPickFile,
  errors,
  importError,
  generatedCount = 0,
  generatedPreview = [],
  onContinue,
  onOpenEditor,
  pending,
}: Props) {
  const total = counts.mcq + counts.text + counts.open;

  return (
    <>
      <section className="mt-4 rounded-[22px] border border-[#d9dde6] bg-white px-5 py-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-[360px]">
            <h3 className="text-[16px] font-semibold text-[#111827]">
              Файлаас асуулт үүсгэх
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-[#6b7280]">
              Эх сурвалж болон асуултын төрлөө оруулан материалаа автоматаар
              бэлдүүлээрэй.
            </p>
          </div>

          <div className="grid gap-4 sm:min-w-[470px] sm:grid-cols-3">
            {countCards.map((item) => (
              <div
                key={item.key}
                className="rounded-[16px] border border-[#d9dde6] bg-white px-5 py-4 text-center">
                <div className="text-[14px] font-medium text-[#111827]">
                  {item.label}
                </div>
                <div className="mt-4 flex justify-center">
                  <input
                    type="number"
                    min={0}
                    value={counts[item.key]}
                    onChange={(event) =>
                      onCountChange(
                        item.key,
                        Math.max(0, Number(event.target.value) || 0),
                      )
                    }
                    className="h-8 w-[70px] rounded-2xl border border-[#d9dde6] bg-[#f8fbff] px-3 text-center text-[14px] text-[#111827] outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end text-[14px] text-[#111827]">
          Нийт асуулт: {total}
        </div>

        <div className="mt-6">
          <div className="text-[14px] font-medium text-[#111827]">
            Файл хавсрах
          </div>

          <div className="mt-3 rounded-[18px] border border-dashed border-[#d9dde6] px-6 py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <CloudUpload
                className="size-7 text-[#111827]"
                strokeWidth={1.8}
              />
              <div className="mt-5 text-[14px] font-medium text-[#111827]">
                Файл хавсрах(Заавал)
              </div>
              <div className="mt-1 text-[12px] text-[#6b7280]">
                PDF, PNG, DOCX, up to 50MB
              </div>
              {selectedFileName && (
                <div className="mt-3 text-[12px] font-medium text-[#2563eb]">
                  {selectedFileName}
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4 h-8 rounded-xl border-[#d9dde6] px-5 text-[13px] text-[#374151]"
                onClick={onPickFile}
                disabled={pending}
                type="button">
                Оруулах
              </Button>
            </div>
          </div>
          {errors.file && (
            <p className="mt-3 text-[12px] font-medium text-red-600">
              {errors.file}
            </p>
          )}
        </div>

        {errors.counts && (
          <p className="mt-3 text-[12px] font-medium text-red-600">
            {errors.counts}
          </p>
        )}

        {importError && (
          <p className="mt-3 text-[12px] font-medium text-red-600">
            {importError}
          </p>
        )}

        {generatedCount > 0 && (
          <div className="mt-5 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-4">
            <div className="text-[14px] font-semibold text-emerald-700">
              {generatedCount} асуулт бэлэн боллоо.
            </div>
            {generatedPreview.length > 0 && (
              <div className="mt-3 space-y-2">
                {generatedPreview.map((question, index) => (
                  <div
                    key={`${question}-${index}`}
                    className="rounded-2xl border border-emerald-100 bg-white px-3 py-2 text-[13px] text-slate-700">
                    {index + 1}. {question}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <DialogFooter className="mt-4 border-t-0 bg-transparent px-8 pb-8 pt-0 sm:justify-end">
        {generatedCount > 0 && onOpenEditor ? (
          <Button
            variant="outline"
            className="h-10 rounded-2xl border-[#d9dde6] px-6 text-[14px] font-medium text-[#374151]"
            onClick={onOpenEditor}
            disabled={pending}
            type="button">
            Редакторт нээх
          </Button>
        ) : null}
        <Button
          className="h-10 rounded-2xl bg-[#2563eb] px-6 text-[14px] font-medium text-white hover:bg-[#1d4ed8]"
          onClick={onContinue}
          disabled={pending}
          type="button">
          <span className="inline-flex items-center gap-2">
            {pending && <Spinner className="size-4" />}
            {pending
              ? "Үүсгэж байна..."
              : generatedCount > 0
                ? "Дахин үүсгэх"
                : "Асуулт үүсгэх"}
          </span>
        </Button>
      </DialogFooter>
    </>
  );
}
