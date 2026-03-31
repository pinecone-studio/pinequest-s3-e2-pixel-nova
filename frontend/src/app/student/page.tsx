"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setSessionUser } from "@/lib/examGuard";
import type { AuthUser } from "@/lib/backend-auth";
import { getAuthUsers } from "@/lib/backend-auth";
import {
  buildSessionUser,
  getStoredSelectedUserId,
  setStoredRole,
  setStoredSelectedUserId,
  type RoleKey,
} from "@/lib/role-session";
import StudentDashboardView from "./components/StudentDashboardView";
import DesktopExamCameraCard from "./components/DesktopExamCameraCard";
import DesktopExamAudioCard from "./components/DesktopExamAudioCard";
import StudentExamView from "./components/StudentExamView";
import StudentResultView from "./components/StudentResultView";
import StudentLoadingScreen from "./components/StudentLoadingScreen";
import { useStudentData } from "./hooks/useStudentData";
import { useStudentProgress } from "./hooks/useStudentProgress";
import { useStudentExamState } from "./hooks/useStudentExamState";
import { useExamIntegrityMonitor } from "./hooks/useExamIntegrityMonitor";
import { useExamTimer } from "./hooks/useExamTimer";

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ST";

export default function StudentPage() {
  const router = useRouter();
  const role: RoleKey = "student";
  const [teacherUsers, setTeacherUsers] = useState<AuthUser[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const sessionUser = useMemo(
    () => (selectedUser ? buildSessionUser(selectedUser) : null),
    [selectedUser],
  );

  const data = useStudentData(sessionUser);
  const exam = useStudentExamState({
    currentUser: data.currentUser,
  });
  const progress = useStudentProgress(data.currentUser);

  useExamIntegrityMonitor({
    view: exam.view,
    logViolation: exam.logViolation,
    showWarning: exam.showWarning,
  });

  useExamTimer({
    view: exam.view,
    currentUser: data.currentUser,
    activeExam: exam.activeExam,
    setTimeLeft: exam.setTimeLeft,
    submitExam: exam.submitExam,
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
    let cancelled = false;

    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const authUsers = await getAuthUsers();
        if (cancelled) return;

        setTeacherUsers(authUsers.filter((user) => user.role === "teacher"));
        const nextUsers = authUsers.filter((user) => user.role === role);
        const storedUserId = getStoredSelectedUserId(role);
        const nextUser =
          nextUsers.find((user) => user.id === storedUserId) ??
          nextUsers[0] ??
          null;

        setUsers(nextUsers);
        setSelectedUser(nextUser);
        if (nextUser) {
          setStoredSelectedUserId(role, nextUser.id);
          setSessionUser(buildSessionUser(nextUser));
        }
      } catch {
        if (cancelled) return;
        setTeacherUsers([]);
        setUsers([]);
        setSelectedUser(null);
      } finally {
        if (!cancelled) setUsersLoading(false);
      }
    };

    void loadUsers();

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

  const studentHistory = useMemo(
    () =>
      progress.studentHistory.map((item) => ({
        examId: item.examId,
        title:
          data.exams.find((examItem) => examItem.id === item.examId)?.title ??
          `Exam #${item.examId.slice(-4)}`,
        percentage: item.percentage,
        score: item.score,
        totalPoints: item.totalPoints,
        grade: item.grade,
        date: item.date,
      })),
    [data.exams, progress.studentHistory],
  );

  const currentUserNameRaw =
    selectedUser?.fullName ?? data.currentUser?.username ?? "";
  const currentUserName =
    typeof currentUserNameRaw === "string" ? currentUserNameRaw : "";
  const currentRank = progress.rankOverview.rank;
  const currentXp = progress.studentProgress.xp;

  if (!data.currentUser) {
    return (
      <StudentLoadingScreen
        usersLoading={usersLoading}
        onReload={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-2xl border border-[#e7e3fb] bg-white px-4 py-3 text-sm shadow-[0_20px_45px_-32px_rgba(15,23,42,0.28)]">
          {data.toast}
        </div>
      )}
      {exam.view === "dashboard" && (
        <StudentDashboardView
          role={role}
          users={users}
          usersLoading={usersLoading}
          selectedUser={selectedUser}
          teacherUsers={teacherUsers}
          currentUserName={currentUserName}
          currentRank={currentRank}
          totalStudents={progress.rankOverview.totalStudents}
          studentHistory={studentHistory}
          currentXp={currentXp}
          data={data}
          exam={exam}
          progress={progress}
          onRoleChange={handleRoleChange}
          onUserChange={handleUserChange}
          getInitials={getInitials}
        />
      )}

      {exam.view === "exam" && (
        <div className="page-transition" key="student-exam">
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
            onExit={exam.leaveExamFlow}
            cameraPanel={
              <div className="space-y-4">
                <DesktopExamCameraCard
                  view={exam.view}
                  sessionId={exam.sessionId}
                  user={data.currentUser}
                  showWarning={exam.showWarning}
                  enabledCheatDetections={
                    exam.activeExam?.enabledCheatDetections ?? null
                  }
                />
                <DesktopExamAudioCard
                  view={exam.view}
                  sessionId={exam.sessionId}
                  user={data.currentUser}
                  showWarning={exam.showWarning}
                  required={Boolean(exam.activeExam?.requiresAudioRecording)}
                  onTerminateExam={exam.terminateExam}
                />
              </div>
            }
          />
        </div>
      )}

      {exam.view === "result" && (
        <div className="page-transition" key="student-result">
          <StudentResultView
            lastSubmission={exam.lastSubmission}
            answerReport={exam.answerReport}
            resultPending={exam.resultPending}
            resultCountdown={exam.resultCountdown}
            resultReleaseAt={exam.resultReleaseAt}
            onBack={() => {
              exam.leaveExamFlow();
              router.push(`/${role}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
