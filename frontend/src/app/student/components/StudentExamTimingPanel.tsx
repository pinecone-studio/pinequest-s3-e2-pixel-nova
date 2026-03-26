import { CalendarDays, Clock3, Hourglass, Play, TimerReset } from "lucide-react";

type StudentExamTimingPanelProps = {
  dateLabel: string;
  startLabel: string;
  endLabel: string;
  durationLabel: string;
};

export default function StudentExamTimingPanel({
  dateLabel,
  startLabel,
  endLabel,
  durationLabel,
}: StudentExamTimingPanelProps) {
  return (
    <div className="rounded-[28px] border border-[#e8edf9] bg-white p-5 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-6">
      <div className="flex items-center gap-2 text-[1.05rem] font-semibold text-slate-900">
        <Clock3 className="h-5 w-5" />
        Хугацаа
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[20px] border border-[#bfd4ff] bg-[#f4f8ff] px-4 py-4 text-center">
          <CalendarDays className="mx-auto h-5 w-5 text-slate-500" />
          <div className="mt-3 text-xs text-slate-400">Огноо</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {dateLabel}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#ccefd9] bg-[#f2fcf4] px-4 py-4 text-center">
          <Play className="mx-auto h-5 w-5 text-[#49b971]" />
          <div className="mt-3 text-xs text-slate-400">Эхлэх цаг</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {startLabel}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#ffd6d2] bg-[#fff6f5] px-4 py-4 text-center">
          <TimerReset className="mx-auto h-5 w-5 text-[#f06d65]" />
          <div className="mt-3 text-xs text-slate-400">Дуусах цаг</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {endLabel}
          </div>
        </div>

        <div className="rounded-[20px] border border-[#ffe0b9] bg-[#fffaf1] px-4 py-4 text-center">
          <Hourglass className="mx-auto h-5 w-5 text-[#f0a12c]" />
          <div className="mt-3 text-xs text-slate-400">Үргэлжлэх хугацаа</div>
          <div className="mt-1 text-base font-semibold text-slate-800">
            {durationLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
