import { useEffect, useRef, useState } from "react";
import type { Exam } from "../types";
import StudentExamDetailSection from "./StudentExamDetailSection";
import StudentExamStartGuideModal, {
  STUDENT_EXAM_START_GUIDE_STEP_COUNT,
} from "./StudentExamStartGuideModal";
import StudentJoinExamPanel from "./StudentJoinExamPanel";

type StudentExamsTabProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
  selectedExam: Exam | null;
  startingExam: boolean;
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
  startingExam,
  onStartExam,
  onClearSelection,
  teacherName,
  studentHistory,
}: StudentExamsTabProps) {
  const autoOpenedGuideExamIdRef = useRef<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStepIndex, setGuideStepIndex] = useState(0);

  useEffect(() => {
    if (!selectedExam) {
      autoOpenedGuideExamIdRef.current = null;
      setGuideOpen(false);
      setGuideStepIndex(0);
      return;
    }

    if (joinError) {
      setGuideOpen(false);
      return;
    }

    if (autoOpenedGuideExamIdRef.current === selectedExam.id) {
      return;
    }

    autoOpenedGuideExamIdRef.current = selectedExam.id;
    setGuideStepIndex(0);
    setGuideOpen(true);
  }, [joinError, selectedExam]);

  const handleOpenGuide = () => {
    setGuideStepIndex(0);
    setGuideOpen(true);
  };

  const handleCloseGuide = () => {
    if (startingExam) {
      return;
    }
    setGuideOpen(false);
  };

  const handleStartExam = () => {
    void onStartExam();
  };

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
        onPrimaryAction={joinError ? handleStartExam : handleOpenGuide}
        primaryActionLabel={
          startingExam
            ? "Эхлүүлж байна..."
            : joinError
              ? "Дахин оролдох"
              : "Шалгалт эхлүүлэх"
        }
        primaryActionDisabled={startingExam}
        maxWidthClassName="max-w-[1088px]"
      />

      {!joinError && (
        <StudentExamStartGuideModal
          open={guideOpen}
          stepIndex={guideStepIndex}
          totalSteps={STUDENT_EXAM_START_GUIDE_STEP_COUNT}
          onNext={() =>
            setGuideStepIndex((current) =>
              Math.min(
                current + 1,
                STUDENT_EXAM_START_GUIDE_STEP_COUNT - 1,
              ),
            )
          }
          onClose={handleCloseGuide}
          onStart={handleStartExam}
          submitting={startingExam}
        />
      )}
    </>
  );
}
