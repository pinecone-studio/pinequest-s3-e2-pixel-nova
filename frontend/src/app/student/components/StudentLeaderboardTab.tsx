import { Trophy } from "lucide-react";
import type { XpLeaderboardEntry } from "@/api/xp";
import type { StudentTermRankOverview } from "@/lib/backend-auth";
import StudentLeaderboardListItem from "./StudentLeaderboardListItem";
import { buildClassEntries } from "./student-leaderboard-helpers";

type StudentLeaderboardTabProps = {
  currentUserId: string | null;
  currentUserName: string;
  currentLevel: number;
  termRankOverview: StudentTermRankOverview;
  leaderboardEntries: XpLeaderboardEntry[];
};

export default function StudentLeaderboardTab({
  currentUserId,
  currentUserName,
  currentLevel,
  termRankOverview,
  leaderboardEntries,
}: StudentLeaderboardTabProps) {
  const hasRank =
    typeof termRankOverview.rank === "number" && termRankOverview.termExamCount > 0;
  const displayEntries = buildClassEntries(
    leaderboardEntries.map((entry) => ({
      ...entry,
      fullName:
        currentUserId && entry.id === currentUserId ? currentUserName : entry.fullName,
      level: currentUserId && entry.id === currentUserId ? currentLevel : entry.level,
    })),
  );
  const hasLeaderboard = displayEntries.length > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-[#e8ecfb] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(71,85,122,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Тэргүүлэгчид
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {hasLeaderboard
                ? "Цэнхэр блок нь улирлын шалгалтаар, доорх Top 10 нь жинхэнэ XP leaderboard-оор эрэмбэлэгдэнэ."
                : "XP leaderboard хараахан бүрдээгүй байна."}
            </p>
          </div>

          <div className="min-w-[280px] rounded-[18px] bg-[linear-gradient(135deg,#4b8cff_0%,#744cff_100%)] px-5 py-4 text-white shadow-[0_16px_36px_rgba(96,98,255,0.26)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/14">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Чиний эрэмбэ</div>
                  <div className="text-sm text-white/80">
                    {hasRank
                      ? `Чи ${termRankOverview.rank}-т явж байна.`
                      : "Эрэмбэ удахгүй харагдана."}
                  </div>
                </div>
              </div>
              <div className="text-[2rem] font-semibold leading-none">
                {hasRank ? `#${termRankOverview.rank}` : "—"}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-white/80">
              <span>Улирлын шалгалтын дүнгээр</span>
              <span>{termRankOverview.termExamCount} шалгалт</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {displayEntries.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#e8ecfb] bg-white px-5 py-8 text-sm text-slate-400">
            Одоогоор XP leaderboard хоосон байна.
          </div>
        )}

        {displayEntries.map((entry) => (
          <StudentLeaderboardListItem
            key={entry.id}
            entry={entry}
            isCurrentUser={Boolean(currentUserId && entry.id === currentUserId)}
            showFocusLabel={false}
          />
        ))}
      </div>
    </section>
  );
}
