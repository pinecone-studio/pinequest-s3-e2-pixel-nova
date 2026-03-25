import { mutedCardClass } from "../styles";
import type { TeacherStat } from "../types";

type ExamStatsCardsProps = {
  loading: boolean;
  stats: TeacherStat[];
};

export default function ExamStatsCards({ loading, stats }: ExamStatsCardsProps) {
  const tones = {
    primary: {
      wrapper: "border-primary/15 bg-primary/5",
      value: "text-primary",
    },
    success: {
      wrapper: "border-emerald-500/15 bg-emerald-500/5",
      value: "text-emerald-600 dark:text-emerald-300",
    },
    warning: {
      wrapper: "border-amber-500/15 bg-amber-500/5",
      value: "text-amber-600 dark:text-amber-300",
    },
    neutral: {
      wrapper: "border-sky-500/15 bg-sky-500/5",
      value: "text-sky-600 dark:text-sky-300",
    },
  } as const;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {loading
        ? Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))
        : stats.map((stat) => (
            <div
              key={stat.label}
              className={`${mutedCardClass} border ${tones[stat.tone].wrapper}`}
            >
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className={`mt-2 text-2xl font-semibold ${tones[stat.tone].value}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.trend}</div>
            </div>
          ))}
    </section>
  );
}
