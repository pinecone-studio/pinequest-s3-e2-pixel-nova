import { badgeClass, cardClass, sectionDescriptionClass } from "../styles";
import type { ExamStatsSummary } from "../types";

type QuestionInsightsPanelProps = {
  examStats: ExamStatsSummary | null;
};

const getRateTone = (rate: number) => {
  if (rate >= 70) {
    return {
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
      bar: "bg-emerald-500",
    };
  }
  if (rate >= 45) {
    return {
      pill: "border-amber-200 bg-amber-50 text-amber-700",
      bar: "bg-amber-500",
    };
  }
  return {
    pill: "border-rose-200 bg-rose-50 text-rose-700",
    bar: "bg-rose-500",
  };
};

export default function QuestionInsightsPanel({
  examStats,
}: QuestionInsightsPanelProps) {
  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={badgeClass}>Question Insights</span>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">
            Асуулт тус бүрийн үзүүлэлт
          </h3>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Зөв хариулсан хувь, алгассан тоо, мөн хамгийн түгээмэл буруу
            хариултыг нэг дороос харуулна.
          </p>
        </div>
        {examStats && (
          <div className="rounded-2xl border border-[#dce5ef] bg-[#f8fafc] px-4 py-3 text-sm text-slate-600">
            {examStats.questionStats.length} асуулттай дүн шинжилгээ
          </div>
        )}
      </div>

      {!examStats || examStats.questionStats.length === 0 ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-8 text-sm text-slate-500">
          Асуулт тус бүрийн дүн шинжилгээ хараахан бэлэн болоогүй байна.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {examStats.questionStats.map((question, index) => {
            const tone = getRateTone(question.correctRate);
            return (
              <article
                key={question.id}
                className="rounded-[24px] border border-[#dce5ef] bg-[#fbfdff] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Question {index + 1}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                      {question.text}
                    </div>
                  </div>
                  <div
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.pill}`}
                  >
                    {question.correctRate}% зөв
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eef6]">
                  <div
                    className={`h-full ${tone.bar}`}
                    style={{ width: `${question.correctRate}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-[#dce5ef] bg-white px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Correct
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {question.correctCount}/{question.total}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dce5ef] bg-white px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Skipped
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {question.skippedCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#dce5ef] bg-white px-3 py-3">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                      Top Wrong Answer
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {question.topWrongAnswer
                        ? `${question.topWrongAnswer} (${question.topWrongAnswerCount})`
                        : "No repeated wrong answer"}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
