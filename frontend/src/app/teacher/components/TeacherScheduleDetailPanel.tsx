import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clipboard,
  Clock3,
  UsersRound,
} from "lucide-react";
import RoomCodeCopyButton from "./RoomCodeCopyButton";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import type { Exam, ExamRosterDetail, ExamRosterParticipant } from "../types";
import { sectionTitleClass } from "../styles";
import { formatDateTime } from "../utils";
import TeacherEmptyState from "./TeacherEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

function getParticipantMeta(participant: ExamRosterParticipant) {
  if (
    participant.riskLevel === "critical" ||
    participant.riskLevel === "high" ||
    participant.isFlagged ||
    participant.flagCount > 0
  ) {
    return {
      label: participant.riskLevel === "critical" ? "Critical" : "Risky",
      tone: "border-[#ffb8b8] bg-[#fff1f1] text-[#ff5b57]",
      progressTone: "bg-[#b7bcc6]",
    };
  }
  if (participant.riskLevel === "medium") {
    return {
      label: "Watch",
      tone: "border-[#ffd5a8] bg-[#fff7ed] text-[#d97706]",
      progressTone: "bg-[#f59e0b]",
    };
  }
  if (participant.status === "submitted" || participant.status === "graded") {
    return {
      label: "Submitted",
      tone: "border-[#bce9ca] bg-[#eefcf3] text-[#22b454]",
      progressTone: "bg-[#22c55e]",
    };
  }
  return {
    label: participant.status === "late" ? "Late" : "Normal",
    tone: "border-[#bdd2ff] bg-[#eef4ff] text-[#3566ff]",
    progressTone: "bg-[#22c55e]",
  };
}

function formatParticipantEvidence(participant: ExamRosterParticipant) {
  if (!participant.latestEvent) {
    return "No suspicious activity recorded.";
  }

  const sourceLabel =
    participant.latestEvent.eventSource === "browser_camera"
      ? "camera"
      : participant.latestEvent.eventSource === "browser"
        ? "browser"
        : (participant.latestEvent.eventSource ?? "unknown");

  return `${participant.latestEvent.label} via ${sourceLabel} · ${participant.eventCount} events`;
}

function SummaryStatCard({
  icon,
  label,
  value,
  tone,
  action,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "success" | "primary" | "danger";
  action?: ReactNode;
}) {
  const styles = {
    neutral: "text-slate-900",
    success: "text-[#22b454]",
    primary: "text-[#3566ff]",
    danger: "text-[#ff5b57]",
  }[tone];

  return (
    <div className="rounded-[28px] border border-[#eadcdc] bg-white px-5 py-5 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex items-center gap-2 text-[15px] font-medium ${styles}`}>
          <span className="grid size-6 place-items-center">{icon}</span>
          {label}
        </div>
        {action}
      </div>
      <div className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
        {value}
      </div>
    </div>
  );
}

function AttendanceDonut({ progress }: { progress: number }) {
  const gradientId = useId();
  const safeProgress = Math.min(100, Math.max(0, progress));
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className="relative flex h-[96px] w-[96px] items-center justify-center"
      aria-label={`Attendance ${safeProgress}%`}>
      <svg width="96" height="96" className="rotate-[-48deg]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb257" />
            <stop offset="100%" stopColor="#ff9e2f" />
          </linearGradient>
        </defs>
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="#ffdcb4"
          strokeWidth="14"
          fill="none"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
          {safeProgress}%
        </span>
      </div>
    </div>
  );
}

