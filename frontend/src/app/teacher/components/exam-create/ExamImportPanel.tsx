import { FileImage, FileText, FileType2 } from "lucide-react";

type ExamImportPanelProps = {
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

export default function ExamImportPanel({
  pdfError,
  importError,
  importLoading,
  importLoadingLabel,
  importMcqCount,
  setImportMcqCount,
  importOpenCount,
  setImportOpenCount,
  shuffleImportedQuestions,
  setShuffleImportedQuestions,
  plannedQuestionCount,
  onPdfUpload,
  onImageUpload,
  onDocxUpload,
}: ExamImportPanelProps) {
  const disabledClass = importLoading ? "pointer-events-none opacity-60" : "";
  const typeControls = [
    {
      label: "Сонгох",
      hint: "MCQ",
      value: importMcqCount,
      setValue: setImportMcqCount,
      tone: "from-[#eff6ff] to-[#dbeafe] text-[#1d4ed8]",
    },
    {
      label: "Задгай",
      hint: "Open",
      value: importOpenCount,
      setValue: setImportOpenCount,
      tone: "from-[#ecfeff] to-[#cffafe] text-[#0f766e]",
    },
  ] as const;

  return (
    <div className="w-full rounded-[32px] border border-[#e3ebf5] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] lg:max-w-[520px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            Import Studio
          </p>
          <h3 className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
            Файлаас асуулт үүсгэх
          </h3>
          <p className="mt-2 max-w-[340px] text-[13px] leading-6 text-slate-500">
            Эх сурвалжаа оруулаад, ямар төрлийн хэдэн асуулт авахаа урьдчилж
            тохируулна.
          </p>
        </div>
        <div className="rounded-2xl border border-[#dbe6f5] bg-white px-3 py-2 text-right shadow-sm">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
            Нийт
          </p>
          <p className="mt-1 text-2xl font-semibold leading-none text-slate-900">
            {plannedQuestionCount}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <span className="sm:col-span-3 text-[12px] font-semibold text-slate-600">
          Эх сурвалж сонгох
        </span>
        <div className="grid gap-3 sm:col-span-3 sm:grid-cols-3">
          <label
            className={`group flex min-h-[76px] cursor-pointer flex-col justify-between rounded-[24px] border border-[#dce5ef] bg-white px-4 py-3 text-slate-600 transition hover:-translate-y-0.5 hover:border-[#bfd3ff] hover:shadow-[0_16px_32px_-24px_rgba(37,99,235,0.45)] ${disabledClass}`}
          >
            <FileText className="h-4 w-4 text-[#2563eb]" />
            <span className="text-sm font-semibold text-slate-800">PDF</span>

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
            className={`group flex min-h-[76px] cursor-pointer flex-col justify-between rounded-[24px] border border-[#dce5ef] bg-white px-4 py-3 text-slate-600 transition hover:-translate-y-0.5 hover:border-[#bfd3ff] hover:shadow-[0_16px_32px_-24px_rgba(37,99,235,0.45)] ${disabledClass}`}
          >
            <FileImage className="h-4 w-4 text-[#2563eb]" />
            <span className="text-sm font-semibold text-slate-800">Image</span>

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
            className={`group flex min-h-[76px] cursor-pointer flex-col justify-between rounded-[24px] border border-[#dce5ef] bg-white px-4 py-3 text-slate-600 transition hover:-translate-y-0.5 hover:border-[#bfd3ff] hover:shadow-[0_16px_32px_-24px_rgba(37,99,235,0.45)] ${disabledClass}`}
          >
            <FileType2 className="h-4 w-4 text-[#2563eb]" />
            <span className="text-sm font-semibold text-slate-800">DOCX</span>

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

      <div className="mt-5 rounded-[28px] border border-[#e6edf7] bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-slate-800">
              Асуултын бүтэц
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              Импортын дараа ямар төрлийн асуулт хэдэн ширхэг авахаа энд
              тохируулна.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {typeControls.map((control) => (
            <label
              key={control.label}
              className={`rounded-[24px] border border-[#e3ebf7] bg-gradient-to-br ${control.tone} p-[1px]`}
            >
              <div className="rounded-[23px] bg-white px-4 py-3">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      {control.hint}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {control.label}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <input
                      type="number"
                      min={0}
                      value={control.value}
                      onChange={(event) =>
                        control.setValue(
                          Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                      className="h-12 w-full max-w-[120px] rounded-2xl border border-[#dce5ef] bg-[#f8fbff] px-3 text-center text-lg font-semibold text-slate-800 outline-none transition focus:border-[#2563eb] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-[22px] border border-[#e8eef8] bg-[#f8fbff] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-[13px] font-medium text-slate-600">
            <input
              type="checkbox"
              checked={shuffleImportedQuestions}
              onChange={(event) =>
                setShuffleImportedQuestions(event.target.checked)
              }
              className="h-4 w-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
            />
            Асуултын дарааллыг shuffle хийж холих
          </label>
        </div>
      </div>

      {importLoading && (
        <div className="mt-4 rounded-2xl border border-[#dbe8ff] bg-[#eff6ff] px-4 py-3 text-xs font-medium text-[#1d4ed8]">
          {importLoadingLabel ?? "Файл боловсруулж байна..."}
        </div>
      )}

      <div className="mt-3 rounded-2xl border border-[#e6edf7] bg-white px-4 py-3 text-xs leading-5 text-slate-500">
        Уламжлалт монгол бичиг page дээр босоо хэлбэрээр харагдана. Харин PDF
        OCR нь ийм бичгийг бүрэн найдвартай танихгүй байж болно.
      </div>

      {pdfError && (
        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
          {pdfError}
        </div>
      )}
      {importError && (
        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
          {importError}
        </div>
      )}
    </div>
  );
}
