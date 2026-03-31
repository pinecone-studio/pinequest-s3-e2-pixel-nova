import { Grip, ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import {
  buttonGhost,
  buttonPrimary,
  inputClass,
  labelClass,
  selectClass,
} from "../../styles";
import QuestionTypeDropdown from "./QuestionTypeDropdown";

type QuestionFormSectionProps = {
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
  addQuestion: () => void;
  saveExam: () => void;
  saving: boolean;
  hasUser: boolean;
};
const optionLabels = ["A", "B", "C", "D"];

export default function QuestionFormSection({
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
  addQuestion,
  saveExam,
  saving,
  hasUser,
}: QuestionFormSectionProps) {
  const [correctOpen, setCorrectOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setQuestionImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="rounded-[30px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-6 py-5 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.16)]">
      <div className="mb-3 flex justify-center text-slate-300">
        <Grip className="h-4 w-4" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#edf4ff] text-sm font-semibold text-[#2563eb] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.08)]">
            1
          </span>
          <div>
            <div className="text-[22px] font-semibold tracking-[-0.03em] text-slate-900">
              Асуултаа оруулна уу.
            </div>
            <div className="mt-1 text-sm text-slate-500">
              PDF-ээс уншсан асуултыг эндээс нэмж засварлаж болно.
            </div>
          </div>
        </div>

        <div className="w-full max-w-[260px]">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Асуултын төрөл
          </span>
          <QuestionTypeDropdown
            value={questionType}
            onChange={setQuestionType}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Асуултын агуулга
          </span>
          <textarea
            className="min-h-[140px] w-full resize-y rounded-[24px] border border-[#dde6f0] bg-white px-5 py-4 text-[17px] leading-7 text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]"
            placeholder="Асуултаа оруулна уу"
            value={questionText ?? ""}
            onChange={(event) => setQuestionText(event.target.value)}
          />
        </label>

        <div className="grid gap-4 lg:grid-cols-[1fr_120px]">
          {questionType === "mcq" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {optionLabels.map((label, index) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-[20px] border border-[#e9eef5] bg-[#fbfcff] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-xs font-semibold text-slate-500 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.16)]">
                    {label}
                  </span>
                  <input
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
                    placeholder={`${label} сонголт`}
                    value={mcqOptions[index] ?? ""}
                    onChange={(event) => {
                      const next = [...mcqOptions];
                      next[index] = event.target.value;
                      setMcqOptions(next);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <label className="grid gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Зөв хариулт
              </span>
              <input
                className="h-14 w-full rounded-[20px] border border-[#dfe8f2] bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]"
                placeholder="Зөв хариултаа бичнэ үү"
                value={questionAnswer ?? ""}
                onChange={(event) => setQuestionAnswer(event.target.value)}
              />
            </label>
          )}

          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className={labelClass}>Оноо</span>
              <input
                type="number"
                min={1}
                className={`${inputClass} h-12 rounded-[18px] border-[#e2e8f0] bg-white shadow-none`}
                value={Number.isFinite(questionPoints) ? questionPoints : 1}
                onChange={(event) =>
                  setQuestionPoints(Number(event.target.value || 1))
                }
                placeholder="Оноо"
              />
            </label>

            {questionType === "mcq" && (
              <label className="grid gap-2">
                <span className={labelClass}>Зөв хариулт</span>
                <div
                  className="relative"
                  tabIndex={0}
                  onBlur={(event) => {
                    if (
                      event.currentTarget.contains(event.relatedTarget as Node)
                    ) {
                      return;
                    }
                    setCorrectOpen(false);
                  }}
                >
                  <button
                    className={`${selectClass} flex h-12 w-full items-center justify-between rounded-[18px] border-[#e2e8f0] bg-white shadow-none`}
                    onClick={() => setCorrectOpen((prev) => !prev)}
                    type="button"
                  >
                    <span className="truncate">
                      {mcqOptions[questionCorrectIndex]
                        ? `${optionLabels[questionCorrectIndex]}. ${mcqOptions[questionCorrectIndex]}`
                        : "Заавал хариулах"}
                    </span>
                    <svg
                      className={`h-4 w-4 transition-transform ${
                        correctOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#e7edf5] bg-white p-2 shadow-xl transition ${
                      correctOpen
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-1 opacity-0"
                    }`}
                  >
                    {optionLabels.map((label, index) => (
                      <button
                        key={label}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                          questionCorrectIndex === index
                            ? "bg-[#2563eb] text-white"
                            : "hover:bg-[#f8fbff]"
                        }`}
                        title={`${label}. ${mcqOptions[index]}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setQuestionCorrectIndex(index);
                          setCorrectOpen(false);
                        }}
                        type="button"
                      >
                        <span className="block truncate">
                          {label}. {mcqOptions[index]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#edf2f8] bg-[#f8fbff] px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ea] bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-[#bfd3ff] hover:text-[#2563eb]"
              onClick={() => imageInputRef.current?.click()}
              type="button"
            >
              <ImagePlus className="h-4 w-4" />
              Зураг нэмэх
            </button>
            {questionImageUrl && (
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                onClick={() => setQuestionImageUrl(undefined)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-[#dce5ef] bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
              <span>Заавал хариулах</span>
              <button
                type="button"
                className="relative h-7 w-12 rounded-full bg-[#4a6cf0]"
                aria-label="Заавал хариулах"
              >
                <span className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
            <button className={buttonGhost} onClick={addQuestion} type="button">
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
                  : "Хадгалах"}
            </button>
          </div>
        </div>

        {questionImageUrl && (
          <div className="overflow-hidden rounded-[18px] border border-[#e7edf5] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={questionImageUrl}
              alt="Шинэ асуултын зураг"
              className="w-full rounded-xl object-contain"
              style={{ maxHeight: 260 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
