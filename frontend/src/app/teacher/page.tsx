"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleNavbar from "@/components/RoleNavbar";
import {
  STORAGE_KEYS,
  setJSON,
  setSessionUser,
} from "@/lib/examGuard";
import type { AuthUser, StudentProfile } from "@/lib/backend-auth";
import { getAuthUsers, getStudentProfileForTeacher } from "@/lib/backend-auth";
import {
  buildSessionUser,
  getStoredSelectedUserId,
  setStoredRole,
  setStoredSelectedUserId,
  type RoleKey,
} from "@/lib/role-session";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherHeader from "./components/TeacherHeader";
import ExamScheduleCard from "./components/ExamScheduleCard";
import ExamCreateCard from "./components/ExamCreateCard";
import ExamListCard from "./components/ExamListCard";
import ExamStatsCards from "./components/ExamStatsCards";
import TeacherXpOverviewCard from "./components/TeacherXpOverviewCard";
import ResultsTab from "./components/ResultsTab";
import SettingsTab from "./components/SettingsTab";
import TeacherStudentsTab from "./components/TeacherStudentsTab";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamImport } from "./hooks/useExamImport";
import { useExamStats } from "./hooks/useExamStats";

const teacherTabs = [
  "Шалгалт үүсгэх",
  "Хадгалсан шалгалт",
  "XP харах",
  "Дүн",
  "Сурагч",
  "Тохиргоо",
] as const;

type TeacherTab = (typeof teacherTabs)[number];

type TeacherPageProps = {
  forcedRole?: RoleKey;
};

export default function TeacherPage({ forcedRole }: TeacherPageProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const role: RoleKey = forcedRole ?? "teacher";
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TeacherTab>(teacherTabs[0]);

  const data = useTeacherData(
    selectedUser ? buildSessionUser(selectedUser) : null,
  );

  const management = useExamManagement({
    exams: data.exams,
    setExams: data.setExams,
    showToast: data.showToast,
    currentUser: data.currentUser,
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
    studentProgress: data.studentProgress,
    users: data.users,
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setStoredRole(role);
  }, [role]);

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
          nextUsers.find((user) => user.id === storedUserId) ??
          nextUsers[0] ??
          null;

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

  useEffect(() => {
    const studentId = examStatsState.selectedSubmission?.studentId;
    if (!studentId) {
      setStudentProfile(null);
      return;
    }
    setProfileLoading(true);
    let active = true;
    const loadProfile = async () => {
      try {
        const profile = await getStudentProfileForTeacher(studentId);
        if (!active) return;
        setStudentProfile(profile);
      } catch {
        if (!active) return;
        setStudentProfile(null);
      } finally {
        if (active) setProfileLoading(false);
      }
    };
    void loadProfile();
    return () => {
      active = false;
    };
  }, [examStatsState.selectedSubmission?.studentId]);

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
        }`}>
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
              notifications={data.notifications}
              onMarkRead={data.markNotificationRead}
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

            {activeTab === "Шалгалт үүсгэх" && (
              <>
                <ExamStatsCards
                  loading={data.loading}
                  stats={examStatsState.stats}
                />
                <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                  <ExamScheduleCard
                    scheduleTitle={management.scheduleTitle}
                    setScheduleTitle={management.setScheduleTitle}
                    scheduleDate={management.scheduleDate}
                    setScheduleDate={management.setScheduleDate}
                    durationMinutes={management.durationMinutes}
                    setDurationMinutes={management.setDurationMinutes}
                    roomCode={management.roomCode}
                    onSchedule={management.handleSchedule}
                    onCopyCode={management.copyCode}
                  />
                  <ExamCreateCard
                    examTitle={management.examTitle}
                    setExamTitle={management.setExamTitle}
                    createDate={management.createDate}
                    setCreateDate={management.setCreateDate}
                    durationMinutes={management.durationMinutes}
                    setDurationMinutes={management.setDurationMinutes}
                    questionText={management.questionText}
                    setQuestionText={management.setQuestionText}
                    questionType={management.questionType}
                    setQuestionType={management.setQuestionType}
                    mcqOptions={management.mcqOptions}
                    setMcqOptions={management.setMcqOptions}
                    questionAnswer={management.questionAnswer}
                    setQuestionAnswer={management.setQuestionAnswer}
                    questionPoints={management.questionPoints}
                    setQuestionPoints={management.setQuestionPoints}
                    questionCorrectIndex={management.questionCorrectIndex}
                    setQuestionCorrectIndex={management.setQuestionCorrectIndex}
                    questions={management.questions}
                    addQuestion={management.addQuestion}
                    removeQuestion={management.removeQuestion}
                    updateQuestion={management.updateQuestion}
                    updateQuestionOption={management.updateQuestionOption}
                    addQuestionOption={management.addQuestionOption}
                    removeQuestionOption={management.removeQuestionOption}
                    saveExam={management.saveExam}
                    pdfUseOcr={imports.pdfUseOcr}
                    setPdfUseOcr={imports.setPdfUseOcr}
                    answerKeyPage={imports.answerKeyPage}
                    setAnswerKeyPage={imports.setAnswerKeyPage}
                    pdfLoading={imports.pdfLoading}
                    pdfError={imports.pdfError}
                    importError={imports.importError}
                    onPdfUpload={imports.handlePdfUpload}
                    onImageUpload={imports.handleImageUpload}
                    onDocxUpload={imports.handleDocxUpload}
                  />
                </section>
              </>
            )}

            {activeTab === "Хадгалсан шалгалт" && (
              <section className="grid gap-4">
                <ExamListCard
                  exams={data.exams}
                  onCopyCode={management.copyCode}
                />
              </section>
            )}

            {activeTab === "XP харах" && (
              <section className="grid gap-4">
                <TeacherXpOverviewCard
                  students={examStatsState.xpLeaderboard}
                />
              </section>
            )}

            {activeTab === "Дүн" && (
              <ResultsTab
                loading={data.loading}
                examOptions={examStatsState.examOptions}
                activeExamId={examStatsState.activeExamId}
                onSelectExam={examStatsState.setSelectedExamId}
                examStats={examStatsState.examStats}
                submissions={examStatsState.activeSubmissions}
                onSelectSubmission={examStatsState.setSelectedSubmissionId}
                selectedSubmissionId={examStatsState.selectedSubmissionId}
                selectedSubmission={examStatsState.selectedSubmission}
                selectedExam={examStatsState.selectedExam}
                studentProfile={studentProfile}
                profileLoading={profileLoading}
              />
            )}

            {activeTab === "Сурагч" && (
              <TeacherStudentsTab
                exams={data.exams}
                onAddSchedule={() => setActiveTab("Шалгалт үүсгэх")}
              />
            )}

            {activeTab === "Тохиргоо" && (
              <SettingsTab
                activeExam={examStatsState.activeExam}
                submissions={examStatsState.activeSubmissions}
                currentUserName={data.currentUser.username}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
