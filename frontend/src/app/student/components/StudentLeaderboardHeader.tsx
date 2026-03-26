type StudentLeaderboardHeaderProps = {
  subtitle: string;
  badgeLabel: string;
  mode: "class" | "subject";
  onModeChange: (value: "class" | "subject") => void;
};

export default function StudentLeaderboardHeader({
  subtitle,
  badgeLabel,
  mode,
  onModeChange,
}: StudentLeaderboardHeaderProps) {
  return (
    <>
      <div>
        <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
          Тэргүүлэгчид
        </h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-[22px] bg-[#edf1ff] p-1">
          <button
            type="button"
            className={`rounded-[18px] px-4 py-3 text-center text-sm font-semibold transition ${
              mode === "class"
                ? "bg-white text-slate-700 shadow-sm"
                : "text-[#8c97b5]"
            }`}
            onClick={() => onModeChange("class")}
          >
            10-р анги
          </button>
          <button
            type="button"
            className={`rounded-[18px] px-4 py-3 text-center text-sm font-semibold transition ${
              mode === "subject"
                ? "bg-white text-slate-700 shadow-sm"
                : "text-[#8c97b5]"
            }`}
            onClick={() => onModeChange("subject")}
          >
            Хичээл
          </button>
        </div>

        <div className="shrink-0 rounded-full bg-[#eef3ff] px-3 py-2 text-xs font-semibold text-[#5c6cff]">
          {badgeLabel}
        </div>
      </div>
    </>
  );
}
