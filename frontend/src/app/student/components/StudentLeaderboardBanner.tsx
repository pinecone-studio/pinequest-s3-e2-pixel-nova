import { Trophy } from "lucide-react";

type StudentLeaderboardBannerProps = {
  title: string;
  body: string;
  rank: number;
  gapToTopThree: number;
};

export default function StudentLeaderboardBanner({
  title,
  body,
  rank,
  gapToTopThree,
}: StudentLeaderboardBannerProps) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 rounded-[24px] bg-gradient-to-r from-[#4b74ff] to-[#7b4df1] px-4 py-4 text-white shadow-[0_18px_36px_rgba(90,92,225,0.28)]">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <div className="text-base font-semibold">{title}</div>
          <div className="text-sm text-white/80">{body}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-[2rem] font-bold leading-none">#{rank}</div>
        <div className="mt-1 text-xs font-medium text-white/80">
          {gapToTopThree > 0 ? `Топ 3-д ${gapToTopThree} XP` : "Сайн явж байна"}
        </div>
      </div>
    </div>
  );
}
