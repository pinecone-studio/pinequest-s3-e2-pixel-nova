import type { ExamAttendanceStats } from "../types";

const getTone = (rate: number) => {
  if (rate >= 70) return "stroke-emerald-500";
  if (rate >= 45) return "stroke-amber-500";
  return "stroke-rose-500";
};

const getAccent = (rate: number) => {
  if (rate >= 70) return "text-emerald-600";
  if (rate >= 45) return "text-amber-600";
  return "text-rose-600";
};

export default function AttendanceStatsCard({
  stats,
  loading,
}: {
  stats: ExamAttendanceStats | null;
  loading: boolean;
}) {
  const expected = stats?.expected ?? 0;
  const joined = stats?.joined ?? 0;
  const submitted = stats?.submitted ?? 0;
  const absent = Math.max(expected - joined, 0);
  const free = Math.max(joined - submitted, 0);
  const attendanceRate = stats?.attendance_rate ?? 0;
  const progress = Math.min(100, Math.max(0, attendanceRate));

  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="rounded-[18px] border border-[#e5e7eb] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="text-[11px] font-semibold text-slate-900">Шалгалтын ирц</div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="space-y-1 text-[11px] text-slate-500">
          <div className="flex items-center justify-between gap-4">
            <span>Тасалсан:</span>
            <span className="font-semibold text-slate-700">{absent}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Өгсөн:</span>
            <span className="font-semibold text-slate-700">{submitted}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Чөлөөтэй:</span>
            <span className="font-semibold text-slate-700">{free}</span>
          </div>
        </div>
        <div className="flex h-[74px] w-[74px] items-center justify-center">
          {loading ? (
            <div className="h-[64px] w-[64px] animate-pulse rounded-full bg-slate-100" />
          ) : (
            <svg width="74" height="74" className="rotate-[-90deg]">
              <circle
                cx="37"
                cy="37"
                r={radius}
                stroke="#f1f5f9"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="37"
                cy="37"
                r={radius}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={getTone(progress)}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 700ms ease" }}
              />
              <text
                x="37"
                y="40"
                textAnchor="middle"
                className={`rotate-[90deg] text-[12px] font-semibold ${getAccent(progress)}`}
              >
                {progress}%
              </text>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
