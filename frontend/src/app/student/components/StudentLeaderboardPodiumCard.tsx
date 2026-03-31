import { Crown, Medal, Trophy } from "lucide-react";
import {
  getAvatar,
  getFirstName,
  podiumStyles,
  type DisplayEntry,
  formatAverageScore,
} from "./student-leaderboard-helpers";

type StudentLeaderboardPodiumCardProps = {
  entry: DisplayEntry;
};

export default function StudentLeaderboardPodiumCard({
  entry,
}: StudentLeaderboardPodiumCardProps) {
  const style = podiumStyles[entry.rank as 1 | 2 | 3];
  const iconMap = {
    crown: Crown,
    trophy: Trophy,
    medal: Medal,
  } as const;
  const Icon = iconMap[style.icon];

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
      <div className="relative mb-3">
        {entry.rank === 1 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ffe8a5] px-2 py-1 text-[#d08c00] shadow-sm">
            <Crown className="h-4 w-4" />
          </div>
        )}

        <div
          className={`grid h-[56px] w-[56px] place-items-center rounded-[18px] border-2 text-[1.35rem] shadow-[0_10px_20px_rgba(103,120,170,0.12)] ${style.shell} ${style.avatar}`}
        >
          {getAvatar(entry)}
        </div>
      </div>

      <div
        className={`flex w-full max-w-[112px] flex-col items-center justify-end rounded-t-[28px] px-3 pb-4 pt-5 text-center shadow-[0_18px_30px_rgba(96,112,156,0.14)] ${style.block} ${style.height}`}
      >
        <div className={`mb-3 rounded-full px-2 py-1 ${style.iconTone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[2rem] font-bold leading-none">{entry.rank}</div>
      </div>

      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-slate-900">
          {getFirstName(entry.fullName)}
        </div>
        <div className="mt-1 text-xs font-medium text-slate-500">
          {formatAverageScore(entry.averageScore)}% дундаж
        </div>
      </div>
    </div>
  );
}
