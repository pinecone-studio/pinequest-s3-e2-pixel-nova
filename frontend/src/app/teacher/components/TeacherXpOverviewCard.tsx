import { badgeClass, cardClass, sectionDescriptionClass, sectionTitleClass } from "../styles";
import { formatDateTime } from "../utils";
import type { XpLeaderboardEntry } from "../types";

type TeacherXpOverviewCardProps = {
  students: XpLeaderboardEntry[];
};

export default function TeacherXpOverviewCard({
  students,
}: TeacherXpOverviewCardProps) {
  const topStudents = students.slice(0, 5);
  const totalXp = students.reduce((sum, student) => sum + student.xp, 0);
  const averageLevel =
    students.length > 0
      ? (students.reduce((sum, student) => sum + student.level, 0) / students.length).toFixed(1)
      : "0.0";

  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className={badgeClass}>Student Progress</span>
          <h2 className={`mt-3 ${sectionTitleClass}`}>XP ба ахиц</h2>
          <p className={`mt-2 ${sectionDescriptionClass}`}>
            Сурагчдын идэвх, түвшин, хамгийн сүүлд хийсэн шалгалтын явцыг харуулна.
          </p>
        </div>
        <div className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[11px] font-semibold text-[#1d4ed8]">
          {students.length} сурагч идэвхтэй
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#1d4ed8]">
            Total XP
          </div>
          <div className="mt-2 text-2xl font-semibold">{totalXp}</div>
        </div>
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
            Average Level
          </div>
          <div className="mt-2 text-2xl font-semibold">{averageLevel}</div>
        </div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">
            Top Progress
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {topStudents[0] ? `Lv.${topStudents[0].level}` : "Lv.0"}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {topStudents.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-6 text-sm text-slate-500">
            XP өгөгдөл хараахан алга. Сурагчид шалгалт өгч эхэлмэгц progression энд гарч ирнэ.
          </div>
        )}

        {topStudents.map((student, index) => (
          <div
            key={student.studentId}
            className="rounded-[24px] border border-[#dce5ef] bg-[#fbfdff] px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-primary/15 bg-background text-sm font-semibold shadow-sm">
                  <span>{student.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{student.name}</span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Level {student.level} · {student.levelName} · {student.examsTaken} шалгалт
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">{student.xp} XP</div>
                <div className="text-[11px] text-muted-foreground">
                  {student.nextLevelXp === 0
                    ? "Дээд түвшинд хүрсэн"
                    : `${student.nextLevelXp} XP дараагийн level`}
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-linear-to-r from-primary via-sky-500 to-emerald-400"
                style={{ width: `${student.progressPercent}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Прогресс: {student.progressPercent}%</span>
              <span>
                Сүүлд идэвхтэй:{" "}
                {student.lastActivity ? formatDateTime(student.lastActivity) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
