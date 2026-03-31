import {
  badgeClass,
  cardClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "../styles";
import type { Exam, ExamStatsSummary } from "../types";
import TeacherSelect from "./TeacherSelect";

type ResultsSummaryCardProps = {
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: ExamStatsSummary | null;
};

export default function ResultsSummaryCard({
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
}: ResultsSummaryCardProps) {
  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className={badgeClass}>Results Overview</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Дүнгийн хураангуй</h2>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Дундаж оноо, pass rate, хамгийн их алдсан болон зөв гүйцэтгэсэн асуултууд.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <TeacherSelect
            value={activeExamId ?? ""}
            onChange={(event) => onSelectExam(event.target.value)}
            options={
              examOptions.length === 0
                ? [{ value: "", label: "Шалгалт байхгүй", disabled: true }]
                : examOptions.map((exam) => ({ value: exam.id, label: exam.title }))
            }
          />
        </div>
      </div>

      {!examStats && (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-8 text-sm text-slate-500">
          Дүнтэй шалгалт сонгогдоогүй байна.
        </div>
      )}

      {examStats && (
        <>
          <div className="mt-6 grid gap-4 xl:grid-cols-[280px_1fr]">
            <div className="rounded-[28px] border border-[#bfdbfe] bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-5">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[#1d4ed8]">
                Class Average
              </div>
              <div className="mt-4 flex items-center justify-center">
                <div
                  className="grid h-40 w-40 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(var(--primary) ${examStats.average * 3.6}deg, #dbeafe 0deg)`,
                  }}
                >
                  <div className="grid h-28 w-28 place-items-center rounded-full border border-[#dce5ef] bg-white shadow-sm">
                    <div className="text-center">
                      <div className="text-3xl font-semibold">{examStats.average}%</div>
                      <div className="text-[11px] text-slate-500">анги дундаж</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-[#1d4ed8]">
                  Pass Rate
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.passRate}%</div>
                <div className="mt-1 text-xs text-slate-500">
                  60%-иас дээш өгсөн сурагчид
                </div>
              </div>
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                  Submissions
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.submissionCount}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Автоматаар үнэлэгдсэн оролт
                </div>
              </div>
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
                  Question Load
                </div>
                <div className="mt-2 text-3xl font-semibold">{examStats.totalPoints}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Нэг сурагчид ногдох асуулт
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
                Most Missed
              </div>
              <div className="mt-2 text-sm font-semibold">
                {examStats.mostMissed[0]?.text ?? "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {examStats.mostMissed[0]
                  ? `${examStats.mostMissed[0].missCount} сурагч алдсан`
                  : "Алдагдсан асуулт алга"}
              </div>
            </div>
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                Most Correct
              </div>
              <div className="mt-2 text-sm font-semibold">
                {examStats.mostCorrect[0]?.text ?? "—"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {examStats.mostCorrect[0]
                  ? `${examStats.mostCorrect[0].correctCount} сурагч зөв хийсэн`
                  : "Зөв хариултын өгөгдөл алга"}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
