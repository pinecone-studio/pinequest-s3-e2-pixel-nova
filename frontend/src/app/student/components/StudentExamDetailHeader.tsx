import { ArrowLeft, BookOpen, User2 } from "lucide-react";

type StudentExamDetailInfoCardProps = {
  icon: typeof User2;
  label: string;
  value: string;
};

type StudentExamDetailHeaderProps = {
  title: string;
  subtitle?: string | null;
  status: string;
  teacher: string;
  secondaryLabel: string;
  secondaryValue: string;
  onBack: () => void;
};

const statusClassNames: Record<string, string> = {
  "Идэвхтэй": "border-[#cdeedc] bg-[#ebfbf1] text-[#45b56f]",
  "Бэлэн": "border-[#cdeedc] bg-[#ebfbf1] text-[#45b56f]",
  "Хүлээгдэж байна": "border-[#ffe5b8] bg-[#fff8e8] text-[#df9b2f]",
  "Хоцорч орж байна": "border-[#ffd4d4] bg-[#fff4f4] text-[#ef6d63]",
};

function StudentExamDetailInfoCard({
  icon: Icon,
  label,
  value,
}: StudentExamDetailInfoCardProps) {
  return (
    <div className="rounded-[20px] border border-[#ddeaff] bg-[#fcfeff] px-4 py-3.5">
      <div className="flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#88baf2]">
        <span className="grid h-7 w-7 place-items-center rounded-[10px] bg-[#eef7ff] text-[#6aaeea]">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>

      <div className="mt-2 text-[1.05rem] font-semibold text-slate-800">
        {value}
      </div>
    </div>
  );
}

export default function StudentExamDetailHeader({
  title,
  subtitle,
  status,
  teacher,
  secondaryLabel,
  secondaryValue,
  onBack,
}: StudentExamDetailHeaderProps) {
  const statusClassName =
    statusClassNames[status] ??
    "border-[#dce6ff] bg-[#f4f7ff] text-[#6e7fd6]";

  return (
    <div className="relative">
      <button
        aria-label="Шалгалтын жагсаалт руу буцах"
        className="mb-4 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#eef1f7] bg-white text-slate-500 shadow-sm transition hover:border-[#d8dff0] hover:text-slate-700 sm:absolute sm:left-[-56px] sm:top-1 sm:mb-0"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="w-full rounded-[24px] border border-[#e8edf9] bg-white px-5 py-5 shadow-[0_20px_50px_rgba(70,84,125,0.08)] sm:min-h-[182px] sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[1.15rem] font-semibold tracking-[-0.03em] text-[#4d8eae]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm font-medium text-[#8ab4ff]">
                {subtitle}
              </p>
            ) : null}
          </div>

          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusClassName}`}
          >
            {status}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StudentExamDetailInfoCard
            icon={User2}
            label="Багш"
            value={teacher}
          />
          <StudentExamDetailInfoCard
            icon={BookOpen}
            label={secondaryLabel}
            value={secondaryValue}
          />
        </div>
      </div>
    </div>
  );
}
