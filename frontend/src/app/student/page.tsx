"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/examGuard";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { getStudentResults, syncClerkUser } from "@/lib/backend-auth";
import StudentSidebar from "./components/StudentSidebar";
import StudentHeader from "./components/StudentHeader";
import StudentDashboardTab from "./components/StudentDashboardTab";
import StudentResultsTab from "./components/StudentResultsTab";
import StudentSettingsTab from "./components/StudentSettingsTab";
import StudentPreferencesTab from "./components/StudentPreferencesTab";
import StudentHelpTab from "./components/StudentHelpTab";
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
  const { user } = useUser();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [remoteHistory, setRemoteHistory] = useState<
    { examId: string; title: string; percentage: number; date: string }[]
  >([]);

  const clerkUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username:
        user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        "Сурагч",
      password: "",
      role: "student" as const,
      createdAt: "",
    };
  }, [user]);

  const data = useStudentData(clerkUser);
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
  const showWarning = exam.showWarning;

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    const sync = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await syncClerkUser("student", token);
      } catch {
        showWarning("Нэвтрэх мэдээлэл хадгалах үед алдаа гарлаа.");
      }
    };
    sync();
  }, [getToken, isSignedIn, showWarning]);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadHistory = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const results = await getStudentResults(token);
        const mapped = results.map((item) => {
          const total = item.totalPoints ?? 0;
          const score = item.score ?? 0;
          const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
          return {
            examId: item.examId,
            title: item.title ?? "Шалгалт",
            percentage,
            date: item.submittedAt ?? new Date().toISOString(),
          };
        });
        setRemoteHistory(mapped);
      } catch {
        setRemoteHistory([]);
      }
    };
    loadHistory();
  }, [getToken, isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;
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
                  signOut();
                  router.push("/");
                }}
                notifications={data.notifications}
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
                  studentHistory={remoteHistory}
                />
              )}

              {exam.activeTab === "Дүн" && (
                <StudentResultsTab studentHistory={remoteHistory} />
              )}

              {exam.activeTab === "Профайл" && (
                <StudentSettingsTab
                  userId={data.currentUser.id}
                  username={data.currentUser.username}
                />
              )}

              {exam.activeTab === "Тохиргоо" && <StudentPreferencesTab />}

              {exam.activeTab === "Тусламж" && <StudentHelpTab />}
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
