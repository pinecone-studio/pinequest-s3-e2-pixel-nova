"use client";

import { useState } from "react";
import { Sparkles, Trophy, TrendingUp } from "lucide-react";
import type { XpLeaderboardEntry } from "@/api/xp";
import type {
  StudentImprovementLeaderboardEntry,
  StudentTermRankOverview,
} from "@/lib/backend-auth";
import StudentLeaderboardListItem from "./StudentLeaderboardListItem";
import {
  buildClassEntries,
  buildMockImprovementEntries,
} from "./student-leaderboard-helpers";

type StudentLeaderboardTabProps = {
  currentUserId: string | null;
  currentUserName: string;
  currentLevel: number;
  termRankOverview: StudentTermRankOverview;
  leaderboardEntries: XpLeaderboardEntry[];
  improvementLeaderboard?: StudentImprovementLeaderboardEntry[];
};

type LeaderboardView = "xp" | "improvement";

const leaderboardTabs: Array<{
  key: LeaderboardView;
  label: string;
  hint: string;
}> = [
  {
    key: "xp",
    label: "Нийт XP",
    hint: "Level + XP",
  },
  {
    key: "improvement",
    label: "Ахицын XP",
    hint: "Growth ranking",
  },
];

export default function StudentLeaderboardTab({
  currentUserId,
  currentUserName,
  currentLevel,
  termRankOverview,
  leaderboardEntries,
  improvementLeaderboard = [],
}: StudentLeaderboardTabProps) {
  const [activeView, setActiveView] = useState<LeaderboardView>("xp");

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
  const improvementEntries = buildMockImprovementEntries({
    entries: improvementLeaderboard.map((entry) => ({
      ...entry,
      fullName:
        currentUserId && entry.id === currentUserId ? currentUserName : entry.fullName,
    })),
    currentUserId,
    currentUserName,
  });
  const hasLeaderboard = displayEntries.length > 0;
  const showingImprovement = activeView === "improvement";

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
                ? "Цэнхэр блок нь улирлын шалгалтаар, доорх самбар нь сонгосон XP төрлөөр эрэмбэлэгдэнэ."
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

      <div className="rounded-[30px] border border-[#e8ecfb] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(71,85,122,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                showingImprovement
                  ? "bg-[#eef6ff] text-[#2f6fe4]"
                  : "bg-[#fff6e8] text-[#c88412]"
              }`}
            >
              {showingImprovement ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {showingImprovement
                ? "Ахиц дэвшлийн тэргүүлэгчид"
                : "Нийт XP тэргүүлэгчид"}
            </div>

            <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-900">
              {showingImprovement ? "Ахицын XP Leaderboard" : "Нийт XP Leaderboard"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {showingImprovement
                ? "Өмнөх явцын шалгалтаасаа ахисан хувьтай тэнцэх growth XP авна. 100 → 100 бол +10 XP, тасалбал -10 XP хасагдана."
                : "Энэ самбар нь сурагчдыг нийт XP болон level-ээр нь эрэмбэлж харуулна."}
            </p>
          </div>

          <div
            className="inline-flex w-full max-w-[360px] rounded-[24px] border border-[#e8ecfb] bg-[#f6f8ff] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            role="tablist"
            aria-label="XP leaderboard switcher"
          >
            {leaderboardTabs.map((tab) => {
              const selected = activeView === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`flex-1 rounded-[18px] px-4 py-3 text-left transition ${
                    selected
                      ? "bg-white text-slate-900 shadow-[0_12px_24px_rgba(71,85,122,0.12)]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  onClick={() => setActiveView(tab.key)}
                >
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div className="mt-1 text-[11px] opacity-80">{tab.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {showingImprovement ? (
            <div data-testid="improvement-leaderboard" className="space-y-3">
              {improvementEntries.map((entry) => (
                <StudentLeaderboardListItem
                  key={`improvement-${entry.id}`}
                  entry={entry}
                  isCurrentUser={Boolean(currentUserId && entry.id === currentUserId)}
                />
              ))}
            </div>
          ) : (
            <div data-testid="xp-leaderboard" className="space-y-3">
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
          )}
        </div>
      </div>
    </section>
  );
}
