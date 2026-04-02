import { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";
import type { Exam } from "../types";
import { formatDate } from "../utils";
import StudentExamCautionPanel from "./StudentExamCautionPanel";
import StudentExamDetailHeader from "./StudentExamDetailHeader";
import StudentExamTimingPanel from "./StudentExamTimingPanel";
import {
  formatClock,
  localizeExamTitle,
  subjectFromExam,
} from "./student-exams-helpers";

type StudentExamDetailSectionProps = {
  selectedExam: Exam;
  joinError?: string | null;
  teacherName?: string | null;
  onBack: () => void;
  onPrimaryAction: () => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  maxWidthClassName?: string;
};

export default function StudentExamDetailSection({
  selectedExam,
  joinError = null,
  teacherName,
  onBack,
  onPrimaryAction,
  primaryActionLabel = "Шалгалт эхлүүлэх",
  primaryActionDisabled = false,
  maxWidthClassName = "max-w-[720px]",
}: StudentExamDetailSectionProps) {
  const [countdown, setCountdown] = useState<string>("00:00:00");

  const examMeta = useMemo(() => {
    const start = new Date(selectedExam.scheduledAt ?? selectedExam.createdAt);
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const end = new Date(
      safeStart.getTime() + (selectedExam.duration ?? 45) * 60 * 1000,
    );
    const isUpcoming = safeStart.getTime() > Date.now();
    const subject = subjectFromExam(selectedExam);
    const title = localizeExamTitle(selectedExam.title, subject);
    const normalizedTitle = title.trim().replace(/\s+/g, " ").toLowerCase();
    const normalizedSubject = subject.trim().replace(/\s+/g, " ").toLowerCase();
    return {
      title,
      subtitle: normalizedTitle === normalizedSubject ? null : subject,
      status: isUpcoming
        ? "Хүлээгдэж байна"
        : selectedExam.entryStatus === "late"
          ? "Хоцорч орж байна"
          : selectedExam.examStartedAt
            ? "Идэвхтэй"
            : "Бэлэн",
      teacher:
        selectedExam.teacherName?.trim() ||
        teacherName?.trim() ||
        "Пайнкоун баг",
      secondaryLabel: "Өрөө",
      secondaryValue: selectedExam.roomCode || "Нээлттэй",
      dateLabel: formatDate(safeStart.toISOString()),
      startLabel: formatClock(safeStart),
      endLabel: formatClock(end),
      durationLabel: `${selectedExam.duration ?? 45} минут`,
      examStatusMessage: joinError
        ? joinError
        : selectedExam.entryStatus === "late"
          ? "Та энэ шалгалтад хоцорч нэвтэрч байна. Статус нь хоцорсон гэж бүртгэгдэнэ."
          : "Та энэ шалгалтыг эхлүүлэхэд бэлэн байна.",
      isUpcoming,
      scheduledAt: safeStart,
    };
  }, [joinError, selectedExam, teacherName]);

  useEffect(() => {
    if (!examMeta.isUpcoming) {
      setCountdown("00:00:00");
      return;
    }

    const timer = window.setInterval(() => {
      const diff = examMeta.scheduledAt.getTime() - Date.now();
      const safeDiff = Math.max(diff, 0);
      const hours = Math.floor(safeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((safeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((safeDiff % (1000 * 60)) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [examMeta.isUpcoming, examMeta.scheduledAt]);

  const isActionDisabled =
    primaryActionDisabled || Boolean(joinError) || examMeta.isUpcoming;

  return (
    <section className={`mx-auto w-full ${maxWidthClassName} space-y-5`}>
      <StudentExamDetailHeader
        title={examMeta.title}
        subtitle={examMeta.subtitle}
        status={examMeta.status}
        teacher={examMeta.teacher}
        secondaryLabel={examMeta.secondaryLabel}
        secondaryValue={examMeta.secondaryValue}
        onBack={onBack}
      />

      <StudentExamTimingPanel
        dateLabel={examMeta.dateLabel}
        startLabel={examMeta.startLabel}
        endLabel={examMeta.endLabel}
        durationLabel={examMeta.durationLabel}
      />

      <StudentExamCautionPanel
        requiresAudioRecording={selectedExam.requiresAudioRecording}
      />

      {examMeta.isUpcoming && (
        <div className="rounded-[22px] border border-[#dbe6ff] bg-[#f4f8ff] px-5 py-4 text-center text-sm font-semibold text-[#3659c8] shadow-[0_18px_40px_rgba(54,89,200,0.12)]">
          Шалгалт эхлэх хүртэл{" "}
          <span className="text-base font-bold">{countdown}</span>
        </div>
      )}

      <p className="px-1 text-sm text-slate-500">{examMeta.examStatusMessage}</p>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#5c4fe6] to-[#5148df] px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(92,79,230,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onPrimaryAction}
        disabled={isActionDisabled}
      >
        <Play className="h-4 w-4" />
        {primaryActionLabel}
      </button>
    </section>
  );
}
