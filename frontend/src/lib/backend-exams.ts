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
  scheduledAt?: string | null;
  startedAt?: string | null;
  roomCode?: string | null;
  durationMin?: number;
  expectedStudentsCount?: number | null;
  createdAt?: string;
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

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
      durationMin: exam.duration,
      expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    }),
  });

  if (!createRes.ok) {
    const message = await createRes.text();
    throw new Error(message || "Backend exam create failed");
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
      const message = await questionRes.text();
      throw new Error(message || "Backend question create failed");
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
      const message = await scheduleRes.text();
      throw new Error(message || "Backend exam schedule failed");
    }

    return await unwrap<RemoteExamDetail>(scheduleRes);
  }

  return created;
};
