import { Sparkles } from "lucide-react";

type StudentDashboardHeroProps = {
  firstName: string;
  currentRank: number | null;
  studentCount: number;
};

export default function StudentDashboardHero({
  firstName,
  currentRank,
  studentCount,
}: StudentDashboardHeroProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-[#eceaf7] bg-gradient-to-r from-[#eef3ff] via-[#f8f1ff] to-[#fff0f3] p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h2 className="text-[1.85rem] font-semibold tracking-[-0.03em] text-slate-900">
          Тавтай морил, {firstName}!
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Өнөөдрийн шалгалтаа амжилттай өгье.
        </p>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-2xl bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
        <Sparkles className="h-4 w-4 text-[#b74bf6]" />
        {currentRank ? (
          <span>
            Чансаа #{currentRank}{" "}
            <span className="font-normal text-slate-400">
              / {studentCount || 1}
            </span>
          </span>
        ) : (
          <span className="text-slate-500">Чансаа удахгүй шинэчлэгдэнэ</span>
        )}
      </div>
    </section>
  );
}
