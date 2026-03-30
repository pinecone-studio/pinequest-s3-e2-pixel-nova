import { Sparkles, Zap } from "lucide-react";
import {
  getAvatar,
  getFirstName,
  formatCompactXp,
  type DisplayEntry,
} from "./student-leaderboard-helpers";

type StudentLeaderboardListItemProps = {
  entry: DisplayEntry;
  isCurrentUser: boolean;
  showFocusLabel: boolean;
};

export default function StudentLeaderboardListItem({
  entry,
  isCurrentUser,
  showFocusLabel,
}: StudentLeaderboardListItemProps) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-[24px] border px-4 py-4 shadow-[0_10px_22px_rgba(77,92,148,0.05)] transition ${
        isCurrentUser
          ? "border-[#cfd8ff] bg-[#eef3ff]"
          : "border-[#edf1fb] bg-white"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${
            isCurrentUser
              ? "bg-[#5b67f6] text-white"
              : "bg-[#eef2fb] text-slate-500"
          }`}
        >
          {entry.rank}
        </div>

        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#edf1fb] bg-[#f8faff] text-lg">
          {getAvatar(entry)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-semibold text-slate-900">
              {getFirstName(entry.fullName)}
            </span>
            {isCurrentUser && (
              <span className="rounded-full bg-[#5c6cff] px-2 py-0.5 text-[10px] font-semibold text-white">
                you
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            Lvl {entry.level}
            {showFocusLabel ? ` • ${entry.focusLabel}` : ""}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div className="flex items-center justify-end gap-1 text-base font-semibold text-[#d69424]">
          <Zap className="h-4 w-4" />
          {formatCompactXp(entry.metricValue)}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#fff5de] px-2.5 py-1 text-xs font-semibold text-[#d69424]">
          <Sparkles className="h-3.5 w-3.5" />
          {entry.metricPercent}%
        </div>
      </div>
    </div>
  );
}
