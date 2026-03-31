import { useState } from "react";
import ExamListCard from "./ExamListCard";
import ExamCreateCard from "./ExamCreateCard";
import ResultsTab from "./ResultsTab";
import TeacherStudentsTab from "./TeacherStudentsTab";
import TeacherXpOverviewCard from "./TeacherXpOverviewCard";
import TeacherPageSkeleton from "./TeacherPageSkeleton";
import type { useExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import { useExamImport } from "../hooks/useExamImport";
import type { useExamManagement } from "../hooks/useExamManagement";
import type { useExamStats } from "../hooks/useExamStats";
import type { useTeacherData } from "../hooks/useTeacherData";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreateExamDialogContent from "./CreateExamDialogContent";

const contentCanvasClass =
  "rounded-[40px] border border-[#dce5ef] bg-white/92 p-6 shadow-[0_35px_60px_-42px_rgba(15,23,42,0.2)] backdrop-blur xl:p-8";

export type TeacherTab = "Хуваарь" | "Шалгалтын сан" | "Гүйцэтгэл";

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
  const imports = useExamImport({
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
  setActiveTab,
  onOpenScheduleForm,
  data,
  management,
  examStatsState,
  attendance,
  studentProfile,
  profileLoading,
}: TeacherPageContentProps) {
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);

  if (data.loading && activeTab !== "Гүйцэтгэл") {
    return <TeacherPageSkeleton />;
  }

  if (activeTab === "Шалгалтын сан") {
    return (
      <>
        <ExamListCard
          exams={data.exams}
          onCopyCode={management.copyCode}
          onCreateExam={() => setShowCreateExamModal(true)}
          onOpenExam={(examId) => {
            setActiveTab("Гүйцэтгэл");
            examStatsState.setSelectedExamId(examId);
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
      <section className={contentCanvasClass}>
        <div className="space-y-6">
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
          <TeacherXpOverviewCard students={examStatsState.xpLeaderboard} />
        </div>
      </section>
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
