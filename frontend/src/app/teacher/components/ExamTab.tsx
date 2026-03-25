import ExamCreateCard from "./ExamCreateCard";
import ExamListCard from "./ExamListCard";
import ExamScheduleCard from "./ExamScheduleCard";
import ExamStatsCards from "./ExamStatsCards";
import NotificationsCard from "./NotificationsCard";
import CheatMonitoringCard from "./CheatMonitoringCard";
import type { CheatStudent, Question, Exam, NotificationItem } from "../types";

type ExamTabProps = {
  loading: boolean;
  stats: { label: string; value: string; trend: string }[];
  scheduleTitle: string;
  setScheduleTitle: (value: string) => void;
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  roomCode: string | null;
  onSchedule: () => void;
  onCopyCode: (code: string) => void;
  examTitle: string;
  setExamTitle: (value: string) => void;
  questionText: string;
  setQuestionText: (value: string) => void;
  questionType: "text" | "open" | "mcq";
  setQuestionType: (value: "text" | "open" | "mcq") => void;
  mcqOptions: string[];
  setMcqOptions: (value: string[]) => void;
  questionAnswer: string;
  setQuestionAnswer: (value: string) => void;
  questions: Question[];
  addQuestion: () => void;
  removeQuestion: (id: string) => void;
  saveExam: () => void;
  pdfUseOcr: boolean;
  setPdfUseOcr: (value: boolean) => void;
  answerKeyPage: number | "last";
  setAnswerKeyPage: (value: number | "last") => void;
  pdfLoading: boolean;
  pdfError: string | null;
  importError: string | null;
  onPdfUpload: (file: File) => void;
  onCsvUpload: (file: File) => void;
  onDocxUpload: (file: File) => void;
  exams: Exam[];
  notifications: NotificationItem[];
  onMarkNotificationRead: (index: number) => void;
  cheatStudents: CheatStudent[];
};

export default function ExamTab(props: ExamTabProps) {
  return (
    <>
      <ExamStatsCards loading={props.loading} stats={props.stats} />
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <ExamScheduleCard
          scheduleTitle={props.scheduleTitle}
          setScheduleTitle={props.setScheduleTitle}
          scheduleDate={props.scheduleDate}
          setScheduleDate={props.setScheduleDate}
          durationMinutes={props.durationMinutes}
          setDurationMinutes={props.setDurationMinutes}
          roomCode={props.roomCode}
          onSchedule={props.onSchedule}
          onCopyCode={props.onCopyCode}
        />
        <ExamCreateCard
          examTitle={props.examTitle}
          setExamTitle={props.setExamTitle}
          durationMinutes={props.durationMinutes}
          setDurationMinutes={props.setDurationMinutes}
          questionText={props.questionText}
          setQuestionText={props.setQuestionText}
          questionType={props.questionType}
          setQuestionType={props.setQuestionType}
          mcqOptions={props.mcqOptions}
          setMcqOptions={props.setMcqOptions}
          questionAnswer={props.questionAnswer}
          setQuestionAnswer={props.setQuestionAnswer}
          questions={props.questions}
          addQuestion={props.addQuestion}
          removeQuestion={props.removeQuestion}
          saveExam={props.saveExam}
          pdfUseOcr={props.pdfUseOcr}
          setPdfUseOcr={props.setPdfUseOcr}
          answerKeyPage={props.answerKeyPage}
          setAnswerKeyPage={props.setAnswerKeyPage}
          pdfLoading={props.pdfLoading}
          pdfError={props.pdfError}
          importError={props.importError}
          onPdfUpload={props.onPdfUpload}
          onCsvUpload={props.onCsvUpload}
          onDocxUpload={props.onDocxUpload}
        />
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ExamListCard exams={props.exams} onCopyCode={props.onCopyCode} />
        <div className="space-y-4">
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
