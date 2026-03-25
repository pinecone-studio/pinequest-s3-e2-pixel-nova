import { mutedCardClass } from "../styles";

type StatItem = {
  label: string;
  value: string;
  trend: string;
};

type ExamStatsCardsProps = {
  loading: boolean;
  stats: StatItem[];
};

export default function ExamStatsCards({ loading, stats }: ExamStatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {loading
        ? Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-24 animate-pulse rounded-2xl border border-border bg-muted"
            />
          ))
        : stats.map((stat) => (
            <div key={stat.label} className={mutedCardClass}>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.trend}</div>
            </div>
          ))}
    </section>
  );
}
