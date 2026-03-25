import { apiFetch, unwrapApi } from "./api-client";

export type StudentProfile = {
  id?: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  school?: string | null;
  grade?: string | null;
  bio?: string | null;
  xp?: number;
  level?: number;
};

export type AuthRole = "teacher" | "student";

export type AuthUser = {
  id: string;
  code?: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: AuthRole;
  xp?: number;
  level?: number;
};

export type StudentResultSummary = {
  sessionId: string;
  examId: string;
  title: string;
  score: number | null;
  totalPoints: number | null;
  earnedPoints: number | null;
  submittedAt: string | null;
};

export type TeacherExamSummary = {
  id: string;
  title: string;
  scheduledAt: string | null;
  roomCode: string | null;
  durationMin: number;
  status: string;
  createdAt: string;
};

export type TeacherExamDetail = TeacherExamSummary & {
  questions: {
    id: string;
    questionText: string;
    type: string;
    correctAnswerText?: string | null;
    points: number;
    options?: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
};

export type TeacherSubmissionSummary = {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  score: number | null;
  totalPoints: number | null;
  submittedAt: string | null;
  isFlagged?: boolean | null;
  flagCount?: number | null;
};

export type TeacherSessionResult = {
  sessionId: string;
  examId: string;
  title: string;
  score: number | null;
  totalPoints: number | null;
  submittedAt: string | null;
  answers: {
    questionId: string;
    questionText: string;
    questionType: string;
    correctAnswerText?: string | null;
    selectedOptionId?: string | null;
    textAnswer?: string | null;
    isCorrect?: boolean | null;
    options?: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
};

export type CheatFlaggedStudent = {
  studentId: string;
  fullName: string;
  flagCount: number;
  eventCount: number;
};

export const getStudentProfile = async (): Promise<StudentProfile> => {
  const data = await apiFetch<{ data?: StudentProfile } | StudentProfile>(
    "/api/student/profile",
  );
  return unwrapApi<StudentProfile>(data);
};

export const getAuthUsers = async (): Promise<AuthUser[]> => {
  const data = await apiFetch<{ data?: AuthUser[] } | AuthUser[]>(
    "/api/auth/users",
  );
  return unwrapApi<AuthUser[]>(data);
};

export const updateStudentProfile = async (
  payload: StudentProfile,
): Promise<StudentProfile> => {
  const data = await apiFetch<{ data?: StudentProfile } | StudentProfile>(
    "/api/student/profile",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return unwrapApi<StudentProfile>(data);
};

export const getStudentProfileForTeacher = async (
  studentId: string,
): Promise<StudentProfile> => {
  const data = await apiFetch<{ data?: StudentProfile } | StudentProfile>(
    `/api/teacher/students/${studentId}/profile`,
  );
  return unwrapApi<StudentProfile>(data);
};

export const getStudentResults = async (): Promise<StudentResultSummary[]> => {
  const data = await apiFetch<
    { data?: StudentResultSummary[] } | StudentResultSummary[]
  >("/api/student/results");
  return unwrapApi<StudentResultSummary[]>(data);
};

export const getTeacherExams = async (): Promise<TeacherExamSummary[]> => {
  const data = await apiFetch<
    { data?: TeacherExamSummary[] } | TeacherExamSummary[]
  >("/api/exams");
  return unwrapApi<TeacherExamSummary[]>(data);
};

export const getTeacherExamDetail = async (
  examId: string,
): Promise<TeacherExamDetail> => {
  const data = await apiFetch<{ data?: TeacherExamDetail } | TeacherExamDetail>(
    `/api/exams/${examId}`,
  );
  return unwrapApi<TeacherExamDetail>(data);
};

export const getTeacherExamSubmissions = async (
  examId: string,
): Promise<TeacherSubmissionSummary[]> => {
  const data = await apiFetch<
    { data?: TeacherSubmissionSummary[] } | TeacherSubmissionSummary[]
  >(`/api/teacher/exams/${examId}/submissions`);
  return unwrapApi<TeacherSubmissionSummary[]>(data);
};

export const getTeacherSessionResult = async (
  sessionId: string,
): Promise<TeacherSessionResult> => {
  const data = await apiFetch<
    { data?: TeacherSessionResult } | TeacherSessionResult
  >(`/api/teacher/sessions/${sessionId}/result`);
  return unwrapApi<TeacherSessionResult>(data);
};

export const getCheatFlaggedStudents = async (
  examId: string,
): Promise<CheatFlaggedStudent[]> => {
  const data = await apiFetch<
    { data?: CheatFlaggedStudent[] } | CheatFlaggedStudent[]
  >(`/api/cheat/flagged/${examId}`);
  return unwrapApi<CheatFlaggedStudent[]>(data);
};
