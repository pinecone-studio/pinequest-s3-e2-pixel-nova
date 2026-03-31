import { buttonGhost, buttonPrimary, inputClass, labelClass } from "../styles";
import type { AiExamGeneratorInput, AiGeneratedDraft } from "../types";
import TeacherSelect from "./TeacherSelect";

type AiExamGeneratorPanelProps = {
  input: AiExamGeneratorInput;
  onChange: <K extends keyof AiExamGeneratorInput>(
    key: K,
    value: AiExamGeneratorInput[K],
  ) => void;
  draft: AiGeneratedDraft | null;
  generating: boolean;
  savingAccepted: boolean;
  error: string | null;
  onGenerate: () => void;
  onUseDraft: () => void;
};

export default function AiExamGeneratorPanel({
  input,
  onChange,
  draft,
  generating,
  savingAccepted,
  error,
  onGenerate,
  onUseDraft,
}: AiExamGeneratorPanelProps) {
  return (
    <section className="mb-6 rounded-[34px] border border-[#dbe5f0] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.22)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
            AI Exam Generator
          </div>
          <h2 className="mt-3 text-[32px] font-semibold tracking-[-0.04em] text-slate-900">
            AI-аар шалгалтын ноорог үүсгэх
          </h2>
          <p className="mt-2 text-[15px] leading-7 text-slate-500">
            Сэдэв, анги, төвшин, асуултын тоогоо өгөөд багш засварлахад бэлэн
            шалгалтын ноорог гаргана.
          </p>
        </div>
        <button
          type="button"
          className={`${buttonPrimary} min-w-[190px] ${generating ? "opacity-80" : ""}`}
          disabled={generating}
          onClick={onGenerate}
        >
          {generating ? "Үүсгэж байна..." : "AI ноорог үүсгэх"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2">
          <span className={labelClass}>Сэдэв эсвэл гарчиг</span>
          <input
            className={inputClass}
            value={input.topic}
            onChange={(event) => onChange("topic", event.target.value)}
            placeholder="Жишээ нь: Grade 10 Biology Midterm"
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Хичээл</span>
          <input
            className={inputClass}
            value={input.subject ?? ""}
            onChange={(event) => onChange("subject", event.target.value)}
            placeholder="Biology"
          />
        </label>
        <label className="grid gap-2">
          <span className={labelClass}>Анги эсвэл бүлэг</span>
          <input
            className={inputClass}
            value={input.gradeOrClass ?? ""}
            onChange={(event) => onChange("gradeOrClass", event.target.value)}
            placeholder="10A"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className={labelClass}>Төвшин</span>
            <TeacherSelect
              value={input.difficulty}
              onChange={(event) =>
                onChange(
                  "difficulty",
                  event.target.value as AiExamGeneratorInput["difficulty"],
                )
              }
              options={[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
              ]}
            />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>Асуултын тоо</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={30}
              value={input.questionCount}
              onChange={(event) =>
                onChange("questionCount", Number(event.target.value || 1))
              }
            />
          </label>
        </div>
        <label className="grid gap-2 lg:col-span-2">
          <span className={labelClass}>Нэмэлт заавар</span>
          <textarea
            className={`${inputClass} min-h-[110px] resize-y`}
            value={input.instructions ?? ""}
            onChange={(event) => onChange("instructions", event.target.value)}
            placeholder="Жишээ нь: 70% multiple choice, 30% short answer. Include one diagram-style question."
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {draft && (
        <div className="mt-6 rounded-[28px] border border-[#dce5ef] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Generated Draft
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                {draft.title}
              </h3>
              {draft.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {draft.description}
                </p>
              )}
            </div>
            <button
              type="button"
              className={`${buttonGhost} min-w-[180px] ${savingAccepted ? "opacity-80" : ""}`}
              disabled={savingAccepted}
              onClick={onUseDraft}
            >
              {savingAccepted ? "Хадгалж байна..." : "Use Draft"}
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {draft.questions.map((question, index) => (
              <article
                key={question.id}
                className="rounded-[22px] border border-[#e7edf5] bg-[#fbfdff] px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Question {index + 1}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {question.text}
                    </div>
                  </div>
                  <div className="rounded-full border border-[#dce5ef] bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {question.type}
                  </div>
                </div>
                {question.options?.length ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option) => (
                      <div
                        key={`${question.id}-${option}`}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          option === question.correctAnswer
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-[#e7edf5] bg-white text-slate-600"
                        }`}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-[#e7edf5] bg-white px-3 py-2 text-sm text-slate-600">
                    Correct answer:{" "}
                    <span className="font-semibold text-slate-800">
                      {question.correctAnswer || "N/A"}
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
