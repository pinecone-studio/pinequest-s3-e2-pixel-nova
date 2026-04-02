"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import {
  buildStudentAiInsight,
  buildStudentAiInsightSignature,
  type StudentAiInsightSnapshot,
} from "./student-ai-insights";

type StudentAiInsightsTabProps = {
  loading?: boolean;
  currentUserId: string | null;
  currentUserName: string;
  currentXp: number;
  currentRank: number | null;
  totalStudents: number;
  levelInfo: {
    level: number;
    name: string;
    minXP: number;
  };
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    date: string;
  }[];
};

const STORAGE_PREFIX = "student-ai-insights-v2";

const infoCardClass =
  "rounded-[22px] border border-[#e8ecfb] bg-white px-4 py-4 shadow-[0_10px_26px_-24px_rgba(77,92,148,0.2)]";

const getStorageKey = (userId: string | null) => `${STORAGE_PREFIX}:${userId ?? "guest"}`;

function StudentAiInsightsSkeleton() {
  return (
    <section
      aria-label="student-ai-insights-loading"
      className="mx-auto w-full max-w-[1120px]"
    >
      <div className="rounded-[32px] border border-[#dfe4ff] bg-white px-5 py-5 shadow-[0_20px_56px_rgba(77,92,148,0.10)] sm:px-6">
        <div className="h-6 w-48 animate-pulse rounded-full bg-[#eef2fb]" />
        <div className="mt-5 h-12 w-[680px] max-w-full animate-pulse rounded-full bg-[#e4e7f0]" />
        <div className="mt-3 h-12 w-[720px] max-w-full animate-pulse rounded-full bg-[#e4e7f0]" />
        <div className="mt-5 h-5 w-full animate-pulse rounded-full bg-[#eef2fb]" />
        <div className="mt-2 h-5 w-11/12 animate-pulse rounded-full bg-[#eef2fb]" />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`${infoCardClass} h-[112px] animate-pulse bg-[#fbfcff]`}
            />
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className={`${infoCardClass} h-[128px] animate-pulse bg-[#fbfcff]`}
            />
          ))}
        </div>

        <div className="mt-5 h-[92px] animate-pulse rounded-[24px] border border-[#f3e5c6] bg-[#fffaf2]" />
      </div>
    </section>
  );
}

export default function StudentAiInsightsTab({
  loading = false,
  currentUserId,
  currentUserName,
  currentXp,
  currentRank,
  totalStudents,
  levelInfo,
  studentHistory,
}: StudentAiInsightsTabProps) {
  const [snapshot, setSnapshot] = useState<StudentAiInsightSnapshot | null>(null);

  const signature = useMemo(
    () =>
      buildStudentAiInsightSignature({
        currentUserName,
        levelInfo,
        currentXp,
        currentRank,
        totalStudents,
        studentHistory,
      }),
    [currentUserName, currentRank, currentXp, levelInfo, studentHistory, totalStudents],
  );

  useEffect(() => {
    if (loading) return;
    const storageKey = getStorageKey(currentUserId);
    const cached = window.localStorage.getItem(storageKey);

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as StudentAiInsightSnapshot;
        if (parsed.signature === signature) {
          setSnapshot(parsed);
          return;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const nextSnapshot = buildStudentAiInsight({
      currentUserName,
      levelInfo,
      currentXp,
      currentRank,
      totalStudents,
      studentHistory,
    });

    setSnapshot(nextSnapshot);
    window.localStorage.setItem(storageKey, JSON.stringify(nextSnapshot));
  }, [currentRank, currentUserId, currentUserName, currentXp, levelInfo, loading, signature, studentHistory, totalStudents]);

  if (loading || !snapshot) {
    return <StudentAiInsightsSkeleton />;
  }

  const rankLabel =
    currentRank && totalStudents > 0
      ? `#${currentRank} / ${totalStudents}`
      : "Тооцогдож байна";

  return (
    <section className="mx-auto w-full max-w-[1120px]">
      <div className="rounded-[32px] border border-[#dfe4ff] bg-white px-5 py-5 shadow-[0_20px_56px_rgba(77,92,148,0.10)] sm:px-6">
        <div className="flex items-center gap-2 text-[1.02rem] font-semibold text-[#3564ea]">
          <Sparkles className="h-5 w-5" />
          Хиймэл оюуны ерөнхий дүгнэлт
        </div>

        <h2 className="mt-5 max-w-[860px] text-[2rem] font-semibold tracking-[-0.05em] leading-[1.35] text-slate-900">
          {snapshot.headline}
        </h2>

        <p className="mt-4 text-[1.02rem] leading-9 text-slate-500">
          {snapshot.summary}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className={infoCardClass}>
            <div className="text-sm text-slate-400">Дундаж оноо</div>
            <div className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              {snapshot.stats.average}%
            </div>
          </div>

          <div className={infoCardClass}>
            <div className="text-sm text-slate-400">Хамгийн өндөр</div>
            <div className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              {snapshot.stats.best}%
            </div>
          </div>

          <div className={infoCardClass}>
            <div className="text-sm text-slate-400">Шалгалтын тоо</div>
            <div className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-slate-900">
              {snapshot.stats.examCount}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className={infoCardClass}>
            <div className="text-sm text-slate-400">Онооны эрэмбэ</div>
            <div className="mt-3 text-[1.1rem] font-semibold text-slate-900">{rankLabel}</div>
            <div className="mt-2 text-sm text-slate-400">
              Одоогийн түвшин: {levelInfo.name}
            </div>
          </div>

          <div className={infoCardClass}>
            <div className="text-sm text-slate-400">Явцын төлөв</div>
            <div className="mt-3 text-[1.1rem] font-semibold leading-8 text-slate-900">
              {snapshot.stats.trendLabel}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              {snapshot.stats.consistencyLabel}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#f3e5c6] bg-[#fffaf2] px-4 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#d89b34]">
            <Lightbulb className="h-4 w-4" />
            Өнөөдрийн урам
          </div>
          <p className="mt-3 text-[1.02rem] leading-8 text-slate-600">
            {snapshot.encouragement}
          </p>
        </div>
      </div>
    </section>
  );
}
