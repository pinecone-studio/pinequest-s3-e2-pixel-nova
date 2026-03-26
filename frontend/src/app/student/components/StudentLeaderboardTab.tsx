import { useMemo, useState } from "react";
import StudentLeaderboardBanner from "./StudentLeaderboardBanner";
import StudentLeaderboardHeader from "./StudentLeaderboardHeader";
import StudentLeaderboardListItem from "./StudentLeaderboardListItem";
import StudentLeaderboardPodiumCard from "./StudentLeaderboardPodiumCard";
import {
  buildClassEntries,
  buildSubjectEntries,
  getPodiumEntries,
  type DisplayEntry,
  type LeaderboardEntry,
} from "./student-leaderboard-helpers";

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

type LeaderboardMode = "class" | "subject";
type Entry = StudentLeaderboardTabProps["entries"][number];

export default function StudentLeaderboardTab({
  currentUserId,
  entries,
}: StudentLeaderboardTabProps) {
  const [mode, setMode] = useState<LeaderboardMode>("class");
  const classEntries = useMemo(() => buildClassEntries(entries as Entry[]), [entries]);
  const subjectEntries = useMemo(() => buildSubjectEntries(entries as Entry[]), [entries]);
  const activeEntries: DisplayEntry[] =
    mode === "class" ? classEntries : subjectEntries;
  const currentUser = activeEntries.find((entry) => entry.id === currentUserId) ?? null;
  const topThree = getPodiumEntries(activeEntries);
  const listEntries = activeEntries.filter((entry) => entry.rank > 3);
  const topThreeCutoff =
    activeEntries.find((entry) => entry.rank === 3)?.metricValue ??
    activeEntries[0]?.metricValue ??
    1;
  const gapToTopThree =
    currentUser && currentUser.rank > 3
      ? Math.max(topThreeCutoff - currentUser.metricValue, 0)
      : 0;

  const copy =
    mode === "class"
      ? {
          subtitle: "XP цуглуулж тэргүүлэгчтэй нэгд",
          badgeLabel: "10-р анги",
          bannerTitle: "Чиний эрэмбэ",
          bannerBody:
            currentUser && currentUser.rank <= 3
              ? "Чи топ 3 дотор явж байна."
              : currentUser
                ? `Чи ${currentUser.rank}-т орж байна.`
                : "Эрэмбээ ахиулаарай.",
        }
      : {
          subtitle: "Сонгосон хичээлийн XP чансаа",
          badgeLabel: currentUser?.focusLabel ?? activeEntries[0]?.focusLabel ?? "Хичээл",
          bannerTitle: "Чиний хичээлийн байр",
          bannerBody:
            currentUser && currentUser.rank <= 3
              ? `Чи ${currentUser.focusLabel}-д топ 3 дотор явж байна.`
              : currentUser
                ? `Чи ${currentUser.focusLabel}-д ${currentUser.rank}-т орж байна.`
                : "Хичээлийн чансаагаа ахиулаарай.",
        };

  if (activeEntries.length === 0) {
    return (
      <section className="w-full rounded-[30px] border border-[#dfe4ff] bg-white p-6 shadow-[0_22px_55px_rgba(77,92,148,0.08)]">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          Тэргүүлэгчид
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Одоогоор leaderboard мэдээлэл алга байна.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full space-y-5">
      <div className="rounded-[30px] border border-[#dfe4ff] bg-white p-5 shadow-[0_22px_55px_rgba(77,92,148,0.08)] sm:p-6">
        <StudentLeaderboardHeader
          subtitle={copy.subtitle}
          badgeLabel={copy.badgeLabel}
          mode={mode}
          onModeChange={setMode}
        />

        {currentUser && (
          <StudentLeaderboardBanner
            title={copy.bannerTitle}
            body={copy.bannerBody}
            rank={currentUser.rank}
            gapToTopThree={gapToTopThree}
          />
        )}

        {topThree.length > 0 && (
          <div className="mt-6 flex items-end justify-center gap-3 sm:gap-5">
            {topThree.map((entry) => (
              <StudentLeaderboardPodiumCard
                key={`${mode}-${entry.id}`}
                entry={entry}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {listEntries.map((entry) => {
          const isCurrentUser = entry.id === currentUserId;

          return (
            <StudentLeaderboardListItem
              key={`${mode}-${entry.id}`}
              entry={entry}
              isCurrentUser={isCurrentUser}
              showFocusLabel={mode === "subject"}
            />
          );
        })}

        {listEntries.length === 0 && (
          <div className="rounded-[24px] border border-dashed border-[#dfe4ff] bg-white px-4 py-6 text-center text-sm text-slate-400">
            Одоогоор podium-ын дараах жагсаалт хоосон байна.
          </div>
        )}
      </div>
    </section>
  );
}
