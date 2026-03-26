import { ArrowLeft, LockKeyhole, UserSquare2 } from "lucide-react";

type StudentExamDetailHeaderProps = {
  title: string;
  subject: string;
  status: string;
  teacher: string;
  room: string;
  onBack: () => void;
};

export default function StudentExamDetailHeader({
  title,
  subject,
  status,
  teacher,
  room,
  onBack,
}: StudentExamDetailHeaderProps) {
  return (
    <div className="flex items-start gap-4">
      <button
        aria-label="Go back to exam list"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#eef1f7] bg-white text-slate-500 shadow-sm transition hover:border-[#d8dff0] hover:text-slate-700"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1 rounded-[28px] border border-[#e8edf9] bg-white p-4 shadow-[0_22px_55px_rgba(68,84,125,0.08)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-[1.7rem] font-semibold tracking-[-0.035em] text-slate-900">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium text-[#74b8ff]">
              {subject}
            </p>
          </div>
          <span className="inline-flex self-start rounded-full bg-[#eaf9ee] px-3 py-1 text-xs font-semibold text-[#49b971]">
            {status}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[18px] border border-[#eaf2ff] bg-[#fbfdff] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7fbef9]">
              <UserSquare2 className="h-4 w-4" />
              Багш
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {teacher}
            </div>
          </div>

          <div className="rounded-[18px] border border-[#eaf2ff] bg-[#fbfdff] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7fbef9]">
              <LockKeyhole className="h-4 w-4" />
              Өрөө
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-800">
              {room}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
