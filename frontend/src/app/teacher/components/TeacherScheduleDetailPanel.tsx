import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clipboard,
  Clock3,
} from "lucide-react";
import type { Exam, ExamRosterDetail, ExamRosterParticipant } from "../types";
import { sectionTitleClass } from "../styles";
import { formatDateTime } from "../utils";

function getParticipantMeta(participant: ExamRosterParticipant) {
  if (participant.isFlagged || participant.flagCount > 0) {
    return {
      label: "Зөрчил",
      tone: "border-[#ffb8b8] bg-[#fff1f1] text-[#ff5b57]",
      progressTone: "bg-[#b7bcc6]",
    };
  }
  if (participant.status === "submitted" || participant.status === "graded") {
    return {
      label: "Илгээсэн",
      tone: "border-[#bce9ca] bg-[#eefcf3] text-[#22b454]",
      progressTone: "bg-[#22c55e]",
    };
  }
  return {
    label: participant.status === "late" ? "Хоцорсон" : "Хэвийн",
    tone: "border-[#bdd2ff] bg-[#eef4ff] text-[#3566ff]",
    progressTone: "bg-[#22c55e]",
  };
}

function SummaryStatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "neutral" | "success" | "primary" | "danger";
}) {
  const styles = {
    neutral: "text-slate-900",
    success: "text-[#22b454]",
    primary: "text-[#3566ff]",
    danger: "text-[#ff5b57]",
  }[tone];

  return (
    <div className="rounded-[28px] border border-[#eadcdc] bg-white px-5 py-5 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.22)]">
      <div className={`flex items-center gap-2 text-[15px] font-medium ${styles}`}>
        <span className="grid size-6 place-items-center">{icon}</span>
        {label}
      </div>
      <div className="mt-4 text-[24px] font-semibold tracking-[-0.03em] text-slate-900">
        {value}
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

  const [countdown, setCountdown] = useState("—");

  useEffect(() => {
    if (!finishAt) {
      setCountdown("—");
      return;
    }

    const update = () => {
      const diff = Math.max(new Date(finishAt).getTime() - Date.now(), 0);
      const hours = Math.floor(diff / 3_600_000);
      const minutes = Math.floor((diff % 3_600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setCountdown([hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":"));
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
}: {
  exam: Exam;
  roster: ExamRosterDetail | null;
  rosterLoading: boolean;
  attendanceJoined: number;
  attendanceSubmitted: number;
  onBack: () => void;
}) {
  const countdown = useExamCountdown(exam, roster);
  const participants = roster?.participants ?? [];
  const flaggedCount = participants.filter((participant) => participant.isFlagged || participant.flagCount > 0).length;
  const normalCount = Math.max(participants.length - attendanceSubmitted - flaggedCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-[#d7e0ee] bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-[#f8fafc]"
          >
            <ChevronLeft className="size-4" />
            Хуваарь руу буцах
          </button>
          <h2 className={sectionTitleClass}>Шалгалтын үйл явц</h2>
          <p className="mt-2 max-w-4xl text-[15px] leading-7 text-slate-500">
            Сурагчид зөрчил (хуулах) үйлдэл гаргасан тохиолдолд танд мэдэгдэл ирж, системд бүртгэгдэхийг анхаарна уу.
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <SummaryStatCard icon={<Clipboard className="size-5" />} label="Өрөөний код" value={exam.roomCode || "—"} tone="neutral" />
        <SummaryStatCard icon={<CheckCircle2 className="size-5" />} label="Илгээсэн" value={String(attendanceSubmitted)} tone="success" />
        <SummaryStatCard icon={<CalendarDays className="size-5" />} label="Хэвийн" value={String(normalCount)} tone="primary" />
        <SummaryStatCard icon={<AlertCircle className="size-5" />} label="Зөрчил" value={String(flaggedCount)} tone="danger" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[32px] border border-[#eadcdc] bg-white shadow-[0_22px_40px_-34px_rgba(15,23,42,0.22)]">
          <div className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 border-b border-[#efdfdf] px-6 py-4 text-[13px] font-medium text-[#a58d8d]">
            <div>Сурагчийн нэрс</div><div>Сурагчийн код</div><div>Оноо</div><div>Гүйцэтгэлийн явц</div><div>Илгээсэн цаг</div><div>Төлөв</div>
          </div>
          <div className="divide-y divide-[#f4e7e7]">
            {rosterLoading ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 px-6 py-5">
                {Array.from({ length: 6 }).map((__, cellIndex) => <div key={cellIndex} className="h-6 animate-pulse rounded-full bg-[#f3f4f7]" />)}
              </div>
            )) : participants.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-slate-400">Одоогоор шалгалтад орсон сурагч алга.</div>
            ) : participants.map((participant) => {
              const meta = getParticipantMeta(participant);
              return (
                <div key={participant.sessionId} className="grid grid-cols-[1.2fr_0.9fr_0.8fr_1fr_1fr_0.9fr] gap-4 px-6 py-5 text-[15px] text-slate-800">
                  <div className="font-medium">{participant.studentName}</div>
                  <div>{participant.studentCode || "—"}</div>
                  <div>{participant.score !== null && participant.score !== undefined ? `${participant.score}/${participant.totalQuestions || "—"}` : "Илгээгээгүй байна"}</div>
                  <div className="flex items-center gap-3">
                    <div className="h-[6px] w-[120px] overflow-hidden rounded-full bg-[#dcefdc]"><div className={`h-full rounded-full ${meta.progressTone}`} style={{ width: `${participant.progressPercent}%` }} /></div>
                    <span className="text-sm font-medium text-slate-700">{participant.progressPercent}%</span>
                  </div>
                  <div className="text-slate-500">{participant.submittedAt ? formatDateTime(participant.submittedAt) : "Илгээгээгүй байна"}</div>
                  <div><span className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${meta.tone}`}>{meta.label}</span></div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-[#efdfdf] px-6 py-4 text-sm text-slate-500">
            Нийт {Math.max(roster?.expectedStudentsCount ?? exam.expectedStudentsCount ?? 0, participants.length)} сурагч
          </div>
        </div>

        <div className="space-y-4">
          <SummaryStatCard icon={<Clock3 className="size-5" />} label="Шалгалт дуусахад" value={countdown} tone="neutral" />
          <div className="rounded-[28px] border border-[#eadcdc] bg-white px-5 py-5 shadow-[0_18px_35px_-30px_rgba(15,23,42,0.22)]">
            <div className="text-[15px] font-medium text-slate-700">Ирцийн тойм</div>
            <div className="mt-4 space-y-3 text-sm text-slate-500">
              <div className="flex items-center justify-between"><span>Орж ирсэн</span><span className="font-semibold text-slate-900">{attendanceJoined}</span></div>
              <div className="flex items-center justify-between"><span>Илгээсэн</span><span className="font-semibold text-slate-900">{attendanceSubmitted}</span></div>
              <div className="flex items-center justify-between"><span>Үлдсэн</span><span className="font-semibold text-slate-900">{Math.max((roster?.expectedStudentsCount ?? exam.expectedStudentsCount ?? 0) - attendanceJoined, 0)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
