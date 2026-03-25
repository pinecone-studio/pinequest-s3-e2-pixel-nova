import { cardClass } from "../styles";
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
          <h2 className="text-sm font-semibold">XP ба level-up</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Сурагчдын game vibe progression самбар
          </p>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
          {students.length} сурагч идэвхтэй
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-primary/80">
            Total XP
          </div>
          <div className="mt-2 text-2xl font-semibold">{totalXp}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
            Average Level
          </div>
          <div className="mt-2 text-2xl font-semibold">{averageLevel}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
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
          <div className="rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-6 text-sm text-muted-foreground">
            XP өгөгдөл хараахан алга. Сурагчид шалгалт өгч эхэлмэгц progression энд гарч ирнэ.
          </div>
        )}

        {topStudents.map((student, index) => (
          <div
            key={student.studentId}
            className="rounded-2xl border border-border bg-muted/60 px-4 py-3"
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
