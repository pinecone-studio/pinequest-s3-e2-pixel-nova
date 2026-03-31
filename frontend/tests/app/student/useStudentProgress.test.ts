const mockGetXpProfile = jest.fn();
const mockGetXpHistory = jest.fn();
const mockGetStudentResults = jest.fn();
const mockGetStudentTermRank = jest.fn();
const mockGetStudentTermLeaderboard = jest.fn();
const mockGetStudentProgressRank = jest.fn();
const mockGetStudentImprovementLeaderboard = jest.fn();

jest.mock("@/api/xp", () => ({
  getXpProfile: (...args: unknown[]) => mockGetXpProfile(...args),
  getXpHistory: (...args: unknown[]) => mockGetXpHistory(...args),
}));

jest.mock("@/lib/backend-auth", () => ({
  getStudentResults: (...args: unknown[]) => mockGetStudentResults(...args),
  getStudentTermRank: (...args: unknown[]) => mockGetStudentTermRank(...args),
  getStudentTermLeaderboard: (...args: unknown[]) =>
    mockGetStudentTermLeaderboard(...args),
  getStudentProgressRank: (...args: unknown[]) =>
    mockGetStudentProgressRank(...args),
  getStudentImprovementLeaderboard: (...args: unknown[]) =>
    mockGetStudentImprovementLeaderboard(...args),
}));

