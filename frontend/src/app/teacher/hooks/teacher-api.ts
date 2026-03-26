import { apiFetch, unwrapApi } from "@/lib/api-client";
import type { Exam, Question, Submission, XpLeaderboardEntry } from "../types";

type TeacherExamSummary = {
  id: string;
  title: string;
  scheduledAt: string | null;
  durationMin: number;
  roomCode: string | null;
  status: string;
  createdAt: string;
  expectedStudentsCount?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
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

export const fetchTeacherExams = async (): Promise<Exam[]> => {
  const listData = await apiFetch<{ data?: TeacherExamSummary[] } | TeacherExamSummary[]>(
    "/api/exams",
    {},
    "teacher",
  );
  const summaries = unwrapApi(listData);
  const details = await Promise.all(
    summaries.map(async (exam) => {
      const detailData = await apiFetch<{ data?: TeacherExamDetail } | TeacherExamDetail>(
        `/api/exams/${exam.id}`,
        {},
        "teacher",
      );
      return unwrapApi(detailData);
    }),
  );

  return details.map((exam) => {
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
      scheduledAt: exam.scheduledAt ?? null,
      examStartedAt: exam.startedAt ?? null,
      roomCode: exam.roomCode ?? "",
      expectedStudentsCount: exam.expectedStudentsCount ?? 0,
      questions: mappedQuestions,
      duration: exam.durationMin ?? 60,
      createdAt: exam.createdAt,
    };
  });
};

export const fetchTeacherSubmissions = async (
  examId: string,
): Promise<Submission[]> => {
  const data = await apiFetch<{ data?: Submission[] } | Submission[]>(
    `/api/teacher/exams/${examId}/submissions`,
    {},
    "teacher",
  );
  return unwrapApi(data).map((item) => ({
    ...item,
    percentage: item.score ?? 0,
    totalPoints: item.totalPoints ?? 0,
  }));
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
  const data = await apiFetch<
    { data?: LeaderboardItem[] } | LeaderboardItem[]
  >("/api/xp/leaderboard", {}, "teacher");
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
