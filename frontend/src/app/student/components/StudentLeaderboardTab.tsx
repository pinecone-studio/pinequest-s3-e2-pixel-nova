"use client";

import { useState } from "react";
import { EyeOff, Sparkles, TrendingUp } from "lucide-react";
import type { XpLeaderboardEntry } from "@/api/xp";
import type {
  StudentImprovementLeaderboardEntry,
  StudentProgressRankOverview,
  StudentTermRankOverview,
} from "@/lib/backend-auth";
import StudentLeaderboardListItem from "./StudentLeaderboardListItem";
import {
  buildClassEntries,
  buildMockImprovementEntries,
} from "./student-leaderboard-helpers";

export type StudentLeaderboardTabProps = {
  currentUserId?: string | null;
  currentUserName: string;
  termRankOverview: StudentTermRankOverview;
  progressRankOverview?: StudentProgressRankOverview | null;
  termLeaderboardEntries?: XpLeaderboardEntry[];
  improvementLeaderboard?: StudentImprovementLeaderboardEntry[];
};

type LeaderboardView = "term" | "improvement";

const leaderboardTabs: Array<{
  key: LeaderboardView;
  label: string;
  hint: string;
}> = [
  {
    key: "term",
    label: "Улирлын XP",
    hint: "Нээлттэй самбар",
  },
  {
    key: "improvement",
    label: "Ахицын XP",
    hint: "Өсөлтийн эрэмбэ",
  },
];

export default function StudentLeaderboardTab({
  currentUserId = null,
  currentUserName,
  termRankOverview,
  progressRankOverview = null,
  termLeaderboardEntries = [],
  improvementLeaderboard = [],
}: StudentLeaderboardTabProps) {
  const [activeView, setActiveView] = useState<LeaderboardView>("term");
  const safeTermRankOverview = {
    rank: termRankOverview?.rank ?? null,
    totalStudents: termRankOverview?.totalStudents ?? 0,
    termExamCount: termRankOverview?.termExamCount ?? 0,
    xp: termRankOverview?.xp ?? 0,
    level: termRankOverview?.level ?? 1,
  };
  const safeProgressRankOverview = {
    rank: progressRankOverview?.rank ?? null,
    totalStudents: progressRankOverview?.totalStudents ?? 0,
    progressExamCount: progressRankOverview?.progressExamCount ?? 0,
    xp: progressRankOverview?.xp ?? 0,
    level: progressRankOverview?.level ?? 1,
    isPrivate: progressRankOverview?.isPrivate ?? true,
  };

  const showingImprovement = activeView === "improvement";
  const termEntries = buildClassEntries(
    termLeaderboardEntries.map((entry) => ({
      ...entry,
      fullName:
        currentUserId && entry.id === currentUserId ? currentUserName : entry.fullName,
      level:
        currentUserId && entry.id === currentUserId
          ? safeTermRankOverview.level
          : entry.level,
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
  const hasProgressRank =
    typeof safeProgressRankOverview.rank === "number" &&
    safeProgressRankOverview.progressExamCount > 0;

  return (
    <section className="space-y-6">
      <div className="rounded-[30px] border border-[#e8ecfb] bg-white px-5 py-5 shadow-[0_18px_48px_rgba(71,85,122,0.08)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              Тэргүүлэгчид
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Цэнхэр блок дээр зөвхөн явцын нууц rank харагдана. Доорх хэсэг
              нь XP жагсаалтыг тусдаа сольж харуулна.
            </p>
          </div>

          <div className="min-w-[280px] rounded-[18px] bg-[linear-gradient(135deg,#4b8cff_0%,#744cff_100%)] px-5 py-4 text-white shadow-[0_16px_36px_rgba(96,98,255,0.26)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/14">
                  <EyeOff className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Нууц явцын эрэмбэ</div>
                  <div className="text-sm text-white/80">
                    {hasProgressRank
                      ? `Чи ${safeProgressRankOverview.rank}-т явж байна.`
                      : "Явцын XP хараахан бүрдээгүй байна."}
                  </div>
                </div>
              </div>
              <div className="text-[2rem] font-semibold leading-none">
                {hasProgressRank ? `#${safeProgressRankOverview.rank}` : "—"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-white/80">
              <div className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">
                  XP
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {safeProgressRankOverview.xp.toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">
                  Түвшин
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Түв. {safeProgressRankOverview.level}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-3 py-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-white/60">
                  Шалгалт
                </div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {safeProgressRankOverview.progressExamCount}
                </div>
              </div>
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
                : "Улирлын XP тэргүүлэгчид"}
            </div>

            <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-900">
              {showingImprovement ? "Ахицын XP жагсаалт" : "Улирлын XP жагсаалт"}
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              {showingImprovement
                ? "Өмнөх явцын шалгалтаасаа ахисан хувьтай тэнцэх growth XP авна. 100 → 100 бол +10 XP, тасалбал -10 XP хасагдана."
                : "Улирлын шалгалт өгөх бүрт XP зөвхөн энэ нээлттэй самбар дээр нэмэгдэнэ."}
            </p>
          </div>

          <div
            className="inline-flex w-full max-w-[360px] rounded-[24px] border border-[#e8ecfb] bg-[#f6f8ff] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            role="tablist"
            aria-label="XP жагсаалт солигч"
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
            <div data-testid="term-leaderboard" className="space-y-3">
              {termEntries.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-[#e8ecfb] bg-white px-5 py-8 text-sm text-slate-400">
                  Одоогоор улирлын XP жагсаалт хоосон байна.
                </div>
              )}

              {termEntries.map((entry) => (
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
