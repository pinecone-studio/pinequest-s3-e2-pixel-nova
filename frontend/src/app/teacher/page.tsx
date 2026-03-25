"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/examGuard";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import {
  StudentProfile,
  CheatFlaggedStudent,
  TeacherExamDetail,
  TeacherExamSummary,
  TeacherSubmissionSummary,
  getTeacherExamDetail,
  getTeacherExamSubmissions,
  getTeacherExams,
  getTeacherSessionResult,
  getCheatFlaggedStudents,
  getStudentProfileForTeacher,
  syncClerkUser,
} from "@/lib/backend-auth";
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

export default function TeacherPage() {
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { signOut } = useClerk();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "Шалгалт" | "Дүн" | "Сурагч" | "Тохиргоо"
  >("Шалгалт");

  const clerkUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      username:
        user.fullName ||
        user.username ||
        user.primaryEmailAddress?.emailAddress ||
        "Багш",
      password: "",
      role: "teacher" as const,
      createdAt: "",
    };
  }, [user]);

  const data = useTeacherData(clerkUser, true);
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
  const showToast = data.showToast;
  const setExams = data.setExams;
  const setSubmissions = data.setSubmissions;
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [cheatStudents, setCheatStudents] = useState<
    { id: string; name: string; score: number; cheat: "Бага" | "Дунд" | "Өндөр"; events: number }[]
  >([]);

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
        await syncClerkUser("teacher", token);
      } catch {
        showToast("Нэвтрэх мэдээлэл хадгалах үед алдаа гарлаа.");
      }
    };
    sync();
  }, [getToken, isSignedIn, showToast]);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadExams = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const items: TeacherExamSummary[] = await getTeacherExams(token);
        const mapped = items.map((item) => ({
          id: item.id,
          title: item.title,
          scheduledAt: item.scheduledAt ?? null,
          roomCode: item.roomCode ?? "",
          questions: [],
          duration: item.durationMin ?? 45,
          createdAt: item.createdAt ?? new Date().toISOString(),
          notified: false,
        }));
        setExams(mapped);
      } catch {
        setExams([]);
      }
    };
    loadExams();
  }, [getToken, isSignedIn, setExams]);

  useEffect(() => {
    if (!isSignedIn) return;
    const examId = examStatsState.activeExamId;
    if (!examId) {
      setSubmissions([]);
      return;
    }
    const loadSubmissions = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const list: TeacherSubmissionSummary[] =
          await getTeacherExamSubmissions(token, examId);
        const mapped = list.map((item) => {
          const total = item.totalPoints ?? 0;
          const score = item.score ?? 0;
          const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
          return {
            id: item.id,
            examId: item.examId,
            studentId: item.studentId,
            studentName: item.studentName,
            answers: [],
            score,
            totalPoints: total,
            percentage,
            submittedAt: item.submittedAt ?? new Date().toISOString(),
            terminated: false,
          };
        });
        setSubmissions(mapped);
      } catch {
        setSubmissions([]);
      }
    };
    const loadExamDetail = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const detail: TeacherExamDetail = await getTeacherExamDetail(
          token,
          examId,
        );
        setExams((prev) =>
          prev.map((examItem) => {
            if (examItem.id !== examId) return examItem;
            const questions = (detail.questions ?? []).map((q) => {
              const type: "text" | "open" | "mcq" =
                q.type === "multiple_choice"
                  ? "mcq"
                  : q.type === "short_answer"
                    ? "open"
                    : "text";
              const correctOption =
                q.options?.find((opt) => opt.isCorrect) ?? null;
              return {
                id: q.id,
                text: q.questionText,
                type,
                options: q.options?.map((opt) => opt.text) ?? [],
                correctAnswer:
                  correctOption?.text ?? q.correctAnswerText ?? "",
              };
            });
            return {
              ...examItem,
              title: detail.title ?? examItem.title,
              scheduledAt: detail.scheduledAt ?? examItem.scheduledAt,
              roomCode: detail.roomCode ?? examItem.roomCode,
              duration: detail.durationMin ?? examItem.duration,
              questions,
            };
          }),
        );
      } catch {
        // ignore detail fetch errors for now
      }
    };
    loadSubmissions();
    loadExamDetail();
  }, [examStatsState.activeExamId, getToken, isSignedIn, setExams, setSubmissions]);

  useEffect(() => {
    if (!isSignedIn) return;
    const examId = examStatsState.activeExamId;
    if (!examId) {
      setCheatStudents([]);
      return;
    }
    const loadCheat = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const flagged: CheatFlaggedStudent[] = await getCheatFlaggedStudents(
          token,
          examId,
        );
        const mapped = flagged.map((item) => {
          const submission = data.submissions.find(
            (s) => s.examId === examId && s.studentId === item.studentId,
          );
          const score = submission?.percentage ?? 0;
          const events = item.eventCount ?? item.flagCount ?? 0;
          const cheat: "Бага" | "Дунд" | "Өндөр" =
            events >= 8 ? "Өндөр" : events >= 4 ? "Дунд" : "Бага";
          return {
            id: item.studentId,
            name: item.fullName,
            score,
            cheat,
            events,
          };
        });
        setCheatStudents(mapped);
      } catch {
        setCheatStudents([]);
      }
    };
    loadCheat();
  }, [data.submissions, examStatsState.activeExamId, getToken, isSignedIn]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isSignedIn) return;
      const studentId = examStatsState.selectedSubmission?.studentId;
      if (!studentId) {
        setStudentProfile(null);
        return;
      }
      setProfileLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const profile = await getStudentProfileForTeacher(token, studentId);
        setStudentProfile(profile);
      } catch {
        setStudentProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [examStatsState.selectedSubmission?.studentId, getToken, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    const sessionId = examStatsState.selectedSubmission?.id;
    if (!sessionId) return;
    const loadResultDetail = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const result = await getTeacherSessionResult(token, sessionId);
        const mappedAnswers =
          result.answers?.map((answer) => {
            const selectedOption = answer.options?.find(
              (opt) => opt.id === answer.selectedOptionId,
            );
            return {
              questionId: answer.questionId,
              selectedAnswer:
                selectedOption?.text ?? answer.textAnswer ?? "",
              correct: Boolean(answer.isCorrect),
            };
          }) ?? [];
        setSubmissions((prev) =>
          prev.map((item) =>
            item.id === sessionId
              ? { ...item, answers: mappedAnswers }
              : item,
          ),
        );
      } catch {
        // ignore detail fetch errors
      }
    };
    loadResultDetail();
  }, [examStatsState.selectedSubmission?.id, getToken, isSignedIn, setSubmissions]);

  if (!isLoaded || !isSignedIn) return null;
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
                signOut();
                router.push("/");
              }}
              notifications={data.notifications}
              onMarkRead={data.markNotificationRead}
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
                cheatStudents={cheatStudents}
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
