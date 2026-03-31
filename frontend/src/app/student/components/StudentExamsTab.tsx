import type { Exam } from "../types";
import StudentJoinExamPanel from "./StudentJoinExamPanel";
import StudentExamDetailSection from "./StudentExamDetailSection";

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
  if (!selectedExam) {
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
    <StudentExamDetailSection
      selectedExam={selectedExam}
      joinError={joinError}
      teacherName={teacherName}
      onBack={onClearSelection}
      onPrimaryAction={onStartExam}
      primaryActionLabel="Start Exam"
    />
  );
}