function useExamCountdown(exam: Exam, roster: ExamRosterDetail | null) {
  const finishAt = useMemo(() => {
    if (roster?.finishedAt) return roster.finishedAt;
    if (exam.finishedAt) return exam.finishedAt;
    if (exam.examStartedAt && exam.duration) {
      return new Date(
        new Date(exam.examStartedAt).getTime() + exam.duration * 60_000,
      ).toISOString();
    }
    return null;
  }, [exam.duration, exam.examStartedAt, exam.finishedAt, roster?.finishedAt]);

  const [countdown, setCountdown] = useState("--");

  useEffect(() => {
    if (!finishAt) {
      setCountdown("--");
      return;
    }

    const update = () => {
      const diff = Math.max(new Date(finishAt).getTime() - Date.now(), 0);
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setCountdown(
        [hours, minutes, seconds]
          .map((v) => String(v).padStart(2, "0"))
          .join(":"),
      );
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [finishAt]);

  return countdown;
}

export default function TeacherScheduleDetailPanel({
  exam,
  roster,
  rosterLoading,
  attendanceJoined,
  attendanceSubmitted,
  onBack,
  onCopyCode,
}: {
  exam: Exam;
  roster: ExamRosterDetail | null;
  rosterLoading: boolean;
  attendanceJoined: number;
  attendanceSubmitted: number;
  onBack: () => void;
  onCopyCode?: CopyCodeHandler;
}) {
  const countdown = useExamCountdown(exam, roster);
  const participants = roster?.participants ?? [];
  const expectedCount = Math.max(
    roster?.expectedStudentsCount ?? exam.expectedStudentsCount ?? 0,
    participants.length,
  );
  const flaggedCount = participants.filter(
    (participant) =>
      participant.riskLevel !== "low" ||
      participant.isFlagged ||
      participant.flagCount > 0,
  ).length;
  const normalCount = Math.max(
    participants.length - attendanceSubmitted - flaggedCount,
    0,
  );
  const attendanceRate =
    expectedCount > 0
      ? Math.round((attendanceJoined / expectedCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ee] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#f8fafc]">
            <ChevronLeft className="size-4" />
            Back to schedule
          </button>
          <h2 className={sectionTitleClass}>Exam Monitoring</h2>
          <p className="mt-2 max-w-4xl text-[15px] leading-7 text-slate-500">
            Live roster status now includes risk level, last suspicious reason,
            and recent evidence so disqualification decisions stay manual but
            informed.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryStatCard
          icon={<Clipboard className="size-5" />}
          label="Room code"
          value={exam.roomCode || "--"}
          tone="neutral"
          action={
            exam.roomCode ? (
              <RoomCodeCopyButton
                code={exam.roomCode}
                onCopyCode={onCopyCode}
                className="size-9"
              />
            ) : null
          }
        />
        <SummaryStatCard
          icon={<CheckCircle2 className="size-5" />}
          label="Submitted"
          value={String(attendanceSubmitted)}
          tone="success"
        />
        <SummaryStatCard
          icon={<CalendarDays className="size-5" />}
          label="Normal"
          value={String(normalCount)}
          tone="primary"
        />
        <SummaryStatCard
          icon={<AlertCircle className="size-5" />}
          label="Risky"
          value={String(flaggedCount)}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[32px] border border-[#eadcdc] bg-white shadow-[0_22px_40px_-34px_rgba(15,23,42,0.22)]">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 border-b border-[#efdfdf] px-6 py-4 text-[13px] font-medium text-[#a58d8d]">
            <div>Student</div>
            <div>Code</div>
            <div>Score</div>
            <div>Progress</div>
            <div>Submitted</div>
            <div>Status</div>
          </div>
          <div className="divide-y divide-[#f4e7e7]">
            {rosterLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 px-6 py-5">
                  {Array.from({ length: 6 }).map((__, cellIndex) => (
                    <Skeleton
                      key={cellIndex}
                      className="h-6 rounded-full border border-[#edf2fb]"
                    />
                  ))}
                </div>
              ))
            ) : participants.length === 0 ? (
              <div className="px-6 py-8">
                <TeacherEmptyState
                  icon={<UsersRound className="h-5 w-5" />}
                  title="No students have joined yet"
                  description="Joined students will appear here with live progress and risk signals."
                />
              </div>
            ) : (
              participants.map((participant) => {
                const meta = getParticipantMeta(participant);
                return (
                  <div
                    key={participant.sessionId}
                    className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 px-6 py-5 text-[15px] text-slate-800">
                    <div>
                      <div className="font-medium">
                        {participant.studentName}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatParticipantEvidence(participant)}
                      </div>
                      {participant.lastViolationAt && (
                        <div className="mt-1 text-xs text-slate-400">
                          Last flagged{" "}
                          {formatDateTime(participant.lastViolationAt)}
                        </div>
                      )}
                    </div>
                    <div>{participant.studentCode || "--"}</div>
                    <div>
                      {participant.score !== null &&
                      participant.score !== undefined
                        ? `${participant.score}/${participant.totalQuestions || "--"}`
                        : "Not submitted"}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-[6px] w-[120px] overflow-hidden rounded-full bg-[#dcefdc]">
                        <div
                          className={`h-full rounded-full ${meta.progressTone}`}
                          style={{ width: `${participant.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {participant.progressPercent}%
                      </span>
                    </div>
                    <div className="text-slate-500">
                      {participant.submittedAt
                        ? formatDateTime(participant.submittedAt)
                        : "Not submitted"}
                    </div>
                    <div className="space-y-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${meta.tone}`}>
                        {meta.label}
                      </span>
                      <div className="text-xs text-slate-500">
                        Risk {participant.riskLevel} · Score{" "}
                        {participant.violationScore}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-[#efdfdf] px-6 py-4 text-sm text-slate-500">
            Total {expectedCount} students
          </div>
        </div>

        <div className="space-y-4">
          <SummaryStatCard
            icon={<Clock3 className="size-5" />}
            label="Time remaining"
            value={countdown}
            tone="neutral"
          />
          <div className="rounded-[32px] border border-[#ddd7cf] bg-white px-7 py-6 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.22)]">
            <div className="flex items-center justify-between gap-5">
              <div className="min-w-0 space-y-3">
                <div className="text-[18px] font-semibold tracking-[-0.03em] text-slate-900">
                  Attendance
                </div>
                <div className="text-[14px] text-[#a3a3a3]">
                  Joined {attendanceJoined} of {expectedCount}
                </div>
              </div>
              <div className="shrink-0">
                <AttendanceDonut progress={attendanceRate} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
