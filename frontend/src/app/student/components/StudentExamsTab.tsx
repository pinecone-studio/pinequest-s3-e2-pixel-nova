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
  const [rulesOpen, setRulesOpen] = useState(true);
  const [countdown, setCountdown] = useState<string>("00:00:00");

  const examMeta = useMemo(() => {
    if (!selectedExam) return null;

    const start = new Date(selectedExam.scheduledAt ?? selectedExam.createdAt);
    const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
    const end = new Date(
      safeStart.getTime() + (selectedExam.duration ?? 45) * 60 * 1000,
    );
    const isUpcoming = safeStart.getTime() > Date.now();

    return {
      subject: subjectFromExam(selectedExam),
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
        "Pinecone баг",
      room: selectedExam.roomCode || "Нээлттэй",
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

  const canStart = !joinError && !examMeta?.isUpcoming;

  useEffect(() => {
    if (!examMeta?.isUpcoming || !examMeta.scheduledAt) {
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
  }, [examMeta?.isUpcoming, examMeta?.scheduledAt]);

  if (!selectedExam || !examMeta) {
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
