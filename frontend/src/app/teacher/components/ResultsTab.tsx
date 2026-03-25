import ResultsSummaryCard from "./ResultsSummaryCard";
import ResultsCharts from "./ResultsCharts";
import ResultsSubmissionsList from "./ResultsSubmissionsList";
import ResultsDetailPanel from "./ResultsDetailPanel";
import TeacherCardSkeleton from "./TeacherCardSkeleton";
import type { Exam, Submission } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";

type ResultsTabProps = {
  loading: boolean;
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: ExamStatsSummary | null;
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
  selectedSubmissionId: string | null;
  selectedSubmission: Submission | null;
  selectedExam: Exam | null;
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
  studentProfile,
  profileLoading,
}: ResultsTabProps) {
  if (loading) {
    return (
      <section className="grid gap-4">
        <TeacherCardSkeleton className="min-h-[280px]" rows={4} />
        <div className="grid gap-4 lg:grid-cols-2">
          <TeacherCardSkeleton className="min-h-[360px]" rows={5} />
          <TeacherCardSkeleton className="min-h-[360px]" rows={5} />
        </div>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <TeacherCardSkeleton className="min-h-[340px]" rows={5} />
          <TeacherCardSkeleton className="min-h-[340px]" rows={5} />
        </section>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <ResultsSummaryCard
        examOptions={examOptions}
        activeExamId={activeExamId}
        onSelectExam={onSelectExam}
        examStats={examStats}
      />
      <ResultsCharts examStats={examStats} />
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ResultsSubmissionsList
          submissions={submissions}
          onSelect={onSelectSubmission}
          selectedSubmissionId={selectedSubmissionId}
        />
        <ResultsDetailPanel
          selectedSubmission={selectedSubmission}
          selectedExam={selectedExam}
          studentProfile={studentProfile}
          profileLoading={profileLoading}
        />
      </section>
    </section>
  );
}
