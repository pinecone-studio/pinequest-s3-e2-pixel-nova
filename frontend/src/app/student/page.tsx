"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/examGuard";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import StudentDashboardTab from "./components/StudentDashboardTab";
import StudentResultsTab from "./components/StudentResultsTab";
import StudentSettingsTab from "./components/StudentSettingsTab";
import StudentExamView from "./components/StudentExamView";
import StudentResultView from "./components/StudentResultView";
import { useStudentData } from "./hooks/useStudentData";
import { useStudentProgress } from "./hooks/useStudentProgress";
import { useStudentExamState } from "./hooks/useStudentExamState";
import { useExamSessionRestore } from "./hooks/useExamSessionRestore";
import { useExamCheatDetection } from "./hooks/useExamCheatDetection";
import { useExamTimer } from "./hooks/useExamTimer";
import { useExamAutosave } from "./hooks/useExamAutosave";

export default function StudentPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const data = useStudentData();
  const exam = useStudentExamState({
    currentUser: data.currentUser,
    exams: data.exams,
    setNotifications: data.setNotifications,
  });
  const progress = useStudentProgress(data.currentUser);

  useExamSessionRestore({
    view: exam.view,
    sessionKey: exam.sessionKey,
    setAnswers: exam.setAnswers,
    setCurrentQuestionIndex: exam.setCurrentQuestionIndex,
    setTimeLeft: exam.setTimeLeft,
  });

  useExamCheatDetection({
    view: exam.view,
    violations: exam.violations,
    logViolation: exam.logViolation,
    showWarning: exam.showWarning,
    terminateExam: exam.terminateExam,
  });

  useExamTimer({
    view: exam.view,
    sessionKey: exam.sessionKey,
    currentUser: data.currentUser,
    activeExam: exam.activeExam,
    setTimeLeft: exam.setTimeLeft,
    submitExam: exam.submitExam,
  });

  useExamAutosave({
    view: exam.view,
    sessionKey: exam.sessionKey,
    currentUser: data.currentUser,
    activeExam: exam.activeExam,
    answers: exam.answers,
    currentQuestionIndex: exam.currentQuestionIndex,
    timeLeft: exam.timeLeft,
  });

  if (!data.currentUser) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {exam.view === "dashboard" && (
        <div
          className={`grid min-h-screen transition-[grid-template-columns] duration-300 ease-out ${
            sidebarCollapsed
              ? "lg:grid-cols-[72px_1fr]"
              : "lg:grid-cols-[260px_1fr]"
          }`}
        >
          <StudentSidebar
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            activeTab={exam.activeTab}
            setActiveTab={exam.setActiveTab}
            sidebarTimerRef={exam.sidebarTimerRef}
          />
          <main className="px-6 py-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <StudentHeader
                theme={data.theme}
                onToggleTheme={() =>
                  data.setTheme((prev) => (prev === "dark" ? "light" : "dark"))
                }
                onLogout={() => {
                  clearSession();
                  router.push("/");
                }}
              />

              {exam.activeTab === "Шалгалт" && (
                <StudentDashboardTab
                  loading={data.loading}
                  roomCodeInput={exam.roomCodeInput}
                  setRoomCodeInput={exam.setRoomCodeInput}
                  joinError={exam.joinError}
                  onLookup={exam.handleLookup}
                  selectedExam={exam.selectedExam}
                  onStartExam={exam.startExam}
                  levelInfo={progress.levelInfo}
                  studentProgress={progress.studentProgress}
                  progressSegments={progress.progressSegments}
                  nextLevel={progress.nextLevel}
                  notifications={data.notifications}
                  studentHistory={progress.studentHistory}
                />
              )}

              {exam.activeTab === "Дүн" && (
                <StudentResultsTab studentHistory={progress.studentHistory} />
              )}

              {exam.activeTab === "Тохиргоо" && (
                <StudentSettingsTab username={data.currentUser.username} />
              )}
            </div>
          </main>
        </div>
      )}

      {exam.view === "exam" && (
        <StudentExamView
          activeExam={exam.activeExam}
          warning={exam.warning}
          timeLeft={exam.timeLeft}
          currentQuestionIndex={exam.currentQuestionIndex}
          setCurrentQuestionIndex={exam.setCurrentQuestionIndex}
          violations={exam.violations}
          answers={exam.answers}
          onUpdateAnswer={exam.updateAnswer}
          onSelectMcq={exam.selectMcqAnswer}
          onPrev={exam.goPrev}
          onNext={exam.goNext}
          onSubmit={() => exam.submitExam(false)}
          onExit={() => exam.setView("dashboard")}
        />
      )}

      {exam.view === "result" && (
        <StudentResultView
          lastSubmission={exam.lastSubmission}
          answerReport={exam.answerReport}
          onBack={() => exam.setView("dashboard")}
        />
      )}
    </div>
  );
}
