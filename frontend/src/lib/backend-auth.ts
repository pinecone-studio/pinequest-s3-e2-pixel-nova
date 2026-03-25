export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8787";

type ApiResponse<T> = { data?: T };

const unwrapData = <T,>(value: ApiResponse<T> | T): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as ApiResponse<T>).data ?? (value as T);
  }
  return value as T;
};

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

export const getStudentProfile = async (token: string): Promise<StudentProfile> => {
  const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load profile");
  }

  const data = (await res.json()) as ApiResponse<StudentProfile> | StudentProfile;
  return unwrapData<StudentProfile>(data);
};

export const getAuthUsers = async (): Promise<AuthUser[]> => {
  const res = await fetch(`${API_BASE_URL}/api/auth/users`);

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load users");
  }

  const data = (await res.json()) as ApiResponse<AuthUser[]> | AuthUser[];
  return unwrapData<AuthUser[]>(data);
};

export const updateStudentProfile = async (
  token: string,
  payload: StudentProfile,
): Promise<StudentProfile> => {
  const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to update profile");
  }

  const data = (await res.json()) as ApiResponse<StudentProfile> | StudentProfile;
  return unwrapData<StudentProfile>(data);
};

export const getStudentProfileForTeacher = async (
  token: string,
  studentId: string,
): Promise<StudentProfile> => {
  const res = await fetch(
    `${API_BASE_URL}/api/teacher/students/${studentId}/profile`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load student profile");
  }

  const data = (await res.json()) as ApiResponse<StudentProfile> | StudentProfile;
  return unwrapData<StudentProfile>(data);
};

export const getStudentResults = async (
  token: string,
): Promise<StudentResultSummary[]> => {
  const res = await fetch(`${API_BASE_URL}/api/student/results`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load results");
  }
  const data = (await res.json()) as
    | ApiResponse<StudentResultSummary[]>
    | StudentResultSummary[];
  return unwrapData<StudentResultSummary[]>(data);
};

export const getTeacherExams = async (
  token: string,
): Promise<TeacherExamSummary[]> => {
  const res = await fetch(`${API_BASE_URL}/api/exams`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load exams");
  }
  const data = (await res.json()) as
    | ApiResponse<TeacherExamSummary[]>
    | TeacherExamSummary[];
  return unwrapData<TeacherExamSummary[]>(data);
};

export const getTeacherExamDetail = async (
  token: string,
  examId: string,
): Promise<TeacherExamDetail> => {
  const res = await fetch(`${API_BASE_URL}/api/exams/${examId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load exam detail");
  }
  const data = (await res.json()) as
    | ApiResponse<TeacherExamDetail>
    | TeacherExamDetail;
  return unwrapData<TeacherExamDetail>(data);
};

export const getTeacherExamSubmissions = async (
  token: string,
  examId: string,
): Promise<TeacherSubmissionSummary[]> => {
  const res = await fetch(
    `${API_BASE_URL}/api/teacher/exams/${examId}/submissions`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load submissions");
  }
  const data = (await res.json()) as
    | ApiResponse<TeacherSubmissionSummary[]>
    | TeacherSubmissionSummary[];
  return unwrapData<TeacherSubmissionSummary[]>(data);
};

export const getTeacherSessionResult = async (
  token: string,
  sessionId: string,
): Promise<TeacherSessionResult> => {
  const res = await fetch(
    `${API_BASE_URL}/api/teacher/sessions/${sessionId}/result`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load session result");
  }
  const data = (await res.json()) as
    | ApiResponse<TeacherSessionResult>
    | TeacherSessionResult;
  return unwrapData<TeacherSessionResult>(data);
};

export const getCheatFlaggedStudents = async (
  token: string,
  examId: string,
): Promise<CheatFlaggedStudent[]> => {
  const res = await fetch(`${API_BASE_URL}/api/cheat/flagged/${examId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to load cheat flags");
  }
  const data = (await res.json()) as
    | ApiResponse<CheatFlaggedStudent[]>
    | CheatFlaggedStudent[];
  return unwrapData<CheatFlaggedStudent[]>(data);
};
