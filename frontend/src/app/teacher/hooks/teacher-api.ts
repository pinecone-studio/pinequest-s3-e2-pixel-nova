import { API_BASE_URL, apiFetch, getApiUserContext, unwrapApi } from "@/lib/api-client";
import type {
  Exam,
  ExamAttendanceStats,
  ExamRosterDetail,
  Question,
  AiAcceptedDraftResponse,
  AiExamGeneratorInput,
  AiGeneratedDraft,
  QuestionInsight,
  Submission,
  XpLeaderboardEntry,
} from "../types";

const readStreamError = async (response: Response) => {
  try {
    const payload = (await response.json()) as
      | { error?: { message?: string }; message?: string }
      | undefined;
    return payload?.error?.message || payload?.message || `Request failed: ${response.status}`;
  } catch {
    const text = await response.text();
    return text || `Request failed: ${response.status}`;
  }
};

const parseSseEvent = (rawChunk: string) => {
  const normalized = rawChunk.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
};

type TeacherExamSummary = {
  id: string;
  title: string;
  description?: string | null;
  examType?: string | null;
  className?: string | null;
  groupName?: string | null;
  scheduledAt: string | null;
  durationMin: number;
  roomCode: string | null;
  status: string;
  createdAt: string;
  expectedStudentsCount?: number | null;
  questionCount?: number | null;
  submissionCount?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  locationPolicy?: "anywhere" | "school_only" | null;
  locationLabel?: string | null;
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  allowedRadiusMeters?: number | null;
};

type TeacherExamDetail = TeacherExamSummary & {
  questions: {
    id: string;
    questionText: string;
    type: string;
    correctAnswerText?: string | null;
    points: number;
    imageUrl?: string | null;
    options?: { id: string; label: string; text: string; isCorrect: boolean }[];
  }[];
};

export type TeacherExamLiveUpdate = {
  roster: ExamRosterDetail;
  stats: ExamAttendanceStats;
  examStatus: string;
  generatedAt: string;
};

export const fetchTeacherExams = async (
  teacherId?: string,
): Promise<Exam[]> => {
  const listData = await apiFetch<
    { data?: TeacherExamSummary[] } | TeacherExamSummary[]
  >("/api/teacher/exams/summary", {}, "teacher", teacherId);
  const summaries = unwrapApi(listData);
  return summaries.map((exam) => ({
    id: exam.id,
    title: exam.title,
    description: exam.description ?? null,
    examType: exam.examType ?? null,
    className: exam.className ?? null,
    groupName: exam.groupName ?? null,
    status: exam.status,
    scheduledAt: exam.scheduledAt ?? null,
    examStartedAt: exam.startedAt ?? null,
    finishedAt: exam.finishedAt ?? null,
    roomCode: exam.roomCode ?? "",
    expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    questionCount: Number(exam.questionCount ?? 0),
    submissionCount: Number(exam.submissionCount ?? 0),
    locationPolicy: exam.locationPolicy ?? "anywhere",
    locationLabel: exam.locationLabel ?? null,
    locationLatitude: exam.locationLatitude ?? null,
    locationLongitude: exam.locationLongitude ?? null,
    allowedRadiusMeters: exam.allowedRadiusMeters ?? 3000,
    questions: [],
    duration: exam.durationMin ?? 60,
    createdAt: exam.createdAt,
  }));
};

export const fetchTeacherExamDetail = async (
  examId: string,
  teacherId?: string,
): Promise<Exam> => {
  const detailData = await apiFetch<
    { data?: TeacherExamDetail } | TeacherExamDetail
  >(`/api/exams/${examId}`, {}, "teacher", teacherId);
  const exam = unwrapApi(detailData);
  const mappedQuestions: Question[] = (exam.questions ?? []).map((question) => {
    const sortedOptions = (question.options ?? []).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
    const optionTexts = sortedOptions.map((opt) => opt.text);
    const correctFromOption =
      sortedOptions.find((opt) => opt.isCorrect)?.text ?? "";
    return {
      id: question.id,
      text: question.questionText,
      type: (question.type as Question["type"]) ?? "text",
      options: optionTexts.length > 0 ? optionTexts : undefined,
      correctAnswer: question.correctAnswerText ?? correctFromOption ?? "",
      points: Number(question.points ?? 1),
      imageUrl: question.imageUrl ?? undefined,
    };
  });

  return {
    id: exam.id,
    title: exam.title,
    description: exam.description ?? null,
    examType: exam.examType ?? null,
    className: exam.className ?? null,
    groupName: exam.groupName ?? null,
    status: exam.status,
    scheduledAt: exam.scheduledAt ?? null,
    examStartedAt: exam.startedAt ?? null,
    finishedAt: exam.finishedAt ?? null,
    roomCode: exam.roomCode ?? "",
    expectedStudentsCount: exam.expectedStudentsCount ?? 0,
    questionCount: mappedQuestions.length,
    locationPolicy: exam.locationPolicy ?? "anywhere",
    locationLabel: exam.locationLabel ?? null,
    locationLatitude: exam.locationLatitude ?? null,
    locationLongitude: exam.locationLongitude ?? null,
    allowedRadiusMeters: exam.allowedRadiusMeters ?? 3000,
    questions: mappedQuestions,
    duration: exam.durationMin ?? 60,
    createdAt: exam.createdAt,
  };
};

