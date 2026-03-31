import ExamCreateCard from "./ExamCreateCard";
import ExamListCard from "./ExamListCard";
import ExamScheduleCard from "./ExamScheduleCard";
import ExamStatsCards from "./ExamStatsCards";
import NotificationsCard from "./NotificationsCard";
import CheatMonitoringCard from "./CheatMonitoringCard";
import TeacherXpOverviewCard from "./TeacherXpOverviewCard";
import TeacherCardSkeleton from "./TeacherCardSkeleton";
import type { CopyCodeHandler } from "./RoomCodeCopyButton";
import type {
  CheatStudent,
  Question,
  Exam,
  NotificationItem,
  TeacherStat,
  XpLeaderboardEntry,
} from "../types";

type ExamTabProps = {
  loading: boolean;
  stats: TeacherStat[];
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  scheduleExamType: string;
  setScheduleExamType: (value: string) => void;
  scheduleClassName: string;
  setScheduleClassName: (value: string) => void;
  scheduleGroupName: string;
  setScheduleGroupName: (value: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (value: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (value: string) => void;
  scheduleExpectedStudentsCount: number;
  setScheduleExpectedStudentsCount: (value: number) => void;
  scheduleLocationPolicy: "anywhere" | "school_only";
  setScheduleLocationPolicy: (value: "anywhere" | "school_only") => void;
  scheduleLocationLabel: string;
  setScheduleLocationLabel: (value: string) => void;
  scheduleLocationLatitude: string;
  setScheduleLocationLatitude: (value: string) => void;
  scheduleLocationLongitude: string;
  setScheduleLocationLongitude: (value: string) => void;
  scheduleAllowedRadiusMeters: number;
  setScheduleAllowedRadiusMeters: (value: number) => void;
  selectedScheduleExamId: string;
  setSelectedScheduleExamId: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  roomCode: string | null;
  onSchedule: () => void;
  onCopyCode: CopyCodeHandler;
  examTitle: string;
  setExamTitle: (value: string) => void;
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "open" | "mcq";
  setQuestionType: (value: "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
  questionImageUrl?: string;
  setQuestionImageUrl: (value: string | undefined) => void;
  questionPoints: number;
  setQuestionPoints: (value: number) => void;
  questionCorrectIndex: number;
  setQuestionCorrectIndex: (value: number) => void;
  questions: Question[];
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<Question>) => void;
  updateQuestionOption: (
    id: string,
    optionIndex: number,
    value: string,
  ) => void;
  addQuestionOption: (id: string) => void;
  removeQuestionOption: (id: string, optionIndex: number) => void;
  saveExam: () => void;
  saving: boolean;
  hasUser: boolean;
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  importMcqCount: number;
  setImportMcqCount: (value: number) => void;
  importOpenCount: number;
  setImportOpenCount: (value: number) => void;
  shuffleImportedQuestions: boolean;
  setShuffleImportedQuestions: (value: boolean) => void;
  plannedQuestionCount: number;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  importLoading: boolean;
  importLoadingLabel: string | null;
  onPdfUpload: (file: File) => void;
  onImageUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
  exams: Exam[];
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  cheatStudents: CheatStudent[];
  xpLeaderboard: XpLeaderboardEntry[];
};

export default function ExamTab(props: ExamTabProps) {
  if (props.loading) {
    return (
      <>
        <ExamStatsCards loading={props.loading} stats={props.stats} />
        <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <TeacherCardSkeleton className="min-h-[320px]" rows={5} />
          <TeacherCardSkeleton className="min-h-[620px]" rows={8} />
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <TeacherCardSkeleton className="min-h-[360px]" rows={5} />
          <div className="space-y-4">
            <TeacherCardSkeleton className="min-h-[280px]" rows={4} />
            <TeacherCardSkeleton className="min-h-[320px]" rows={5} />
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <ExamStatsCards loading={props.loading} stats={props.stats} />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <ExamScheduleCard
          exams={props.exams}
          selectedScheduleExamId={props.selectedScheduleExamId}
          setSelectedScheduleExamId={props.setSelectedScheduleExamId}
          scheduleDate={props.scheduleDate}
          setScheduleDate={props.setScheduleDate}
          scheduleExamType={props.scheduleExamType}
          setScheduleExamType={props.setScheduleExamType}
          scheduleClassName={props.scheduleClassName}
          setScheduleClassName={props.setScheduleClassName}
          scheduleGroupName={props.scheduleGroupName}
          setScheduleGroupName={props.setScheduleGroupName}
          scheduleSubjectName={props.scheduleSubjectName}
          setScheduleSubjectName={props.setScheduleSubjectName}
          scheduleDescription={props.scheduleDescription}
          setScheduleDescription={props.setScheduleDescription}
          scheduleExpectedStudentsCount={props.scheduleExpectedStudentsCount}
          setScheduleExpectedStudentsCount={props.setScheduleExpectedStudentsCount}
          scheduleLocationPolicy={props.scheduleLocationPolicy}
          setScheduleLocationPolicy={props.setScheduleLocationPolicy}
          scheduleLocationLabel={props.scheduleLocationLabel}
          setScheduleLocationLabel={props.setScheduleLocationLabel}
          scheduleLocationLatitude={props.scheduleLocationLatitude}
          setScheduleLocationLatitude={props.setScheduleLocationLatitude}
          scheduleLocationLongitude={props.scheduleLocationLongitude}
          setScheduleLocationLongitude={props.setScheduleLocationLongitude}
          scheduleAllowedRadiusMeters={props.scheduleAllowedRadiusMeters}
          setScheduleAllowedRadiusMeters={props.setScheduleAllowedRadiusMeters}
          durationMinutes={props.durationMinutes}
          setDurationMinutes={props.setDurationMinutes}
          onSchedule={props.onSchedule}
        />
        <ExamCreateCard
          examTitle={props.examTitle}
          setExamTitle={props.setExamTitle}
          questionText={props.questionText}
          setQuestionText={props.setQuestionText}
          questionType={props.questionType}
          setQuestionType={props.setQuestionType}
          mcqOptions={props.mcqOptions}
          setMcqOptions={props.setMcqOptions}
          questionAnswer={props.questionAnswer}
          setQuestionAnswer={props.setQuestionAnswer}
          questionImageUrl={props.questionImageUrl}
          setQuestionImageUrl={props.setQuestionImageUrl}
          questionPoints={props.questionPoints}
          setQuestionPoints={props.setQuestionPoints}
          questionCorrectIndex={props.questionCorrectIndex}
          setQuestionCorrectIndex={props.setQuestionCorrectIndex}
          questions={props.questions}
          addQuestion={props.addQuestion}
          removeQuestion={props.removeQuestion}
          updateQuestion={props.updateQuestion}
          updateQuestionOption={props.updateQuestionOption}
          addQuestionOption={props.addQuestionOption}
          removeQuestionOption={props.removeQuestionOption}
          saveExam={props.saveExam}
          saving={props.saving}
          hasUser={props.hasUser}
          pdfUseOcr={props.pdfUseOcr}
          setPdfUseOcr={props.setPdfUseOcr}
          answerKeyPage={props.answerKeyPage}
          setAnswerKeyPage={props.setAnswerKeyPage}
          importMcqCount={props.importMcqCount}
          setImportMcqCount={props.setImportMcqCount}
          importOpenCount={props.importOpenCount}
          setImportOpenCount={props.setImportOpenCount}
          shuffleImportedQuestions={props.shuffleImportedQuestions}
          setShuffleImportedQuestions={props.setShuffleImportedQuestions}
          plannedQuestionCount={props.plannedQuestionCount}
          pdfLoading={props.pdfLoading}
          pdfError={props.pdfError}
          importError={props.importError}
          importLoading={props.importLoading}
          importLoadingLabel={props.importLoadingLabel}
          onPdfUpload={props.onPdfUpload}
          onImageUpload={props.onImageUpload}
          onDocxUpload={props.onDocxUpload}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ExamListCard exams={props.exams} onCopyCode={props.onCopyCode} />
        <div className="space-y-4">
          <TeacherXpOverviewCard students={props.xpLeaderboard} />
          <NotificationsCard
            notifications={props.notifications}
            onMarkRead={props.onMarkNotificationRead}
          />
          <CheatMonitoringCard students={props.cheatStudents} />
        </div>
      </section>
    </>
  );
}