jest.mock("@/lib/examGuard", () => ({
  getLevel: jest.fn((xp: number) => {
    if (xp >= 500) return { level: 3, name: "Дайчин", minXP: 500, icon: "⚔️" };
    if (xp >= 200)
      return { level: 2, name: "Суралцагч", minXP: 200, icon: "📖" };
    return { level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" };
  }),
  LEVELS: [
    { level: 1, name: "Анхдагч", minXP: 0, icon: "🌱" },
    { level: 2, name: "Суралцагч", minXP: 200, icon: "📖" },
    { level: 3, name: "Дайчин", minXP: 500, icon: "⚔️" },
    { level: 4, name: "Мастер", minXP: 1000, icon: "🏆" },
  ],
}));

jest.mock("@/app/student/utils", () => ({
  gradeFromPercentage: jest.fn((p: number) =>
    p >= 90 ? "A" : p >= 80 ? "B" : p >= 70 ? "C" : p >= 60 ? "D" : "F",
  ),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useStudentProgress } from "@/app/student/hooks/useStudentProgress";
import type { User } from "@/lib/examGuard";

const mockUser: User = {
  id: "s1",
  username: "Бат",
  password: "",
  role: "student",
  createdAt: "2024-01-01",
};

const mockResults = [
  {
    examId: "e1",
    earnedPoints: 90,
    score: 90,
    totalPoints: 100,
    submittedAt: "2024-06-02",
  },
  {
    examId: "e2",
    earnedPoints: 75,
    score: 75,
    totalPoints: 100,
    submittedAt: "2024-06-01",
  },
];

describe("useStudentProgress", () => {
  beforeEach(() => {
    mockGetXpProfile.mockResolvedValue({
      xp: 250,
      level: 2,
      rank: 3,
      totalStudents: 12,
    });
    mockGetXpHistory.mockResolvedValue([]);
    mockGetStudentTermLeaderboard.mockResolvedValue([
      { rank: 1, id: "s9", fullName: "Сурагч 1", xp: 500, level: 3 },
      { rank: 2, id: "s1", fullName: "Бат", xp: 250, level: 2 },
    ]);
    mockGetStudentResults.mockResolvedValue(mockResults);
    mockGetStudentTermRank.mockResolvedValue({
      rank: 2,
      totalStudents: 5,
      termExamCount: 2,
      xp: 250,
      level: 2,
    });
    mockGetStudentProgressRank.mockResolvedValue({
      rank: 1,
      totalStudents: 5,
      progressExamCount: 4,
      xp: 120,
      level: 2,
      isPrivate: true,
    });
    mockGetStudentImprovementLeaderboard.mockResolvedValue([
      {
        id: "s2",
        rank: 1,
        fullName: "Сараа",
        xp: 35,
        level: 4,
        examCount: 4,
        improvementCount: 3,
        missedCount: 0,
      }
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns default values when no user", () => {
    const { result } = renderHook(() => useStudentProgress(null));

    expect(result.current.studentProgress).toEqual({
      xp: 0,
      level: 1,
      history: [],
    });
    expect(result.current.studentHistory).toEqual([]);
    expect(result.current.termRankOverview).toEqual({
      rank: null,
      totalStudents: 0,
      termExamCount: 0,
      xp: 0,
      level: 1,
    });
    expect(result.current.progressRankOverview).toEqual({
      rank: null,
      totalStudents: 0,
      progressExamCount: 0,
      xp: 0,
      level: 1,
      isPrivate: true,
    });
    expect(result.current.improvementLeaderboard).toEqual([]);
    expect(result.current.termLeaderboardEntries).toEqual([]);
  });

  it("loads XP profile, student results, and term rank", async () => {
    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.studentProgress.level).toBe(2);
    expect(result.current.rankOverview).toEqual({
      rank: 3,
      totalStudents: 12,
    });
    expect(result.current.termRankOverview).toEqual({
      rank: 2,
      totalStudents: 5,
      termExamCount: 2,
      xp: 250,
      level: 2,
    });
    expect(result.current.progressRankOverview).toEqual({
      rank: 1,
      totalStudents: 5,
      progressExamCount: 4,
      xp: 120,
      level: 2,
      isPrivate: true,
    });
    expect(result.current.termLeaderboardEntries).toHaveLength(2);
    expect(result.current.improvementLeaderboard).toHaveLength(1);
    expect(result.current.studentHistory).toHaveLength(2);
  });

  it("sorts history by date descending", async () => {
    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentHistory).toHaveLength(2));

    expect(result.current.studentHistory[0].examId).toBe("e1");
    expect(result.current.studentHistory[1].examId).toBe("e2");
  });

  it("computes levelInfo from XP", async () => {
    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.levelInfo.level).toBe(2);
    expect(result.current.levelInfo.name).toBe("Суралцагч");
  });

  it("computes nextLevel", async () => {
    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.nextLevel.level).toBe(3);
  });

  it("computes progressSegments (0-10)", async () => {
    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.progressSegments).toBe(2);
  });

  it("handles XP API error gracefully", async () => {
    mockGetXpProfile.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentHistory).toHaveLength(2));

    expect(result.current.studentProgress.xp).toBe(0);
    expect(result.current.studentProgress.level).toBe(1);
    expect(result.current.rankOverview).toEqual({
      rank: null,
      totalStudents: 0,
    });
  });

  it("handles leaderboard API error gracefully", async () => {
    mockGetStudentTermLeaderboard.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.termLeaderboardEntries).toEqual([]);
  });

  it("handles results API error gracefully", async () => {
    mockGetStudentResults.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.studentHistory).toEqual([]);
  });

  it("handles term rank API error gracefully", async () => {
    mockGetStudentTermRank.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.termRankOverview).toEqual({
      rank: null,
      totalStudents: 0,
      termExamCount: 0,
      xp: 0,
      level: 1,
    });
  });

  it("handles progress rank API error gracefully", async () => {
    mockGetStudentProgressRank.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.progressRankOverview).toEqual({
      rank: null,
      totalStudents: 0,
      progressExamCount: 0,
      xp: 0,
      level: 1,
      isPrivate: true,
    });
  });

  it("handles improvement leaderboard API error gracefully", async () => {
    mockGetStudentImprovementLeaderboard.mockRejectedValue(new Error("fail"));

    const { result } = renderHook(() => useStudentProgress(mockUser));

    await waitFor(() => expect(result.current.studentProgress.xp).toBe(250));

    expect(result.current.improvementLeaderboard).toEqual([]);
  });
});
