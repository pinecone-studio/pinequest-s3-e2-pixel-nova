"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const lastSyncedSubmissionIdRef = useRef<string | null>(null);
  const lastResolvedResultSignatureRef = useRef<string | null>(null);

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
        title: item.title,
        percentage: item.percentage,
        score: item.score,
        totalPoints: item.totalPoints,
        grade: item.grade,
        date: item.date,
      })),
    [progress.studentHistory],
  );

  const currentUserNameRaw =
    selectedUser?.fullName ?? data.currentUser?.username ?? "";
  const currentUserName =
    typeof currentUserNameRaw === "string" ? currentUserNameRaw : "";
  const currentRank = progress.rankOverview.rank;
  const currentXp = progress.studentProgress.xp;
  const { refreshProgress } = progress;
  const showFallbackState =
    !data.currentUser && !selectedUser && !usersLoading && !data.loading;

  useEffect(() => {
    const submissionId = exam.lastSubmission?.id ?? null;
    if (!submissionId || submissionId === lastSyncedSubmissionIdRef.current) {
      return;
    }

    lastSyncedSubmissionIdRef.current = submissionId;
    void refreshProgress();
  }, [exam.lastSubmission?.id, refreshProgress]);

  useEffect(() => {
    const submission = exam.lastSubmission;
    if (!submission || exam.resultPending) {
      return;
    }

    const signature = [
      submission.id,
      submission.score ?? 0,
      submission.totalPoints ?? 0,
      submission.submittedAt ?? "",
    ].join(":");

    if (signature === lastResolvedResultSignatureRef.current) {
      return;
    }

    lastResolvedResultSignatureRef.current = signature;
    void refreshProgress();
  }, [
    exam.lastSubmission?.id,
    exam.lastSubmission?.score,
    exam.lastSubmission?.submittedAt,
    exam.lastSubmission?.totalPoints,
    exam.resultPending,
    refreshProgress,
  ]);

  if (showFallbackState) {
    return (
      <div className="min-h-screen bg-[#f6f7fd] px-4 pb-10 pt-6 font-sans sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1272px] rounded-[28px] border border-[#dfe5fb] bg-white px-6 py-8 text-center shadow-[0_18px_40px_-28px_rgba(79,93,132,0.22)]">
          <h2 className="text-lg font-semibold text-slate-900">
            Өгөгдөл ачаалж чадсангүй
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Backend холболтоо шалгаад дахин ачаалж үзнэ үү.
          </p>
          <button
            className="mt-5 rounded-2xl border border-[#dce6f4] bg-[#f8fbff] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
            onClick={() => window.location.reload()}
            type="button"
          >
            Дахин ачаалах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7fd] font-sans text-foreground">
      {data.toast && (
        <div className="fixed right-6 top-6 z-50 rounded-[24px] border border-[#e7e9fb] bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.28)] backdrop-blur">
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
            submitting={exam.submittingExam}
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
