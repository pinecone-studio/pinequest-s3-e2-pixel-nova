import { API_BASE_URL } from "./api-client";

type RoleUser = {
  id: string;
  role: "teacher" | "student";
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
};

type RemoteExamDetail = {
  id: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  roomCode?: string | null;
  durationMin?: number;
  expectedStudentsCount?: number | null;
  createdAt?: string;
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const readBackendError = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return payload?.error?.message || payload?.message || fallback;
  } catch {
    const text = await response.text();
    return text || fallback;
  }
};

const unwrap = async <T,>(response: Response): Promise<T> => {
  const payload = (await response.json()) as ApiEnvelope<T> | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
};

const buildHeaders = (user: RoleUser) => ({
  "Content-Type": "application/json",
  "x-user-id": user.id,
  "x-user-role": user.role,
});

export type SyncExamPayload = {
  title: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  duration: number;
  scheduledAt?: string | null;
  expectedStudentsCount?: number;
  questions: Array<{
    type: "text" | "open" | "mcq";
    text: string;
    points: number;
    correctAnswer: string;
    imageUrl?: string;
    options?: string[];
  }>;
};

export type ScheduleExistingExamPayload = {
  examId: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  duration: number;
  scheduledAt: string;
  expectedStudentsCount?: number;
};

export const syncExamToBackend = async (
  user: RoleUser | null | undefined,
  exam: SyncExamPayload,
) => {
  if (!user || user.role !== "teacher") return null;

  const createRes = await fetch(`${API_BASE_URL}/api/exams`, {
    method: "POST",
    headers: buildHeaders(user),
    body: JSON.stringify({
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      className: exam.className,
      groupName: exam.groupName,
      durationMin: exam.duration,
      expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    }),
  });

  if (!createRes.ok) {
    throw new Error(await readBackendError(createRes, "Backend exam create failed"));
  }

  const created = await unwrap<RemoteExamDetail>(createRes);

  for (const question of exam.questions) {
    const options = question.options?.map((text, index) => ({
      label: OPTION_LABELS[index] ?? String(index + 1),
      text,
      isCorrect: text === question.correctAnswer,
    }));

    const questionRes = await fetch(
      `${API_BASE_URL}/api/exams/${created.id}/questions`,
      {
        method: "POST",
        headers: buildHeaders(user),
        body: JSON.stringify({
          type: question.type,
          questionText: question.text,
          points: question.points,
          correctAnswerText: question.correctAnswer,
          imageUrl: question.imageUrl,
          options: options?.length ? options : undefined,
        }),
      },
    );

    if (!questionRes.ok) {
      throw new Error(
        await readBackendError(questionRes, "Backend question create failed"),
      );
    }
  }

  if (exam.scheduledAt && exam.questions.length > 0) {
    const scheduleRes = await fetch(`${API_BASE_URL}/api/exams/${created.id}/schedule`, {
      method: "POST",
      headers: buildHeaders(user),
      body: JSON.stringify({
        scheduledAt: exam.scheduledAt,
      }),
    });

    if (!scheduleRes.ok) {
      throw new Error(
        await readBackendError(scheduleRes, "Backend exam schedule failed"),
      );
    }

    return await unwrap<RemoteExamDetail>(scheduleRes);
  }

  return created;
};

export const scheduleExistingExamInBackend = async (
  user: RoleUser | null | undefined,
  exam: ScheduleExistingExamPayload,
) => {
  if (!user || user.role !== "teacher") return null;

  const updateRes = await fetch(`${API_BASE_URL}/api/exams/${exam.examId}`, {
    method: "PUT",
    headers: buildHeaders(user),
    body: JSON.stringify({
      title: exam.title,
      description: exam.description,
      examType: exam.examType,
      className: exam.className,
      groupName: exam.groupName,
      durationMin: exam.duration,
      expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    }),
  });

  if (!updateRes.ok) {
    throw new Error(await readBackendError(updateRes, "Backend exam update failed"));
  }

  const scheduleRes = await fetch(
    `${API_BASE_URL}/api/exams/${exam.examId}/schedule`,
    {
      method: "POST",
      headers: buildHeaders(user),
      body: JSON.stringify({
        scheduledAt: exam.scheduledAt,
      }),
    },
  );

  if (!scheduleRes.ok) {
    throw new Error(
      await readBackendError(scheduleRes, "Backend exam schedule failed"),
    );
  }

  return await unwrap<RemoteExamDetail>(scheduleRes);
};
