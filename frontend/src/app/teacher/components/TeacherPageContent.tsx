import { useState } from "react";
import ExamListCard from "./ExamListCard";
import ExamPreviewDialog from "./ExamPreviewDialog";
import ResultsTab from "./ResultsTab";
import TeacherStudentsTab from "./TeacherStudentsTab";
import TeacherXpOverviewCard from "./TeacherXpOverviewCard";
import TeacherPageSkeleton from "./TeacherPageSkeleton";
import type { useExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import { useExamImport } from "../hooks/useExamImport";
import type { useExamManagement } from "../hooks/useExamManagement";
import type { useExamStats } from "../hooks/useExamStats";
import type { useTeacherData } from "../hooks/useTeacherData";
import { Dialog } from "@/components/ui/dialog";
import CreateExamDialogContent from "./CreateExamDialogContent";
import { contentCanvasClass } from "../styles";

export type TeacherTab = "Хуваарь" | "Шалгалтын сан" | "Гүйцэтгэл" | "XP";

const sanitizeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яөүё_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "exam";

const buildExamDownloadText = (exam: TeacherPageContentProps["data"]["exams"][number]) => {
  const header = [
    `Шалгалтын нэр: ${exam.title}`,
    exam.className ? `Анги: ${exam.className}` : null,
    exam.groupName ? `Бүлэг: ${exam.groupName}` : null,
    exam.examType ? `Төрөл: ${exam.examType}` : null,
    exam.description ? `Тайлбар: ${exam.description}` : null,
    exam.duration ? `Хугацаа: ${exam.duration} минут` : null,
    `Үүсгэсэн огноо: ${exam.createdAt}`,
    "",
    "Асуултууд",
  ].filter(Boolean);

  const questions =
    exam.questions.length > 0
      ? exam.questions.flatMap((question, index) => [
          `${index + 1}. ${question.text}`,
          `Төрөл: ${question.type}`,
          `Оноо: ${question.points ?? 1}`,
          ...(question.options?.length
            ? question.options.map(
                (option, optionIndex) => `  ${optionIndex + 1}) ${option}`,
              )
            : []),
          `Зөв хариулт: ${question.correctAnswer || "-"}`,
          "",
        ])
      : ["Асуулт оруулаагүй байна."];

  return [...header, ...questions].join("\n");
};

type TeacherPageContentProps = {
  activeTab: TeacherTab;
  setActiveTab: (tab: TeacherTab) => void;
  onOpenScheduleForm: () => void;
  data: ReturnType<typeof useTeacherData>;
  management: ReturnType<typeof useExamManagement>;
  examStatsState: ReturnType<typeof useExamStats>;
  attendance: ReturnType<typeof useExamAttendanceStats>;
  studentProfile: ReturnType<
    typeof useTeacherData
  >["studentProgress"] extends never
    ? never
    : unknown;
  profileLoading: boolean;
};

function TeacherCreateExamModal({
  show,
  onClose,
  data,
  management,
}: {
  show: boolean;
  onClose: () => void;
  data: ReturnType<typeof useTeacherData>;
  management: ReturnType<typeof useExamManagement>;
}) {
  useExamImport({
    setQuestions: management.setQuestions,
    examTitle: management.examTitle,
    setExamTitle: management.setExamTitle,
    showToast: data.showToast,
    currentUser: data.currentUser,
  });

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <CreateExamDialogContent />
    </Dialog>
  );
}

export default function TeacherPageContent({
  activeTab,
  onOpenScheduleForm,
  data,
  management,
  examStatsState,
  attendance,
  studentProfile,
  profileLoading,
}: TeacherPageContentProps) {
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [previewExamId, setPreviewExamId] = useState<string | null>(null);
  const previewExam =
    data.loading || !("exams" in data)
      ? null
      : data.exams.find((exam) => exam.id === previewExamId) ?? null;

  if (data.loading && activeTab !== "Гүйцэтгэл" && activeTab !== "XP") {
    return <TeacherPageSkeleton />;
  }

  if (activeTab === "Шалгалтын сан") {
    return (
      <>
        <ExamListCard
          exams={data.exams}
          onCopyCode={management.copyCode}
          onCreateExam={() => setShowCreateExamModal(true)}
          onOpenExam={(examId) => setPreviewExamId(examId)}
          onDownloadExam={(examId) => {
            const exam = data.exams.find((item) => item.id === examId);
            if (!exam) return;

            const blob = new Blob([buildExamDownloadText(exam)], {
              type: "text/plain;charset=utf-8",
            });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${sanitizeFileName(exam.title)}.txt`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
            data.showToast("Шалгалтыг татлаа.");
          }}
        />
        <ExamPreviewDialog
          exam={previewExam}
          open={Boolean(previewExam)}
          onOpenChange={(open) => {
            if (!open) setPreviewExamId(null);
          }}
        />
        <TeacherCreateExamModal
          show={showCreateExamModal}
          onClose={() => setShowCreateExamModal(false)}
          data={data}
          management={management}
        />
      </>
    );
  }

  if (activeTab === "Гүйцэтгэл") {
    return (
      <ResultsTab
        loading={data.loading}
        examOptions={examStatsState.examOptions}
        activeExamId={examStatsState.activeExamId}
        onSelectExam={examStatsState.setSelectedExamId}
        examStats={examStatsState.examStats}
        submissions={examStatsState.activeSubmissions}
        onSelectSubmission={examStatsState.setSelectedSubmissionId}
        selectedSubmissionId={examStatsState.selectedSubmissionId}
        selectedSubmission={examStatsState.selectedSubmission}
        selectedExam={examStatsState.selectedExam}
        attendanceStats={attendance.stats}
        attendanceLoading={attendance.loading}
        studentProfile={studentProfile as never}
        profileLoading={profileLoading}
      />
    );
  }

  if (activeTab === "XP") {
    return (
      <div className="space-y-6">
        <TeacherXpOverviewCard students={examStatsState.xpLeaderboard} />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <TeacherStudentsTab
        exams={data.exams}
        loading={data.loading}
        onAddSchedule={onOpenScheduleForm}
        currentUserId={data.currentUser?.id ?? null}
        onCopyCode={management.copyCode}
      />
    </div>
  );
}
