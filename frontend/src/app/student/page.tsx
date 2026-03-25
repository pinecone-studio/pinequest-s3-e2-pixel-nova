"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleNavbar from "@/components/RoleNavbar";
import { STORAGE_KEYS, setJSON, setSessionUser } from "@/lib/examGuard";
import type { AuthUser } from "@/lib/backend-auth";
import { getAuthUsers } from "@/lib/backend-auth";
import {
  buildSessionUser,
  getStoredSelectedUserId,
  setStoredRole,
  setStoredSelectedUserId,
  type RoleKey,
} from "@/lib/role-session";
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

type StudentPageProps = {
  forcedRole?: RoleKey;
};

export default function StudentPage({ forcedRole }: StudentPageProps) {
  const router = useRouter();
  const role: RoleKey = forcedRole ?? "student";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const data = useStudentData(
    selectedUser ? buildSessionUser(selectedUser) : null,
  );
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

  useEffect(() => {
    setStoredRole(role);
  }, [role]);

  useEffect(() => {
    if (exam.view === "exam") return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => null);
    }
    document.body.style.filter = "none";
    document.body.style.background = "";
  }, [exam.view]);

  useEffect(() => {
    if (exam.view !== "result") return;
    const timer = setTimeout(() => {
      exam.setView("dashboard");
      router.push(`/${role}`);
    }, 4000);
    return () => clearTimeout(timer);
  }, [exam.view, exam, router, role]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const authUsers = await getAuthUsers();
        if (cancelled) return;

        const nextUsers = authUsers.filter((user) => user.role === role);
        const storedUserId = getStoredSelectedUserId(role);
        const nextUser =
          nextUsers.find((user) => user.id === storedUserId) ?? nextUsers[0] ?? null;

        setUsers(nextUsers);
        setSelectedUser(nextUser);
        setJSON(
          STORAGE_KEYS.users,
          nextUsers.map((user) => buildSessionUser(user)),
        );

        if (nextUser) {
          setStoredSelectedUserId(role, nextUser.id);
          setSessionUser(buildSessionUser(nextUser));
        }
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, [role]);

  const handleRoleChange = (nextRole: RoleKey) => {
    setStoredRole(nextRole);
    router.push(`/${nextRole}`);
  };

  const handleUserChange = (userId: string) => {
    const nextUser = users.find((user) => user.id === userId) ?? null;
    if (!nextUser) return;

    setSelectedUser(nextUser);
    setStoredSelectedUserId(role, nextUser.id);
    setSessionUser(buildSessionUser(nextUser));
  };

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
                notifications={data.notifications}
                roleControl={
                  <RoleNavbar
                    activeRole={role}
                    activeUserId={selectedUser?.id ?? null}
                    users={users}
                    loading={usersLoading}
                    onChangeRole={handleRoleChange}
                    onChangeUser={handleUserChange}
                  />
                }
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
                  studentHistory={progress.studentHistory.map((item) => ({
                    examId: item.examId,
                    title:
                      data.exams.find((examItem) => examItem.id === item.examId)
                        ?.title ?? `Шалгалт #${item.examId.slice(-4)}`,
                    percentage: item.percentage,
                    score: item.score,
                    totalPoints: item.totalPoints,
                    grade: item.grade,
                    date: item.date,
                  }))}
                />
              )}

              {exam.activeTab === "Дүн" && (
                <StudentResultsTab
                  studentHistory={progress.studentHistory.map((item) => ({
                    examId: item.examId,
                    title:
                      data.exams.find((examItem) => examItem.id === item.examId)
                        ?.title ?? `Шалгалт #${item.examId.slice(-4)}`,
                    percentage: item.percentage,
                    score: item.score,
                    totalPoints: item.totalPoints,
                    grade: item.grade,
                    date: item.date,
                  }))}
                />
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
          onBack={() => {
            exam.setView("dashboard");
            router.push(`/${role}`);
          }}
        />
      )}
    </div>
  );
}
