import { useMemo } from "react";
import { BarChart3, GraduationCap, Sparkles } from "lucide-react";
import StudentResultsTab from "./StudentResultsTab";

type StudentProgressTabProps = {
  levelInfo: { level: number; minXP: number };
  studentProgress: { xp: number };
  nextLevel: { minXP: number };
  progressSegments: number;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((sum, item) => sum + item, 0) / values.length)
    : 0;

export default function StudentProgressTab({
  levelInfo,
  studentProgress,
  nextLevel,
  progressSegments,
  studentHistory,
}: StudentProgressTabProps) {
  const averageScore = useMemo(
    () => average(studentHistory.map((item) => item.percentage)),
    [studentHistory],
  );

  const xpToNext = Math.max(nextLevel.minXP - studentProgress.xp, 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-[#dfe4ff] bg-[linear-gradient(135deg,#ffffff_0%,#f6f8ff_52%,#eef4ff_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(77,92,148,0.10)] sm:px-6 lg:px-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dfe7ff] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#edf7ff] blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Миний ахиц
            </h2>
            <p className="mt-1 text-base text-slate-500">
              Суралцах явцаа нэг дороос хянаарай
            </p>
          </div>

          <div className="inline-flex min-h-[54px] w-full items-center justify-center rounded-full border border-[#d9e0ff] bg-white/90 px-5 text-base font-semibold text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:w-[260px]">
            Энэ долоо хоног
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[28px] border border-[#e3e7ff] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-400">Одоогийн түвшин</div>
              <div className="text-2xl font-semibold text-slate-900">
                Lv.{levelInfo.level}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Дараагийн түвшин рүү ойртож байна.
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef1ff] text-[#5f6df6]">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e3e7ff] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-400">Нийт XP</div>
              <div className="text-2xl font-semibold text-slate-900">
                {studentProgress.xp.toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                Дараагийн түвшин хүртэл {xpToNext} XP үлдлээ.
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff4eb] text-[#ff923f]">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full ${
                  index < progressSegments ? "bg-[#6a6ff5]" : "bg-[#edf0fa]"
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Дараагийн түвшин хүртэл{" "}
            {Math.max(nextLevel.minXP - studentProgress.xp, 0)} XP
          </div>
        </div>

        <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)]">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e9fbf3] text-[#31966c]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-slate-400">Дундаж оноо</div>
              <div className="text-2xl font-semibold text-slate-900">
                {averageScore}%
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {studentHistory.length} шалгалтын дүн дээр үндэслэв.
          </div>
        </div>
      </section>

      <StudentResultsTab studentHistory={studentHistory} />
    </div>
  );
}
