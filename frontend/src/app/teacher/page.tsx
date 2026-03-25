"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/examGuard";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherHeader from "./components/TeacherHeader";
import ExamTab from "./components/ExamTab";
import ResultsTab from "./components/ResultsTab";
import SettingsTab from "./components/SettingsTab";
import { mockStudents } from "./types";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamImport } from "./hooks/useExamImport";
import { useExamStats } from "./hooks/useExamStats";

export default function TeacherPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<"Шалгалт" | "Дүн" | "Тохиргоо">(
    "Шалгалт",
  );

  const data = useTeacherData();
  const management = useExamManagement({
    exams: data.exams,
    setExams: data.setExams,
    showToast: data.showToast,
  });
  const imports = useExamImport({
    setQuestions: management.setQuestions,
    examTitle: management.examTitle,
    setExamTitle: management.setExamTitle,
    showToast: data.showToast,
  });
  const examStatsState = useExamStats({
    exams: data.exams,
    submissions: data.submissions,
  });

  if (!data.currentUser) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-lg">
          {data.toast}
        </div>
      )}
      <div
        className={`grid min-h-screen transition-[grid-template-columns] duration-300 ease-out ${
          sidebarCollapsed
            ? "lg:grid-cols-[72px_1fr]"
            : "lg:grid-cols-[260px_1fr]"
        }`}
      >
        <TeacherSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarTimerRef={management.sidebarTimerRef}
          currentUserName={data.currentUser.username}
        />
        <main className="px-6 py-8">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <TeacherHeader
              theme={data.theme}
              onToggleTheme={() =>
                data.setTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
              onLogout={() => {
                clearSession();
                router.push("/");
              }}
            />

            {activeTab === "Шалгалт" && (
              <ExamTab
                loading={data.loading}
                stats={examStatsState.stats}
                scheduleTitle={management.scheduleTitle}
                setScheduleTitle={management.setScheduleTitle}
                scheduleDate={management.scheduleDate}
                setScheduleDate={management.setScheduleDate}
                durationMinutes={management.durationMinutes}
                setDurationMinutes={management.setDurationMinutes}
                roomCode={management.roomCode}
                onSchedule={management.handleSchedule}
                onCopyCode={management.copyCode}
                examTitle={management.examTitle}
                setExamTitle={management.setExamTitle}
                questionText={management.questionText}
                setQuestionText={management.setQuestionText}
                questionType={management.questionType}
                setQuestionType={management.setQuestionType}
                mcqOptions={management.mcqOptions}
                setMcqOptions={management.setMcqOptions}
                questionAnswer={management.questionAnswer}
                setQuestionAnswer={management.setQuestionAnswer}
                questions={management.questions}
                addQuestion={management.addQuestion}
                removeQuestion={management.removeQuestion}
                saveExam={management.saveExam}
                pdfUseOcr={imports.pdfUseOcr}
                setPdfUseOcr={imports.setPdfUseOcr}
                answerKeyPage={imports.answerKeyPage}
                setAnswerKeyPage={imports.setAnswerKeyPage}
                pdfLoading={imports.pdfLoading}
                pdfError={imports.pdfError}
                importError={imports.importError}
                onPdfUpload={imports.handlePdfUpload}
                onCsvUpload={imports.handleCsvUpload}
                onDocxUpload={imports.handleDocxUpload}
                exams={data.exams}
                notifications={data.notifications}
                onMarkNotificationRead={data.markNotificationRead}
                cheatStudents={mockStudents}
              />
            )}

            {activeTab === "Дүн" && (
              <ResultsTab
                examOptions={examStatsState.examOptions}
                activeExamId={examStatsState.activeExamId}
                onSelectExam={examStatsState.setSelectedExamId}
                examStats={examStatsState.examStats}
                submissions={data.submissions}
                onSelectSubmission={examStatsState.setSelectedSubmissionId}
                selectedSubmission={examStatsState.selectedSubmission}
                selectedExam={examStatsState.selectedExam}
              />
            )}

            {activeTab === "Тохиргоо" && <SettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
