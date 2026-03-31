import ResultsSummaryCard from "./ResultsSummaryCard";
import ResultsCharts from "./ResultsCharts";
import QuestionInsightsPanel from "./QuestionInsightsPanel";
import ResultsSubmissionsList from "./ResultsSubmissionsList";
import ResultsDetailPanel from "./ResultsDetailPanel";
import TeacherCardSkeleton from "./TeacherCardSkeleton";
import type { Exam, ExamStatsSummary, Submission } from "../types";
import type { ExamAttendanceStats } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";

type ResultsTabProps = {
  loading: boolean;
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string | null) => void;
  examStats: ExamStatsSummary | null;
  submissions: Submission[];
  onSelectSubmission: (id: string | null) => void;
  selectedSubmissionId: string | null;
  selectedSubmission: Submission | null;
  selectedExam: Exam | null;
  attendanceStats: ExamAttendanceStats | null;
  attendanceLoading: boolean;
  studentProfile: StudentProfile | null;
  profileLoading: boolean;
};

export default function ResultsTab({
  loading,
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
  submissions,
  onSelectSubmission,
  selectedSubmissionId,
  selectedSubmission,
  selectedExam,
  attendanceStats,
  attendanceLoading,
  studentProfile,
  profileLoading,
}: ResultsTabProps) {
  if (loading) {
    return (
      <section className="grid gap-4">
        <TeacherCardSkeleton className="min-h-[280px]" rows={4} />
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <TeacherCardSkeleton className="min-h-[340px]" rows={5} />
          <TeacherCardSkeleton className="min-h-[340px]" rows={5} />
        </section>
        <TeacherCardSkeleton className="min-h-[360px]" rows={5} />
        <div className="grid gap-4 lg:grid-cols-2">
          <TeacherCardSkeleton className="min-h-[280px]" rows={4} />
          <TeacherCardSkeleton className="min-h-[280px]" rows={4} />
        </div>
      </section>
    );
  }

	return (
		<section className="grid gap-6">
			<ResultsSummaryCard
				examOptions={examOptions}
				activeExamId={activeExamId}
				onSelectExam={onSelectExam}
				examStats={examStats}
			/>
			<QuestionInsightsPanel examStats={examStats} />
			<section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
				<ResultsSubmissionsList
					submissions={submissions}
					onSelect={onSelectSubmission}
					selectedSubmissionId={selectedSubmissionId}
				/>
				<ResultsDetailPanel
					selectedSubmission={selectedSubmission}
					selectedExam={selectedExam}
					examStats={examStats}
					attendanceStats={attendanceStats}
					attendanceLoading={attendanceLoading}
					studentProfile={studentProfile}
					profileLoading={profileLoading}
				/>
			</section>
			<ResultsCharts examStats={examStats} />
		</section>
	);
}
