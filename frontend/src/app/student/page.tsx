"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RoleNavbar from "@/components/RoleNavbar";
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
import StudentHeader from "./components/StudentHeader";
import StudentDashboardTab from "./components/StudentDashboardTab";
import StudentExamsTab from "./components/StudentExamsTab";
import StudentProgressTab from "./components/StudentProgressTab";
import StudentLeaderboardTab from "./components/StudentLeaderboardTab";
import StudentSettingsTab from "./components/StudentSettingsTab";
import StudentPreferencesTab from "./components/StudentPreferencesTab";
import StudentHelpTab from "./components/StudentHelpTab";
import StudentExamView from "./components/StudentExamView";
import StudentResultView from "./components/StudentResultView";
import { useStudentData } from "./hooks/useStudentData";
import { useStudentProgress } from "./hooks/useStudentProgress";
import { useStudentExamState } from "./hooks/useStudentExamState";
import { useExamCheatDetection } from "./hooks/useExamCheatDetection";
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

  useExamCheatDetection({
    view: exam.view,
    violations: exam.violations,
    logViolation: exam.logViolation,
    showWarning: exam.showWarning,
    terminateExam: exam.terminateExam,
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

  const leaderboardEntries = useMemo(
    () =>
      [...users]
        .sort((left, right) => {
          const xpDiff = (right.xp ?? 0) - (left.xp ?? 0);
          if (xpDiff !== 0) return xpDiff;
          return left.fullName.localeCompare(right.fullName);
        })
        .map((user, index) => ({
          id: user.id,
          fullName: user.fullName,
          xp: user.xp ?? 0,
          level: user.level ?? 1,
          rank: index + 1,
        })),
    [users],
  );

  const currentUserNameRaw =
    selectedUser?.fullName ?? data.currentUser?.username ?? "";
  const currentUserName =
    typeof currentUserNameRaw === "string" ? currentUserNameRaw : "";
  const currentUserId = selectedUser?.id ?? data.currentUser?.id ?? "";
  const currentRank =
    leaderboardEntries.find((entry) => entry.id === currentUserId)?.rank ??
    null;
  const currentXp = progress.studentProgress.xp || selectedUser?.xp || 0;

  if (!data.currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground grid place-items-center px-6 text-sm text-muted-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <div className="text-base font-semibold text-foreground">
            Өгөгдөл ачаалж байна...
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Хэрэв удаан үргэлжилбэл backend ажиллаж байгаа эсэхийг шалгана уу.
          </div>
          {!usersLoading && (
            <div className="mt-4 text-xs text-muted-foreground">
              Хэрэглэгчийн мэдээлэл авч чадсангүй.
            </div>
          )}
          <button
            className="mt-4 rounded-xl border border-border bg-muted px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/70"
            onClick={() => window.location.reload()}
          >
            Дахин ачаалах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-foreground">
      {exam.view === "dashboard" && (
        <main
          key={`student-${exam.activeTab}`}
          className="px-4 py-6 sm:px-6 lg:px-8 page-transition"
        >
          <div className="mx-auto w-full max-w-[1280px] space-y-5">
            <StudentHeader
              activeTab={exam.activeTab}
              currentUserName={currentUserName}
              currentUserInitials={getInitials(currentUserName)}
              notifications={data.notifications}
              xp={currentXp}
              onTabChange={exam.setActiveTab}
              onOpenProfile={() => exam.setActiveTab("Profile")}
              onOpenSettings={() => exam.setActiveTab("Settings")}
              onOpenHelp={() => exam.setActiveTab("Help")}
              onToggleTheme={() =>
                data.setTheme((prev) => (prev === "dark" ? "light" : "dark"))
              }
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

            {exam.activeTab === "Home" && (
              <StudentDashboardTab
                loading={data.loading}
                currentUserName={currentUserName}
                selectedExam={exam.selectedExam}
                levelInfo={progress.levelInfo}
                studentProgress={progress.studentProgress}
                nextLevel={progress.nextLevel}
                currentRank={currentRank}
                studentCount={leaderboardEntries.length}
                studentHistory={studentHistory}
                onOpenExams={() => exam.setActiveTab("Exams")}
                onOpenProgress={() => exam.setActiveTab("Progress")}
              />
            )}

            {exam.activeTab === "Exams" && (
              <StudentExamsTab
                loading={data.loading}
                roomCodeInput={exam.roomCodeInput}
                setRoomCodeInput={exam.setRoomCodeInput}
                joinLoading={exam.joinLoading}
                joinError={exam.joinError}
                onLookup={exam.handleLookup}
                selectedExam={exam.selectedExam}
                onStartExam={exam.startExam}
                onClearSelection={() => {
                  exam.setSelectedExam(null);
                  exam.setJoinError(null);
                }}
                teacherName={
                  typeof teacherUsers[0]?.fullName === "string"
                    ? (teacherUsers[0]?.fullName ?? null)
                    : null
                }
                studentHistory={studentHistory}
              />
            )}

            {exam.activeTab === "Progress" && (
              <StudentProgressTab
                levelInfo={progress.levelInfo}
                studentProgress={progress.studentProgress}
                nextLevel={progress.nextLevel}
                progressSegments={progress.progressSegments}
                studentHistory={studentHistory}
              />
            )}

            {exam.activeTab === "Leaderboard" && (
              <StudentLeaderboardTab
                currentUserId={currentUserId}
                entries={leaderboardEntries}
              />
            )}

            {exam.activeTab === "Profile" && (
              <StudentSettingsTab
                userId={data.currentUser.id}
                username={data.currentUser.username}
              />
            )}

            {exam.activeTab === "Settings" && <StudentPreferencesTab />}

            {exam.activeTab === "Help" && <StudentHelpTab />}
          </div>
        </main>
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
            onExit={() => exam.setView("dashboard")}
          />
        </div>
      )}

      {exam.view === "result" && (
        <div className="page-transition" key="student-result">
          <StudentResultView
            lastSubmission={exam.lastSubmission}
            answerReport={exam.answerReport}
            onBack={() => {
              exam.setView("dashboard");
              router.push(`/${role}`);
            }}
          />
        </div>
      )}
    </div>
  );
}
