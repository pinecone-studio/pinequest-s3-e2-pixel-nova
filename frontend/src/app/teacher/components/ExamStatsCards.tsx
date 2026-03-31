import { Skeleton } from "@/components/ui/skeleton";
import { mutedCardClass } from "../styles";
import type { TeacherStat } from "../types";

type ExamStatsCardsProps = {
  loading: boolean;
  stats: TeacherStat[];
};

export default function ExamStatsCards({ loading, stats }: ExamStatsCardsProps) {
  const tones = {
    primary: {
      wrapper: "border-[#bfdbfe] bg-[#eff6ff]",
      value: "text-[#1d4ed8]",
    },
    success: {
      wrapper: "border-emerald-200 bg-emerald-50",
      value: "text-emerald-600 dark:text-emerald-300",
    },
    warning: {
      wrapper: "border-amber-200 bg-amber-50",
      value: "text-amber-600 dark:text-amber-300",
    },
    neutral: {
      wrapper: "border-slate-200 bg-slate-50",
      value: "text-slate-700 dark:text-slate-300",
    },
  } as const;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-[#e6edf8] bg-white/95 p-4 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.12)]"
            >
              <Skeleton className="h-3 w-24 rounded-full" />
              <Skeleton className="mt-3 h-8 w-20 rounded-full" />
              <Skeleton className="mt-4 h-3 w-32 rounded-full" />
            </div>
          ))
        : stats.map((stat) => (
            <div
              key={stat.label}
              className={`${mutedCardClass} border ${tones[stat.tone].wrapper} min-h-[124px]`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </div>
              <div className={`mt-2 text-2xl font-semibold ${tones[stat.tone].value}`}>
                {stat.value}
              </div>
              <div className="mt-3 text-sm text-slate-500">{stat.trend}</div>
            </div>
          ))}
    </section>
  );
}
