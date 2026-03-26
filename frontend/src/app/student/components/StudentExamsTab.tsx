import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import type { Exam } from "../types";
import { formatDate, gradeFromPercentage } from "../utils";
import StudentExamCautionPanel from "./StudentExamCautionPanel";
import StudentExamDetailHeader from "./StudentExamDetailHeader";
import StudentExamRulesPanel from "./StudentExamRulesPanel";
import StudentExamTimingPanel from "./StudentExamTimingPanel";
import StudentJoinExamPanel from "./StudentJoinExamPanel";
import { formatClock, subjectFromExam } from "./student-exams-helpers";

type StudentExamsTabProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
  selectedExam: Exam | null;
  onStartExam: () => void;
  onClearSelection: () => void;
  teacherName?: string | null;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

export default function StudentExamsTab({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinLoading,
  joinError,
  onLookup,
  selectedExam,
  onStartExam,
  onClearSelection,
  teacherName,
  studentHistory,
}: StudentExamsTabProps) {
  const [rulesOpen, setRulesOpen] = useState(true);

  const examMeta = useMemo(() => {
    if (!selectedExam) return null;

    const start = new Date(selectedExam.scheduledAt ?? selectedExam.createdAt);
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const end = new Date(
      safeStart.getTime() + (selectedExam.duration ?? 45) * 60 * 1000,
    );

    return {
      subject: subjectFromExam(selectedExam),
      status: selectedExam.examStartedAt ? "Идэвхтэй" : "Бэлэн",
      teacher: teacherName?.trim() || "EduCore баг",
      room: selectedExam.roomCode || "Нээлттэй",
      dateLabel: formatDate(safeStart.toISOString()),
      startLabel: formatClock(safeStart),
      endLabel: formatClock(end),
      durationLabel: `${selectedExam.duration ?? 45} минут`,
      examStatusMessage: joinError || "Та энэ шалгалтыг эхлүүлэхэд бэлэн байна.",
    };
  }, [joinError, selectedExam, teacherName]);

  const canStart = !joinError && !selectedExam?.examStartedAt;

  if (!selectedExam || !examMeta) {
    return (
      <StudentJoinExamPanel
        loading={loading}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        joinLoading={joinLoading}
        joinError={joinError}
        onLookup={onLookup}
        studentHistory={studentHistory}
      />
    );
  }

  return (
    <section className="w-full space-y-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
        Шалгалтын дэлгэрэнгүй
      </div>

      <StudentExamDetailHeader
        title={selectedExam.title}
        subject={examMeta.subject}
        status={examMeta.status}
        teacher={examMeta.teacher}
        room={examMeta.room}
        onBack={onClearSelection}
      />

      <StudentExamTimingPanel
        dateLabel={examMeta.dateLabel}
        startLabel={examMeta.startLabel}
        endLabel={examMeta.endLabel}
        durationLabel={examMeta.durationLabel}
      />

      <StudentExamRulesPanel
        rulesOpen={rulesOpen}
        setRulesOpen={setRulesOpen}
      />

      <StudentExamCautionPanel message={examMeta.examStatusMessage} />

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#5c4fe6] to-[#5148df] px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(92,79,230,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onStartExam}
        disabled={!canStart}
      >
        <Play className="h-4 w-4" />
        Шалгалт эхлүүлэх
      </button>
    </section>
  );
}
