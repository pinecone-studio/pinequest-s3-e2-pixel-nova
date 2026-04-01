import {
  AwardIcon,
  CrownIcon,
  MedalIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import {
  badgeClass,
  cardClass,
  sectionDescriptionClass,
  sectionTitleClass,
} from "../styles";
import type { XpLeaderboardEntry } from "../types";

type TeacherXpOverviewCardProps = {
  students: XpLeaderboardEntry[];
};

const LEADERBOARD_LIMIT = 6;

const getLevelIcon = (level: number) => {
  if (level >= 10) return CrownIcon;
  if (level >= 7) return TrophyIcon;
  if (level >= 5) return MedalIcon;
  if (level >= 3) return AwardIcon;
  if (level >= 2) return StarIcon;
  return SparklesIcon;
};

const getRankAccent = (index: number) => {
  if (index === 0) return "border-[#cfdcff] bg-[#eef4ff] text-[#3f63dd]";
  if (index === 1) return "border-[#d6ddea] bg-[#f7f9fc] text-[#5b718b]";
  if (index === 2) return "border-[#e7dfcf] bg-[#fbf8f2] text-[#8a7654]";
  return "border-[#e2e9f0] bg-[#f8fafc] text-slate-500";
};

export default function TeacherXpOverviewCard({
  students,
}: TeacherXpOverviewCardProps) {
  const topStudent = students[0] ?? null;
  const leaderboard = students.slice(0, LEADERBOARD_LIMIT);
  const totalXp = students.reduce((sum, s) => sum + s.xp, 0);
  const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;
  const totalExams = students.reduce((sum, s) => sum + s.examsTaken, 0);
  const dominantLevel =
    students.length > 0
      ? students.reduce<Record<number, number>>((acc, student) => {
          acc[student.level] = (acc[student.level] ?? 0) + 1;
          return acc;
        }, {})
      : {};
  const leadingLevel = Number(
    Object.entries(dominantLevel).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? 1,
  );
  const averageProgress =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => sum + student.progressPercent, 0) /
            students.length,
        )
      : 0;

  return (
    <div className={`${cardClass} overflow-hidden`}>
      <div>
        <span className={badgeClass}>Сурагчийн ахиц</span>
        <h2 className={`mt-3 ${sectionTitleClass}`}>XP эрэмбэ</h2>
        <p className={`mt-2 ${sectionDescriptionClass}`}>
          Хамгийн идэвхтэй сурагчид болон дундаж XP үзүүлэлтийг нэг дор харуулна.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {[
          { label: "Нийт XP", value: totalXp },
          { label: "Дундаж XP", value: avgXp },
          { label: "Сурагч", value: students.length },
        ].map((item) => (
          <div
            key={item.label}
            className="min-w-[170px] flex-1 rounded-[18px] border border-[#e2e9f0] bg-[#f8fafc] px-4 py-3"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {item.label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="mt-6 rounded-[22px] border border-dashed border-[#d7e0ea] bg-[#f8fafc] px-4 py-10 text-center text-sm text-slate-400">
          Сурагчид шалгалт өгч эхэлмэгц эрэмбэ энд гарч ирнэ.
        </div>
      ) : (
        <>
          {topStudent && (
            <div className="mt-6 rounded-[24px] border border-[#d9e4f0] bg-[linear-gradient(180deg,#f5f9fd_0%,#ffffff_100%)] px-5 py-5">
              <div className="flex items-start gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#d9e4f0] bg-white text-[#4f7cff]">
                  {(() => {
                    const LevelIcon = getLevelIcon(topStudent.level);
                    return <LevelIcon className="size-7" strokeWidth={2.1} />;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Тэргүүлж буй сурагч
                  </div>
                  <div className="mt-2 truncate text-lg font-semibold text-slate-900">
                    {topStudent.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {topStudent.xp} XP · Түвшин {topStudent.level}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eef6]">
                    <div
                      className="h-full rounded-full bg-[#4f7cff]"
                      style={{ width: `${topStudent.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <ZapIcon className="size-3.5" />
                Тэргүүлэх жагсаалт
              </div>
              <div className="mt-3 space-y-2">
                {leaderboard.map((student, index) => {
                  const LevelIcon = getLevelIcon(student.level);
                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3 rounded-[18px] border border-[#e2e9f0] bg-white px-4 py-3"
                    >
                      <div className="w-6 shrink-0 text-center text-sm font-semibold text-slate-400">
                        {index + 1}
                      </div>
                      <div
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${getRankAccent(
                          index,
                        )}`}
                      >
                        <LevelIcon className="size-5" strokeWidth={2.1} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {student.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Түвшин {student.level} · {student.examsTaken} шалгалт
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-semibold text-slate-900">
                          {student.xp} XP
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student.progressPercent}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[22px] border border-[#d9e4f0] bg-[#fbfdff] px-5 py-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Дундаж ахиц
                </div>
                <div className="mt-4 flex items-center gap-5">
                  <div
                    className="grid size-[108px] shrink-0 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#4f7cff ${averageProgress}%, #e5ecfb ${averageProgress}% 100%)`,
                    }}
                  >
                    <div className="grid size-[78px] place-items-center rounded-full bg-white text-center">
                      <div>
                        <div className="text-2xl font-semibold text-slate-900">{averageProgress}%</div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Дундаж
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <ShieldIcon className="size-4 text-[#4f7cff]" />
                      Ихэнх нь түвшин {leadingLevel}-д байна
                    </div>
                    <div className="flex items-center gap-2">
                      <ZapIcon className="size-4 text-[#4f7cff]" />
                      Нийт {totalXp} XP хуримтлуулсан
                    </div>
                    <div className="flex items-center gap-2">
                      <MedalIcon className="size-4 text-[#4f7cff]" />
                      Нийт {totalExams} шалгалтын мэдээлэл дээр суурилсан
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-[#d9e4f0] bg-[#fbfdff] px-5 py-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  XP тархалт
                </div>
                <div className="mt-4 space-y-3">
                  {leaderboard.slice(0, 5).map((student) => {
                    const width = topStudent?.xp ? Math.max((student.xp / topStudent.xp) * 100, 6) : 0;
                    return (
                      <div key={`bar-${student.studentId}`}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-medium text-slate-700">{student.name}</span>
                          <span className="shrink-0 font-semibold text-slate-900">{student.xp} XP</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#e8eefb]">
                          <div
                            className="h-full rounded-full bg-[#4f7cff] transition-all duration-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
