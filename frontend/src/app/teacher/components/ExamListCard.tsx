import {
  badgeClass,
  buttonSecondary,
  cardClass,
  insetCardClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "../styles";
import { formatDateTime } from "../utils";
import type { Exam } from "../types";

type ExamListCardProps = {
  exams: Exam[];
  onCopyCode: (code: string) => void;
};

export default function ExamListCard({ exams, onCopyCode }: ExamListCardProps) {
  const sortedExams = [...exams].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
  const savedExams = exams.filter((exam) => exam.questions.length > 0).length;
  const scheduledExams = exams.filter((exam) => Boolean(exam.scheduledAt)).length;

  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={badgeClass}>Exam Library</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>Хадгалсан шалгалтууд</h2>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Draft, хуваарь, room code бүгдийг нэг цэвэр жагсаалтаар харуулна.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 font-semibold text-[#1d4ed8]">
            Сан: {savedExams}
          </span>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-semibold text-emerald-600 dark:text-emerald-300">
            Товлолт: {scheduledExams}
          </span>
        </div>
      </div>
      <div className="mt-6 space-y-3 text-sm">
        {sortedExams.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-8 text-center text-sm text-slate-500">
            Одоогоор шалгалт байхгүй байна.
          </div>
        )}
        {sortedExams.map((exam) => {
          const isSaved = exam.questions.length > 0;
          const statusLabel = exam.scheduledAt
            ? "Товлосон"
            : isSaved
              ? "Санд хадгалсан"
              : "Ноорог";
          const statusClass = exam.scheduledAt
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
            : isSaved
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-300";

          return (
            <div
              key={exam.id}
              className="rounded-[26px] border border-[#dce5ef] bg-[#fbfdff] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-slate-900">{exam.title}</div>
                    <span
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Код: {exam.roomCode} · {exam.questions.length} асуулт · {exam.duration ?? 45} мин
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Үүсгэсэн: {formatDateTime(exam.createdAt)} · Товлосон:{" "}
                    {formatDateTime(exam.scheduledAt)}
                  </div>
                </div>
                <button
                  className={buttonSecondary}
                  onClick={() => onCopyCode(exam.roomCode)}
                  type="button"
                >
                  Room code хуулах
                </button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className={`${insetCardClass} text-xs`}>
                  <div className="text-slate-500">Хадгалалтын төлөв</div>
                  <div className="mt-1 font-semibold">
                    {isSaved ? "Асуулттай" : "Зөвхөн room"}
                  </div>
                </div>
                <div className={`${insetCardClass} text-xs`}>
                  <div className="text-slate-500">Ашиглах үе</div>
                  <div className="mt-1 font-semibold">
                    {exam.scheduledAt ? "Хуваарьтай" : "Дахин ашиглахад бэлэн"}
                  </div>
                </div>
                <div className={`${insetCardClass} text-xs`}>
                  <div className="text-slate-500">Шалгалтын түлхүүр</div>
                  <div className="mt-1 font-semibold">{exam.roomCode}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
