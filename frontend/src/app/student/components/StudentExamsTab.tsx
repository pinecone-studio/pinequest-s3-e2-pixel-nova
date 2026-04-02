import { useEffect, useState } from "react";
import type { Exam } from "../types";
import StudentExamDetailSection from "./StudentExamDetailSection";
import StudentExamStartGuideModal from "./StudentExamStartGuideModal";
import StudentJoinExamPanel from "./StudentJoinExamPanel";

type StudentExamsTabProps = {
  loading: boolean;
  exams?: Exam[];
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
  selectedExam: Exam | null;
  startingExam: boolean;
  onStartExam: () => void;
  onClearSelection: () => void;
  onSelectExam?: (exam: Exam) => void;
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
  exams = [],
  roomCodeInput,
  setRoomCodeInput,
  joinLoading,
  joinError,
  onLookup,
  selectedExam,
  startingExam,
  onStartExam,
  onClearSelection,
  onSelectExam = () => undefined,
  teacherName,
  studentHistory,
}: StudentExamsTabProps) {
  const [showStartGuide, setShowStartGuide] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);

  useEffect(() => {
    setShowStartGuide(false);
    setGuideStepIndex(0);
  }, [selectedExam?.id]);

  if (!selectedExam) {
    return (
      <StudentJoinExamPanel
        loading={loading}
        roomCodeInput={roomCodeInput}
        setRoomCodeInput={setRoomCodeInput}
        joinLoading={joinLoading}
        joinError={joinError}
        onLookup={onLookup}
        selectedExam={selectedExam}
        upcomingExams={exams}
        onSelectUpcomingExam={onSelectExam}
        studentHistory={studentHistory}
      />
    );
  }

  return (
    <>
      <StudentExamDetailSection
        selectedExam={selectedExam}
        joinError={joinError}
        teacherName={teacherName}
        onBack={onClearSelection}
        onPrimaryAction={() => {
          setGuideStepIndex(0);
          setShowStartGuide(true);
        }}
        primaryActionLabel="Шалгалт эхлүүлэх"
        primaryActionDisabled={startingExam}
        maxWidthClassName="max-w-[1088px]"
      />
      <StudentExamStartGuideModal
        open={showStartGuide}
        stepIndex={guideStepIndex}
        totalSteps={4}
        submitting={startingExam}
        onClose={() => {
          if (startingExam) return;
          setShowStartGuide(false);
          setGuideStepIndex(0);
        }}
        onNext={() => setGuideStepIndex((current) => Math.min(current + 1, 3))}
        onStart={() => {
          void onStartExam();
        }}
      />
    </>
  );
}
