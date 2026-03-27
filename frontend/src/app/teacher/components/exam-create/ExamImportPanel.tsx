import { FileImage, FileText, FileType2 } from "lucide-react";

type ExamImportPanelProps = {
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

export default function ExamImportPanel({
  pdfError,
  importError,
  importLoading,
  importLoadingLabel,
  onPdfUpload,
  onImageUpload,
  onDocxUpload,
}: ExamImportPanelProps) {
  const disabledClass = importLoading ? "pointer-events-none opacity-60" : "";

  return (
    <div className="w-full rounded-[28px] border border-dashed border-[#dfe7f1] bg-white px-4 py-3 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.12)] lg:max-w-[470px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="px-2 text-[13px] font-semibold text-slate-700">
          Файл оруулах
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-[18px] border border-[#dce5ef] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-[#bfd3ff] hover:text-[#2563eb] ${disabledClass}`}
          >
            <FileText className="h-3.5 w-3.5" />
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
          <label
            className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-[18px] border border-[#dce5ef] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-[#bfd3ff] hover:text-[#2563eb] ${disabledClass}`}
          >
            <FileImage className="h-3.5 w-3.5" />
            Image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImageUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label
            className={`flex h-11 cursor-pointer items-center gap-1.5 rounded-[18px] border border-[#dce5ef] bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-[#bfd3ff] hover:text-[#2563eb] ${disabledClass}`}
          >
            <FileType2 className="h-3.5 w-3.5" />
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

      {importLoading && (
        <div className="mt-3 px-3 text-xs text-slate-500">
          {importLoadingLabel ?? "Файл боловсруулж байна..."}
        </div>
      )}
      {pdfError && <div className="mt-2 px-3 text-xs text-red-500">{pdfError}</div>}
      {importError && (
        <div className="mt-2 px-3 text-xs text-red-500">{importError}</div>
      )}
    </div>
  );
}
