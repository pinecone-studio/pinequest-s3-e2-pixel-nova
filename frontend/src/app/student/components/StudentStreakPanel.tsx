import { Flame } from "lucide-react";

type StudentStreakPanelProps = {
  streakDays: number;
  weekLabels: string[];
  weekActive: boolean[];
  xpToNext: number;
  nextLevel: number;
};

export default function StudentStreakPanel({
  streakDays,
  weekLabels,
  weekActive,
  xpToNext,
  nextLevel,
}: StudentStreakPanelProps) {
  return (
    <div className="rounded-[28px] bg-[#f7762a] p-5 text-white shadow-[0_22px_50px_rgba(247,118,42,0.25)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/80">Тасралтгүй өдрүүд</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-semibold tracking-[-0.04em]">
              {streakDays}
            </span>
            <span className="pb-2 text-lg text-white/80">өдөр</span>
          </div>
        </div>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/18">
          <Flame className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-8">
        <div className="text-sm text-white/80">Энэ долоо хоног</div>
        <div className="mt-4 grid grid-cols-7 gap-2 text-center">
          {weekActive.map((active, index) => (
            <div key={`${weekLabels[index]}-${index}`}>
              <div
                className={`mx-auto grid h-8 w-8 place-items-center rounded-full border text-[11px] font-semibold ${
                  active
                    ? "border-white/25 bg-white text-[#f7762a]"
                    : "border-dashed border-white/50 bg-transparent text-white/80"
                }`}
              >
                {active ? <Flame className="h-3.5 w-3.5" /> : ""}
              </div>
              <div className="mt-2 text-[11px] text-white/75">
                {weekLabels[index]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-[20px] bg-white/14 px-4 py-3 text-center text-sm text-white/90">
        Сайн байна! {xpToNext > 0 ? `${xpToNext} оноо` : "Та аль хэдийн"}
        {xpToNext > 0 ? " хэрэгтэй" : ""} байна. Дараагийн түвшин{" "}
        {nextLevel}.
      </div>
    </div>
  );
}
