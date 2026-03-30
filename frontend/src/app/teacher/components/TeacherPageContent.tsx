import { useRouter } from "next/navigation";
import ExamListCard from "./ExamListCard";
import ExamScheduleCard from "./ExamScheduleCard";
import ResultsTab from "./ResultsTab";
import TeacherStudentsTab from "./TeacherStudentsTab";
import TeacherXpOverviewCard from "./TeacherXpOverviewCard";
import TeacherPageSkeleton from "./TeacherPageSkeleton";
import type { useExamAttendanceStats } from "../hooks/useExamAttendanceStats";
import type { useExamManagement } from "../hooks/useExamManagement";
import type { useExamStats } from "../hooks/useExamStats";
import type { useTeacherData } from "../hooks/useTeacherData";

const contentCanvasClass =
  "rounded-[40px] border border-[#dce5ef] bg-white/92 p-6 shadow-[0_35px_60px_-42px_rgba(15,23,42,0.2)] backdrop-blur xl:p-8";

export type TeacherTab = "Хуваарь" | "Шалгалтын сан" | "Гүйцэтгэл";

type TeacherPageContentProps = {
  activeTab: TeacherTab;
  setActiveTab: (tab: TeacherTab) => void;
  showScheduleForm: boolean;
  setShowScheduleForm: (value: boolean | ((prev: boolean) => boolean)) => void;
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

function TeacherScheduleModal({
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
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/22 px-4 py-6 backdrop-blur-sm transition-all duration-300 sm:px-6 sm:py-8"
      onClick={onClose}>
      <div
        className="w-full max-w-lg transition-all duration-500 ease-out motion-safe:translate-y-0"
        onClick={(e) => e.stopPropagation()}>
        <ExamScheduleCard
          exams={data.exams}
          selectedScheduleExamId={management.selectedScheduleExamId}
          setSelectedScheduleExamId={management.setSelectedScheduleExamId}
          scheduleDate={management.scheduleDate}
          setScheduleDate={management.setScheduleDate}
          scheduleExamType={management.scheduleExamType}
          setScheduleExamType={management.setScheduleExamType}
          scheduleClassName={management.scheduleClassName}
          setScheduleClassName={management.setScheduleClassName}
          scheduleGroupName={management.scheduleGroupName}
          setScheduleGroupName={management.setScheduleGroupName}
          scheduleSubjectName={management.scheduleSubjectName}
          setScheduleSubjectName={management.setScheduleSubjectName}
          scheduleDescription={management.scheduleDescription}
          setScheduleDescription={management.setScheduleDescription}
          durationMinutes={management.durationMinutes}
          setDurationMinutes={management.setDurationMinutes}
          onSchedule={management.handleSchedule}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default function TeacherPageContent({
  activeTab,
  setActiveTab,
  showScheduleForm,
  setShowScheduleForm,
  data,
  management,
  examStatsState,
  attendance,
  studentProfile,
  profileLoading,
}: TeacherPageContentProps) {
  const router = useRouter();

  if (data.loading && activeTab !== "Гүйцэтгэл") {
    return <TeacherPageSkeleton />;
  }

  if (activeTab === "Шалгалтын сан") {
    return (
      <ExamListCard
        exams={data.exams}
        onCopyCode={management.copyCode}
        onCreateExam={() => router.push(`/teacher/createExam`)}
        onOpenExam={(examId) => {
          setActiveTab("Гүйцэтгэл");
          examStatsState.setSelectedExamId(examId);
        }}
      />
    );
  }

  if (activeTab === "Гүйцэтгэл") {
    return (
      <section className={contentCanvasClass}>
        <div className="space-y-6">
          <TeacherXpOverviewCard students={examStatsState.xpLeaderboard} />
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
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <TeacherStudentsTab
        exams={data.exams}
        loading={data.loading}
        onAddSchedule={() => setShowScheduleForm((prev) => !prev)}
        currentUserId={data.currentUser?.id ?? null}
        onCopyCode={management.copyCode}
      />
      <TeacherScheduleModal
        show={showScheduleForm}
        onClose={() => setShowScheduleForm(false)}
        data={data}
        management={management}
      />
    </div>
  );
}
