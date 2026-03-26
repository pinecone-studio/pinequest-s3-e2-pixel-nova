import { ArrowRight, TrendingUp } from "lucide-react";

type ProgressPoint = {
  label: string;
  value: number;
};

type ProgressSeries = {
  hasData: boolean;
  points: ProgressPoint[];
  latest: number;
  delta: number;
  linePath: string;
  areaPath: string;
};

type StudentProgressPanelProps = {
  progressSeries: ProgressSeries;
  onOpenProgress: () => void;
};

export default function StudentProgressPanel({
  progressSeries,
  onOpenProgress,
}: StudentProgressPanelProps) {
  return (
    <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-[#6a5cff] to-[#8d65ff] text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">
              Ахицын тойм
            </h3>
            <p className="text-sm text-slate-400">
              Сүүлийн шалгалтуудын дундаж
            </p>
          </div>
        </div>

        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#5c6cff] transition hover:text-[#4052f7]"
          onClick={onOpenProgress}
        >
          Дэлгэрэнгүй
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-3">
        <div className="text-5xl font-semibold tracking-[-0.04em] text-slate-900">
          {progressSeries.latest}%
        </div>
        <div
          className={`mb-2 inline-flex items-center gap-1 text-sm font-semibold ${
            progressSeries.delta >= 0 ? "text-[#4ab88f]" : "text-[#ff7a59]"
          }`}
        >
          {progressSeries.delta >= 0 ? "+" : ""}
          {progressSeries.delta}% <TrendingUp className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-[24px] bg-gradient-to-b from-[#f6f3ff] via-[#fcfbff] to-white p-4">
        {progressSeries.hasData ? (
          <>
            <svg
              viewBox="0 0 100 34"
              preserveAspectRatio="none"
              className="h-40 w-full"
              aria-label="Сурагчийн ахицын график"
              role="img"
            >
              <defs>
                <linearGradient id="student-progress-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b84df5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path d={progressSeries.areaPath} fill="url(#student-progress-fill)" />
              <path
                d={progressSeries.linePath}
                fill="none"
                stroke="#7b61ff"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            </svg>

            <div className="mt-4 grid grid-cols-6 text-center text-xs text-slate-300">
              {progressSeries.points.map((point) => (
                <span key={point.label}>{point.label}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">
            Одоогоор ахицын мэдээлэл алга.
          </div>
        )}
      </div>
    </div>
  );
}
