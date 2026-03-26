import { ArrowRight, BookOpen, CalendarDays, Clock3 } from "lucide-react";

type UpcomingItem = {
  title: string;
  subtitle: string;
  questions: number;
  dateLabel: string;
  timeLabel: string;
  badge: string;
  soft: string;
  text: string;
};

type StudentUpcomingExamsPanelProps = {
  loading: boolean;
  overview: UpcomingItem[];
  onOpenExams: () => void;
};

export default function StudentUpcomingExamsPanel({
  loading,
  overview,
  onOpenExams,
}: StudentUpcomingExamsPanelProps) {
  return (
    <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Ирэх шалгалтууд
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Дараагийн шалгалтаа хурдан харах боломж.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c6cff] transition hover:text-[#4052f7]"
          onClick={onOpenExams}
        >
          Бүгдийг харах
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[104px] animate-pulse rounded-[24px] border border-[#eceaf7] bg-[#f8f9ff]"
              />
            ))
          : overview.length > 0
            ? overview.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex flex-col gap-4 rounded-[24px] border border-[#eceaf7] bg-white p-4 shadow-[0_10px_30px_rgba(88,94,138,0.06)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`grid h-14 w-14 place-items-center rounded-[20px] ${item.badge} text-white shadow-[0_14px_28px_rgba(76,92,145,0.18)]`}
                    >
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-semibold text-slate-900">
                          {item.title}
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${item.soft} ${item.text}`}
                        >
                          {item.subtitle}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />
                          {item.dateLabel}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-4 w-4" />
                          {item.timeLabel}
                        </span>
                        <span>{item.questions} асуулт</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#f5f4ff] px-4 py-2 text-sm font-semibold text-[#5c6cff] transition hover:bg-[#ece9ff] sm:self-center"
                    onClick={onOpenExams}
                  >
                    Нээх
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ))
            : (
              <div className="rounded-[24px] border border-dashed border-[#eceaf7] bg-[#fbfbff] px-4 py-6 text-center text-sm text-slate-400">
                Одоогоор харах шалгалт алга.
              </div>
            )}
      </div>
    </div>
  );
}
