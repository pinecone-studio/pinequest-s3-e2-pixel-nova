import { ImagePlus, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import QuestionTypeDropdown from "./QuestionTypeDropdown";
import { Button } from "@/components/ui/button";

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
  questionError?: string;
};

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
  questionError,
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
                  value={questionText ?? ""}
                  onChange={(event) => setQuestionText(event.target.value)}
                  placeholder="Асуултаа оруулна уу."
                  className="w-full border-0 border-b border-b-[#dfe6ef] bg-transparent px-0 pb-1 text-[17px] font-medium text-[#111827] outline-none placeholder:text-[#111827] placeholder:opacity-100 focus:border-b-[#c9d3e0] focus:ring-0"
                />
              </div>
            </div>
          </div>

          <QuestionTypeDropdown
            value={questionType}
            onChange={(value) => setQuestionType(value)}
            className="w-[168px]"
          />
        </div>

        <div className="mt-8 px-4">
          {questionType === "mcq" ? (
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
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
              <div>
                <label className="mb-2 block text-[12px] font-medium text-[#6b7280]">
                  Хариулт
                </label>
                <input
                  className="h-10 w-full rounded-none border-x-0 border-t-0 border-b border-b-[#d7dde6] bg-transparent px-0 text-[14px] text-[#111827] shadow-none outline-none placeholder:text-[#b8c0cc]"
                  placeholder="Хариулт оруулна уу"
                  value={questionAnswer}
                  onChange={(event) => setQuestionAnswer(event.target.value)}
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
                  value={questionPoints}
                  onChange={(event) =>
                    setQuestionPoints(
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
          className={`mt-4 flex flex-wrap items-center gap-4 px-2 text-[#6b7280] ${questionType === "mcq" ? "justify-between" : "justify-end"}`}>
          {questionType === "mcq" && (
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
                value={questionPoints}
                onChange={(event) =>
                  setQuestionPoints(
                    Math.max(1, Number(event.target.value) || 1),
                  )
                }
                className="h-10 w-full rounded-2xl border border-[#d7dde6] bg-white px-3 text-[14px] text-[#111827] outline-none focus:border-[#2563eb]"
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              type="button"
              aria-label="Add image"
              className="transition hover:text-[#111827]"
              onClick={() => imageInputRef.current?.click()}>
              <ImagePlus className="size-4" />
            </button>
            <Button
              variant="outline"
              className="h-10 rounded-2xl border-[#d7e0ea] px-4 text-[14px] font-medium text-[#31558c]"
              type="button"
              onClick={addQuestion}>
              + Асуулт нэмэх
            </Button>
          </div>
        </div>

        {questionImageUrl && (
          <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e7edf5] bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={questionImageUrl}
              alt="Шинэ асуултын зураг"
              className="w-full rounded-xl object-contain"
              style={{ maxHeight: 260 }}
            />
            <button
              className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() => setQuestionImageUrl(undefined)}
              type="button">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {questionError && (
          <p className="mt-2 text-[12px] font-medium text-red-600">
            {questionError}
          </p>
        )}
      </div>
    </section>
    // <div className=" bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
    //   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    //     <div className="min-w-0 flex-1">
    //       <span className="mt-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f1ff] text-[12px] font-semibold text-[#2563eb]">
    //         1
    //       </span>
    //       <div className="min-w-0 flex-1">
    //         <input
    //           value={questionText ?? ""}
    //           onChange={(event) => setQuestionText(event.target.value)}
    //           placeholder="Асуултаа оруулна уу."
    //           className="w-full border-0 border-b border-b-[#dfe6ef] bg-transparent px-0 pb-1 text-[17px] font-medium text-[#111827] outline-none placeholder:text-[#111827] placeholder:opacity-100 focus:border-b-[#c9d3e0] focus:ring-0"
    //         />
    //       </div>
    //     </div>

    //     <div className="w-full max-w-[220px]">
    //       <QuestionTypeDropdown
    //         value={questionType}
    //         onChange={setQuestionType}
    //       />
    //     </div>
    //   </div>

    //   <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
    //     {questionType === "mcq" ? (
    //       <div className="grid gap-3 md:grid-cols-2">
    //         {optionLabels.map((label, index) => (
    //           <div
    //             key={label}
    //             className="flex items-center gap-3 rounded-[20px] border border-[#e9eef5] bg-[#fbfcff] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
    //             <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-xs font-semibold text-slate-500 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.16)]">
    //               {label}
    //             </span>
    //             <input
    //               className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300"
    //               placeholder={`${label} сонголт`}
    //               value={mcqOptions[index] ?? ""}
    //               onChange={(event) => {
    //                 const next = [...mcqOptions];
    //                 next[index] = event.target.value;
    //                 setMcqOptions(next);
    //               }}
    //             />
    //           </div>
    //         ))}
    //       </div>
    //     ) : (
    //       <label className="grid gap-2">
    //         <span className={labelClass}>Хариулт</span>
    //         <input
    //           className="h-14 w-full rounded-[20px] border border-[#dfe8f2] bg-white px-4 text-[15px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#2563eb] focus:shadow-[0_0_0_4px_rgba(37,99,235,0.08)]"
    //           placeholder="Хариулт"
    //           value={questionAnswer ?? ""}
    //           onChange={(event) => setQuestionAnswer(event.target.value)}
    //         />
    //       </label>
    //     )}

    //     <label className="grid gap-2">
    //       <span className={labelClass}>Оноо</span>
    //       <input
    //         type="number"
    //         min={1}
    //         className={`${inputClass} h-14 rounded-[20px] border-[#dfe8f2] bg-white text-center text-base font-semibold shadow-none`}
    //         value={Number.isFinite(questionPoints) ? questionPoints : 1}
    //         onChange={(event) =>
    //           setQuestionPoints(Math.max(1, Number(event.target.value) || 1))
    //         }
    //         placeholder="1"
    //       />
    //     </label>
    //   </div>

    //   {questionType === "mcq" && (
    //     <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px]">
    //       <label className="grid gap-2">
    //         <span className={labelClass}>Зөв хариулт</span>
    //         <div
    //           className="relative"
    //           tabIndex={0}
    //           onBlur={(event) => {
    //             if (event.currentTarget.contains(event.relatedTarget as Node)) {
    //               return;
    //             }
    //             setCorrectOpen(false);
    //           }}>
    //           <button
    //             className="flex h-14 w-full items-center justify-between rounded-[20px] border border-[#dfe8f2] bg-white px-4 text-left text-[15px] text-slate-700 shadow-none outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
    //             onClick={() => setCorrectOpen((prev) => !prev)}
    //             type="button">
    //             <span className="truncate">
    //               {mcqOptions[questionCorrectIndex]
    //                 ? `${optionLabels[questionCorrectIndex]}. ${mcqOptions[questionCorrectIndex]}`
    //                 : "Заавал хариула"}
    //             </span>
    //             <svg
    //               className={`h-4 w-4 transition-transform ${
    //                 correctOpen ? "rotate-180" : ""
    //               }`}
    //               viewBox="0 0 24 24"
    //               fill="none"
    //               stroke="currentColor"
    //               strokeWidth="2">
    //               <path d="M6 9l6 6 6-6" />
    //             </svg>
    //           </button>
    //           <div
    //             className={`absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-[#e7edf5] bg-white p-2 shadow-xl transition ${
    //               correctOpen
    //                 ? "translate-y-0 opacity-100"
    //                 : "pointer-events-none -translate-y-1 opacity-0"
    //             }`}>
    //             {optionLabels.map((label, index) => (
    //               <button
    //                 key={label}
    //                 className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
    //                   questionCorrectIndex === index
    //                     ? "bg-[#2563eb] text-white"
    //                     : "hover:bg-[#f8fbff]"
    //                 }`}
    //                 title={`${label}. ${mcqOptions[index]}`}
    //                 onMouseDown={(event) => event.preventDefault()}
    //                 onClick={() => {
    //                   setQuestionCorrectIndex(index);
    //                   setCorrectOpen(false);
    //                 }}
    //                 type="button">
    //                 <span className="block truncate">
    //                   {label}. {mcqOptions[index]}
    //                 </span>
    //               </button>
    //             ))}
    //           </div>
    //         </div>
    //       </label>
    //     </div>
    //   )}

    //   <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#edf2f8] bg-[#f8fbff] px-4 py-4">
    //     <div className="flex flex-wrap items-center gap-3">
    //       <input
    //         ref={imageInputRef}
    //         type="file"
    //         accept="image/*"
    //         className="hidden"
    //         onChange={handleImageSelect}
    //       />
    //       <button
    //         className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ea] bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:border-[#bfd3ff] hover:text-[#2563eb]"
    //         onClick={() => imageInputRef.current?.click()}
    //         type="button">
    //         <ImagePlus className="h-4 w-4" />
    //         Зураг нэмэх
    //       </button>
    //       {questionImageUrl && (
    //         <button
    //           className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
    //           onClick={() => setQuestionImageUrl(undefined)}
    //           type="button">
    //           <Trash2 className="h-4 w-4" />
    //         </button>
    //       )}
    //     </div>

    //     <div className="flex flex-wrap items-center gap-3">
    //       <div className="flex items-center gap-3 rounded-full border border-[#dce5ef] bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
    //         <span>Заавал хариулах</span>
    //         <button
    //           type="button"
    //           className="relative h-7 w-12 rounded-full bg-[#4a6cf0]"
    //           aria-label="Заавал хариулах">
    //           <span className="absolute right-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm" />
    //         </button>
    //       </div>
    //       <button className={buttonGhost} onClick={addQuestion} type="button">
    //         + Асуулт нэмэх
    //       </button>
    //       <button
    //         className="inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ea] bg-white px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-[#bfd3ff] hover:text-[#2563eb]"
    //         type="button"
    //         aria-label="Хуулбарлах"
    //         title="Хуулбарлах"
    //         onClick={() => {
    //           void navigator.clipboard?.writeText(questionText || "");
    //         }}>
    //         <Copy className="h-4 w-4" />
    //       </button>
    //     </div>
    //   </div>

    //   {questionImageUrl && (
    //     <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e7edf5] bg-white p-3">
    //       {/* eslint-disable-next-line @next/next/no-img-element */}
    //       <img
    //         src={questionImageUrl}
    //         alt="Шинэ асуултын зураг"
    //         className="w-full rounded-xl object-contain"
    //         style={{ maxHeight: 260 }}
    //       />
    //     </div>
    //   )}
    // </div>
  );
}
