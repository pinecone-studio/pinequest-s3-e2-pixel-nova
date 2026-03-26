import { Crown, Medal, Trophy } from "lucide-react";

type StudentLeaderboardTabProps = {
  currentUserId: string;
  entries: {
    id: string;
    fullName: string;
    xp: number;
    level: number;
    rank: number;
  }[];
};

const rankTone = (rank: number) => {
  if (rank === 1) {
    return {
      icon: <Crown className="h-4 w-4" />,
      chip: "bg-[#fff6db] text-[#c88a00]",
      bar: "from-[#f7c74a] to-[#f39b34]",
    };
  }

  if (rank === 2) {
    return {
      icon: <Trophy className="h-4 w-4" />,
      chip: "bg-[#eef1ff] text-[#5c6cff]",
      bar: "from-[#7a86ff] to-[#5c6cff]",
    };
  }

  if (rank === 3) {
    return {
      icon: <Medal className="h-4 w-4" />,
      chip: "bg-[#e9fbf3] text-[#31966c]",
      bar: "from-[#58c594] to-[#3aa87a]",
    };
  }

  return {
    icon: <span className="text-xs font-semibold">#{rank}</span>,
    chip: "bg-[#f5f6fb] text-slate-500",
    bar: "from-[#b9c2dd] to-[#d6dcea]",
  };
};

export default function StudentLeaderboardTab({
  currentUserId,
  entries,
}: StudentLeaderboardTabProps) {
  const maxXp = Math.max(...entries.map((item) => item.xp), 1);
  const podium = entries.slice(0, 3);

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
      <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#f9bf45] to-[#ff8f3d] text-white">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Top Students
            </h2>
            <p className="text-sm text-slate-400">
              Snapshot of the current XP leaderboard.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {podium.map((entry) => {
            const tone = rankTone(entry.rank);

            return (
              <div
                key={entry.id}
                className={`rounded-[24px] border p-4 text-center ${
                  entry.rank === 1
                    ? "border-[#ffe7b0] bg-[#fff9ec]"
                    : "border-[#eceaf7] bg-[#fafbff]"
                }`}
              >
                <div
                  className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${tone.chip}`}
                >
                  {tone.icon}
                </div>
                <div className="mt-4 text-sm text-slate-400">Rank #{entry.rank}</div>
                <div className="mt-1 text-base font-semibold text-slate-900">
                  {entry.fullName}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {entry.xp.toLocaleString()} XP
                </div>
                <div className="mt-1 text-xs font-semibold text-slate-400">
                  Level {entry.level}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-[#eceaf7] bg-white p-5 shadow-[0_18px_45px_rgba(78,93,132,0.08)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Full Leaderboard
            </h2>
            <p className="text-sm text-slate-400">
              See where you stand against the rest of the class.
            </p>
          </div>
          <div className="rounded-full bg-[#fff4eb] px-3 py-1.5 text-xs font-semibold text-[#ff8a3d]">
            {entries.length} students
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {entries.map((entry) => {
            const tone = rankTone(entry.rank);
            const progress = Math.max(Math.round((entry.xp / maxXp) * 100), 6);
            const isCurrentUser = entry.id === currentUserId;

            return (
              <div
                key={entry.id}
                className={`rounded-[24px] border px-4 py-4 transition ${
                  isCurrentUser
                    ? "border-[#d8d5ff] bg-[#f7f6ff]"
                    : "border-[#eceaf7] bg-[#fbfcff]"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${tone.chip}`}
                    >
                      {tone.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-slate-900">
                          {entry.fullName}
                        </span>
                        {isCurrentUser && (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5c6cff]">
                            You
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Level {entry.level} • Rank #{entry.rank}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-semibold text-slate-900">
                      {entry.xp.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">XP</div>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ebedf7]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${tone.bar}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
