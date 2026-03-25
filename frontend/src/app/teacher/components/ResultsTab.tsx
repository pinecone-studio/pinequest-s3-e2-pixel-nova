import ResultsSummaryCard from "./ResultsSummaryCard";
import ResultsCharts from "./ResultsCharts";
import ResultsSubmissionsList from "./ResultsSubmissionsList";
import ResultsDetailPanel from "./ResultsDetailPanel";
import type { Exam, Submission } from "../types";

type ResultsTabProps = {
  examOptions: Exam[];
  activeExamId: string | null;
  onSelectExam: (value: string) => void;
  examStats: {
    average: number;
    mostMissed?: { text: string };
    mostCorrect?: { text: string };
    scoreDistribution: { name: string; score: number }[];
    correctTotal: number;
    incorrectTotal: number;
  } | null;
  submissions: Submission[];
  onSelectSubmission: (id: string) => void;
  selectedSubmission: Submission | null;
  selectedExam: Exam | null;
};

export default function ResultsTab({
  examOptions,
  activeExamId,
  onSelectExam,
  examStats,
  submissions,
  onSelectSubmission,
  selectedSubmission,
  selectedExam,
}: ResultsTabProps) {
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
        />
        <ResultsDetailPanel
          selectedSubmission={selectedSubmission}
          selectedExam={selectedExam}
        />
      </section>
    </section>
  );
}
