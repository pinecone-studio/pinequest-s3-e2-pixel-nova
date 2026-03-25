"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import RoleNavbar from "@/components/RoleNavbar";
import {
  buildRoleUser,
  getStoredRole,
  isTeacherRole,
  setStoredRole,
  type RoleKey,
} from "@/lib/role-session";
import { getJSON } from "@/lib/examGuard";
import type { StudentProfile } from "@/lib/backend-auth";
import TeacherSidebar from "./components/TeacherSidebar";
import TeacherHeader from "./components/TeacherHeader";
import ExamTab from "./components/ExamTab";
import ResultsTab from "./components/ResultsTab";
import SettingsTab from "./components/SettingsTab";
import TeacherStudentsTab from "./components/TeacherStudentsTab";
import { useTeacherData } from "./hooks/useTeacherData";
import { useExamManagement } from "./hooks/useExamManagement";
import { useExamImport } from "./hooks/useExamImport";
import { useExamStats } from "./hooks/useExamStats";

type TeacherPageProps = {
  forcedRole?: RoleKey;
};

export default function TeacherPage({ forcedRole }: TeacherPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [role, setRole] = useState<RoleKey>(forcedRole ?? "teacher-1");
  const [activeTab, setActiveTab] = useState<
    "Шалгалт" | "Дүн" | "Сурагч" | "Тохиргоо"
  >("Шалгалт");

  const roleUser = useMemo(() => buildRoleUser(role), [role]);
  const data = useTeacherData(roleUser);

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
    studentProgress: data.studentProgress,
    users: data.users,
  });

  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [cheatStudents, setCheatStudents] = useState<
    { id: string; name: string; score: number; cheat: "Бага" | "Дунд" | "Өндөр"; events: number }[]
  >([]);

  useEffect(() => {
    if (pathname === "/teacher") {
      router.replace("/teacher-1");
      return;
    }
    const nextRole = forcedRole ?? getStoredRole();
    setRole(nextRole);
    setStoredRole(nextRole);
    if (!isTeacherRole(nextRole)) {
      router.replace(`/${nextRole}`);
    }
  }, [router, forcedRole, pathname]);

  const handleRoleChange = (next: RoleKey) => {
    setRole(next);
    setStoredRole(next);
    router.push(`/${next}`);
  };

  useEffect(() => {
    const studentId = examStatsState.selectedSubmission?.studentId;
    if (!studentId) {
      setStudentProfile(null);
      return;
    }
    setProfileLoading(true);
    const profiles = getJSON<Record<string, StudentProfile>>(
      "studentProfiles",
      {},
    );
    setStudentProfile((profiles[studentId] as StudentProfile) ?? null);
    setProfileLoading(false);
  }, [examStatsState.selectedSubmission?.studentId, role]);

  useEffect(() => {
    const examId = examStatsState.activeExamId;
    if (!examId) {
      setCheatStudents([]);
      return;
    }
    const mapped = data.submissions
      .filter((s) => s.examId === examId)
      .map((s) => {
        const events =
          (s.violations?.tabSwitch ?? 0) +
          (s.violations?.windowBlur ?? 0) +
          (s.violations?.copyAttempt ?? 0) +
          (s.violations?.pasteAttempt ?? 0) +
          (s.violations?.fullscreenExit ?? 0) +
          (s.violations?.keyboardShortcut ?? 0);
        const cheat: "Бага" | "Дунд" | "Өндөр" =
          events >= 8 ? "Өндөр" : events >= 4 ? "Дунд" : "Бага";
        return {
          id: s.studentId,
          name: s.studentName,
          score: s.percentage,
          cheat,
          events,
        };
      });
    setCheatStudents(mapped);
  }, [data.submissions, examStatsState.activeExamId]);

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
              notifications={data.notifications}
              onMarkRead={data.markNotificationRead}
              roleControl={
                <RoleNavbar activeRole={role} onChange={handleRoleChange} />
              }
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
                onCsvUpload={imports.handleCsvUpload}
                onDocxUpload={imports.handleDocxUpload}
                exams={data.exams}
                notifications={data.notifications}
                onMarkNotificationRead={data.markNotificationRead}
                cheatStudents={cheatStudents}
                xpLeaderboard={[]}
              />
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

            {activeTab === "Сурагч" && <TeacherStudentsTab />}

            {activeTab === "Тохиргоо" && <SettingsTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
