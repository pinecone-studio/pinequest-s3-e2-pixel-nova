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
  subjectName?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  status?: string | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  roomCode?: string | null;
  durationMin?: number;
  expectedStudentsCount?: number | null;
  locationPolicy?: "anywhere" | "school_only" | null;
  locationLabel?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  allowedRadiusMeters?: number | null;
  requiresAudioRecording?: boolean;
  enabledCheatDetections?: string[];
  createdAt?: string;
};

export type ExamLocationConfig = {
  locationPolicy: "anywhere" | "school_only";
  locationLabel?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  allowedRadiusMeters?: number;
};

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const mapQuestionTypeToBackend = (
  type: SyncExamPayload["questions"][number]["type"],
) => {
  switch (type) {
    case "mcq":
      return "multiple_choice";
    case "open":
    case "text":
    default:
      return "short_answer";
  }
};

const buildQuestionPayload = (
  question: SyncExamPayload["questions"][number],
) => {
  const normalizedOptions = (question.options ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
  const isMcq = question.type === "mcq";
  const options = isMcq
    ? normalizedOptions.map((text, index) => ({
        label: OPTION_LABELS[index] ?? String(index + 1),
        text,
        isCorrect: text === question.correctAnswer,
      }))
    : undefined;

  return {
    type: mapQuestionTypeToBackend(question.type),
    questionText: question.text.trim(),
    points: question.points,
    correctAnswerText:
      !isMcq && question.correctAnswer.trim().length > 0
        ? question.correctAnswer.trim()
        : undefined,
    imageUrl: question.imageUrl,
    options: options && options.length > 0 ? options : undefined,
  };
};

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

const unwrap = async <T>(response: Response): Promise<T> => {
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
  subjectName?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  duration: number;
  scheduledAt?: string | null;
  expectedStudentsCount?: number;
  location?: ExamLocationConfig;
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
  location?: ExamLocationConfig;
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
      subjectName: exam.subjectName,
      examType: exam.examType,
      className: exam.className,
      groupName: exam.groupName,
      durationMin: exam.duration,
      expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    }),
  });

  if (!createRes.ok) {
    throw new Error(
      await readBackendError(createRes, "Backend exam create failed"),
    );
  }

  const created = await unwrap<RemoteExamDetail>(createRes);

  if (exam.questions.length > 0) {
    const batchPayload = exam.questions.map(buildQuestionPayload);

    const batchRes = await fetch(
      `${API_BASE_URL}/api/exams/${created.id}/questions/batch`,
      {
        method: "POST",
        headers: buildHeaders(user),
        body: JSON.stringify({ questions: batchPayload }),
      },
    );

    if (!batchRes.ok) {
      for (const question of exam.questions) {
        const singleRes = await fetch(
          `${API_BASE_URL}/api/exams/${created.id}/questions`,
          {
            method: "POST",
            headers: buildHeaders(user),
            body: JSON.stringify(buildQuestionPayload(question)),
          },
        );

        if (!singleRes.ok) {
          throw new Error(
            await readBackendError(
              singleRes,
              "Backend question create failed",
            ),
          );
        }
      }
    }
  }

  if (exam.scheduledAt && exam.questions.length > 0) {
    const scheduleRes = await fetch(
      `${API_BASE_URL}/api/exams/${created.id}/schedule`,
      {
        method: "POST",
        headers: buildHeaders(user),
        body: JSON.stringify({
          scheduledAt: exam.scheduledAt,
          locationPolicy: exam.location?.locationPolicy,
          locationLabel: exam.location?.locationLabel,
          locationLatitude: exam.location?.locationLatitude,
          locationLongitude: exam.location?.locationLongitude,
          allowedRadiusMeters: exam.location?.allowedRadiusMeters,
        }),
      },
    );

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

  const scheduleRes = await fetch(
    `${API_BASE_URL}/api/exams/${exam.examId}/schedule`,
    {
      method: "POST",
      headers: buildHeaders(user),
      body: JSON.stringify({
        scheduledAt: exam.scheduledAt,
        locationPolicy: exam.location?.locationPolicy,
        locationLabel: exam.location?.locationLabel,
        locationLatitude: exam.location?.locationLatitude,
        locationLongitude: exam.location?.locationLongitude,
        allowedRadiusMeters: exam.location?.allowedRadiusMeters,
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
