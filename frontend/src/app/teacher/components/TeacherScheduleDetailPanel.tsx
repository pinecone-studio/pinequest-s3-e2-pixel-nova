import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import TeacherEmptyState from "./TeacherEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

const formatCompactDateTime = (value?: string | null) => {
  if (!value) return "Илгэээгээгүй байна";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Илгэээгээгүй байна";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const lookup = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  const year = lookup("year");
  const month = lookup("month");
  const day = lookup("day");
  const hour = lookup("hour");
  const minute = lookup("minute");

  return `${year}.${month}.${day}-${hour}:${minute}`;
};

function getParticipantMeta(participant: ExamRosterParticipant) {
  if (
    participant.riskLevel === "critical" ||
    participant.riskLevel === "high" ||
    participant.isFlagged ||
    participant.flagCount > 0
  ) {
    return {
      label: participant.riskLevel === "critical" ? " Зөрчил" : "Зөрчил",
      tone: "border-[#ffb8b8] bg-[#fff4f3] text-[#ff5b57]",
      progressTone: "bg-[#c5cad3]",
    };
  }
  if (participant.riskLevel === "medium") {
    return {
      label: "Хэвийн",
      tone: "border-[#bdd2ff] bg-[#eff5ff] text-[#3566ff]",
      progressTone: "bg-[#29c15f]",
    };
  }
  if (participant.status === "submitted" || participant.status === "graded") {
    return {
      label: "Илгээсэн",
      tone: "border-[#bce9ca] bg-[#eefcf3] text-[#22b454]",
      progressTone: "bg-[#29c15f]",
    };
  }
  return {
    label: participant.status === "late" ? "Хоцорсон" : "Хэвийн",
    tone: "border-[#bdd2ff] bg-[#eff5ff] text-[#3566ff]",
    progressTone: "bg-[#29c15f]",
  };
}

function formatParticipantEvidence(participant: ExamRosterParticipant) {
  if (!participant.latestEvent) {
    return {
      summary: "Зөрчил бүртгэгдээгүй",
    };
  }

  const sourceLabel =
    participant.latestEvent.eventSource === "browser_camera"
      ? "камер"
      : participant.latestEvent.eventSource === "browser"
        ? "browser"
        : (participant.latestEvent.eventSource ?? "unknown");

  return {
    summary: [
      `${participant.latestEvent.label} · ${sourceLabel}`,
      `${participant.eventCount} үйлдэл`,
    ]
      .filter(Boolean)
      .join(" · "),
  };
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
          className={`flex items-center gap-2 text-[15px] font-medium ${styles}`}
        >
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

function useExamCountdown(exam: Exam, roster: ExamRosterDetail | null) {
  const isFinished = Boolean(
    roster?.finishedAt || exam.finishedAt || exam.status === "finished",
  );
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
    if (isFinished) {
      setCountdown("Дууссан");
      return;
    }

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
  }, [finishAt, isFinished]);

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
  const submittedStatuses = new Set(["submitted", "graded"]);
  const flaggedCount = participants.filter(
    (participant) =>
      participant.riskLevel !== "low" ||
      participant.isFlagged ||
      participant.flagCount > 0,
  ).length;
  const normalCount = Math.max(participants.length - flaggedCount, 0);
  const submittedCount = participants.filter((participant) =>
    submittedStatuses.has(participant.status),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[#dbe4ef] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#f8fafc]"
          >
            <ChevronLeft className="size-4" />
            Буцах
          </button>
          <h2 className={sectionTitleClass}>Шалгалтын үйл явц</h2>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-400">
            Сурагчид зөрчил (хуулах) үйлдэл гаргасан тохиолдолд танд мэдэгдэл
            ирж, системд бүртгэгдэхийг анхаарна уу.
          </p>
        </div>

        <div className="w-full max-w-[280px] rounded-[22px] border border-[#e5e9ef] bg-white px-5 py-4 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.18)]">
          <div className="flex items-center gap-2 text-[15px] font-medium text-slate-800">
            <Clock3 className="size-4.5" />
            Шалгалт дуусахад
          </div>
          <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-slate-950">
            {countdown === "Дууссан"
              ? "Дууссан"
              : countdown === "--"
                ? "--:--"
                : countdown}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryStatCard
          icon={<Clipboard className="size-5" />}
          label="Өрөөний код"
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
          label="Илгээсэн"
          value={String(submittedCount || attendanceSubmitted)}
          tone="success"
        />
        <SummaryStatCard
          icon={<CalendarDays className="size-5" />}
          label="Хэвийн"
          value={String(normalCount)}
          tone="primary"
        />
        <SummaryStatCard
          icon={<AlertCircle className="size-5" />}
          label="Зөрчил"
          value={String(flaggedCount)}
          tone="danger"
        />
      </div>

      <div className="rounded-[28px] border border-[#e7ebf2] bg-white shadow-[0_26px_50px_-38px_rgba(15,23,42,0.2)]">
        <div className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 border-b border-[#edf1f5] px-7 py-4 text-[13px] font-medium text-slate-500">
          <div>Сурагчдийн нэрс ↑↓</div>
          <div>Сурагчийн код</div>
          <div>Оноо</div>
          <div>Гүйцэтгэлийн явц</div>
          <div>Илгээсэн цаг</div>
          <div>Төлөв</div>
        </div>
        <div className="divide-y divide-[#edf1f5]">
          {rosterLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 px-7 py-5"
              >
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
                title="Одоогоор сурагч нэвтрээгүй байна"
                description="Нэвтэрсэн сурагчид энд явц болон эрсдэлийн мэдээлэлтэй харагдана."
              />
            </div>
          ) : (
            participants.map((participant) => {
              const meta = getParticipantMeta(participant);
              const evidence = formatParticipantEvidence(participant);
              const scoreLabel =
                participant.score !== null && participant.score !== undefined
                  ? `${participant.score}/${participant.totalQuestions || "--"}`
                  : "Илгэээгээгүй байна";
              const progressBaseTone =
                participant.progressPercent === 0
                  ? "bg-[#c9ced7]"
                  : "bg-[#b6e8c7]";

              return (
                <div
                  key={participant.sessionId}
                  className="grid grid-cols-[1.35fr_1.2fr_1fr_1.2fr_1.15fr_1fr] gap-4 px-7 py-5 text-[15px] text-slate-800"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900">
                      {participant.studentName}
                    </div>
                    {evidence.summary !== "Зөрчил бүртгэгдээгүй" ? (
                      <div className="mt-2 text-sm text-slate-400">
                        {evidence.summary}
                      </div>
                    ) : null}
                  </div>
                  <div className="font-medium text-slate-900">
                    {participant.studentCode || "--"}
                  </div>
                  <div
                    className={
                      participant.score == null
                        ? "text-slate-400"
                        : "text-slate-900"
                    }
                  >
                    {scoreLabel}
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-[5px] w-[106px] overflow-hidden rounded-full ${progressBaseTone}`}
                    >
                      <div
                        className={`h-full rounded-full ${meta.progressTone}`}
                        style={{ width: `${participant.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {participant.progressPercent}%
                    </span>
                  </div>
                  <div
                    className={
                      participant.submittedAt
                        ? "text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {participant.submittedAt
                      ? formatCompactDateTime(participant.submittedAt)
                      : "Илгэээгээгүй байна"}
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="border-t border-[#edf1f5] px-7 py-4 text-sm text-slate-500">
          Нийт {expectedCount} сурагч
        </div>
      </div>
    </div>
  );
}