export const fetchTeacherSubmissions = async (
  examId: string,
  teacherId?: string,
): Promise<Submission[]> => {
  const data = await apiFetch<{ data?: Submission[] } | Submission[]>(
    `/api/teacher/exams/${examId}/submissions`,
    {},
    "teacher",
    teacherId,
  );
  return unwrapApi(data).map((item) => ({
    ...item,
    percentage: item.score ?? 0,
    totalPoints: item.totalPoints ?? 0,
  }));
};

export const fetchTeacherExamRoster = async (
  examId: string,
  teacherId?: string,
): Promise<ExamRosterDetail> => {
  const data = await apiFetch<{ data?: ExamRosterDetail } | ExamRosterDetail>(
    `/api/teacher/exams/${examId}/roster`,
    {},
    "teacher",
    teacherId,
  );

  return unwrapApi(data);
};

export const openTeacherExamLiveStream = (
  examId: string,
  handlers: {
    onMessage: (payload: TeacherExamLiveUpdate) => void;
    onError?: (error: Error) => void;
  },
  teacherId?: string,
) => {
  const controller = new AbortController();
  const { userId, userRole, userName } = getApiUserContext("teacher");
  const headers = new Headers();
  headers.set("Accept", "text/event-stream");
  headers.set("x-user-id", teacherId ?? userId);
  headers.set("x-user-role", userRole);
  headers.set("x-user-name-encoded", encodeURIComponent(userName));

  void (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teacher/exams/${examId}/live`, {
        headers,
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await readStreamError(response));
      }

      if (!response.body) {
        throw new Error("Live stream body was empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

        let boundaryIndex = buffer.indexOf("\n\n");
        while (boundaryIndex !== -1) {
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);

          if (rawEvent.trim()) {
            const parsed = parseSseEvent(rawEvent);
            if (parsed.event === "snapshot" && parsed.data) {
              handlers.onMessage(JSON.parse(parsed.data) as TeacherExamLiveUpdate);
            } else if (parsed.event === "error" && parsed.data) {
              const payload = JSON.parse(parsed.data) as { message?: string };
              throw new Error(payload.message || "Teacher live stream failed.");
            }
          }

          boundaryIndex = buffer.indexOf("\n\n");
        }
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      handlers.onError?.(
        error instanceof Error ? error : new Error("Teacher live stream failed."),
      );
    }
  })();

  return () => controller.abort();
};

type LeaderboardItem = {
  id: string;
  fullName: string;
  xp: number;
  level:
    | number
    | {
        level: number;
        name?: string;
        icon?: string;
      };
};

export const fetchXpLeaderboard = async (): Promise<XpLeaderboardEntry[]> => {
  const data = await apiFetch<{ data?: LeaderboardItem[] } | LeaderboardItem[]>(
    "/api/xp/leaderboard",
    {},
    "teacher",
  );
  const list = unwrapApi<LeaderboardItem[]>(data);
  return list.map((student) => {
    const rawLevel = student.level;
    const levelValue = typeof rawLevel === "number" ? rawLevel : rawLevel.level;
    const levelName =
      typeof rawLevel === "object" && rawLevel?.name ? rawLevel.name : "Level";
    const icon =
      typeof rawLevel === "object" && rawLevel?.icon ? rawLevel.icon : "⭐";
    return {
      studentId: student.id,
      name: student.fullName,
      xp: student.xp,
      level: levelValue ?? 1,
      levelName,
      icon,
      examsTaken: 0,
      progressPercent: 0,
      nextLevelXp: 0,
      lastActivity: null,
    };
  });
};

type ExamQuestionInsightsPayload = {
  questionStats: QuestionInsight[];
  mostMissed: QuestionInsight[];
  mostCorrect: QuestionInsight[];
};

export const fetchExamQuestionInsights = async (
  examId: string,
  teacherId?: string,
): Promise<ExamQuestionInsightsPayload> => {
  const data = await apiFetch<
    { data?: ExamQuestionInsightsPayload } | ExamQuestionInsightsPayload
  >(`/api/analytics/exam/${examId}/questions`, {}, "teacher", teacherId);
  return unwrapApi(data);
};

export const generateAiExamDraft = async (
  input: AiExamGeneratorInput,
  teacherId?: string,
): Promise<AiGeneratedDraft> => {
  const data = await apiFetch<
    { data?: { draft: AiGeneratedDraft } } | { draft: AiGeneratedDraft }
  >(
    "/api/agent/exam-generator/generate",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    "teacher",
    teacherId,
  );
  const payload = unwrapApi(data);
  return "draft" in payload ? payload.draft : payload;
};

export const saveAcceptedAiDraft = async (
  generatorInput: AiExamGeneratorInput,
  draft: AiGeneratedDraft,
  teacherId?: string,
): Promise<AiAcceptedDraftResponse> => {
  const data = await apiFetch<
    { data?: AiAcceptedDraftResponse } | AiAcceptedDraftResponse
  >(
    "/api/agent/exam-generator/save",
    {
      method: "POST",
      body: JSON.stringify({
        generatorInput,
        draft,
      }),
    },
    "teacher",
    teacherId,
  );
  return unwrapApi(data);
};
