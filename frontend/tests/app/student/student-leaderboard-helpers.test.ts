import {
  buildImprovementEntries,
  buildMockImprovementEntries,
  buildProgressLeaderboardEntries,
  formatAverageScore,
  getPodiumEntries,
  type LeaderboardEntry,
} from "@/app/student/components/student-leaderboard-helpers";
import type { StudentImprovementLeaderboardEntry } from "@/lib/backend-auth";

const makeEntry = (overrides: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  id: "student-1",
  fullName: "Saran T.",
  level: 3,
  rank: 1,
  averageScore: 92,
  examCount: 4,
  ...overrides,
});

const makeImprovementEntry = (
  overrides: Partial<StudentImprovementLeaderboardEntry>,
): StudentImprovementLeaderboardEntry => ({
  id: "student-1",
  fullName: "Saran T.",
  level: 1,
  rank: 1,
  xp: 20,
  examCount: 3,
  improvementCount: 2,
  missedCount: 0,
  ...overrides,
});

describe("student leaderboard helpers", () => {
  it("formats average scores without trailing .0", () => {
    expect(formatAverageScore(91)).toBe("91");
    expect(formatAverageScore(91.04)).toBe("91");
    expect(formatAverageScore(91.25)).toBe("91.3");
  });

  it("builds ranked progress leaderboard entries with bounded metric percentages", () => {
    const entries = [
      makeEntry({ id: "a", rank: 2, averageScore: 88 }),
      makeEntry({ id: "b", rank: 1, averageScore: 96 }),
      makeEntry({ id: "c", rank: 3, averageScore: 74 }),
    ];

    const result = buildProgressLeaderboardEntries(entries);

    expect(result.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    result.forEach((entry) => {
      expect(entry.metricPercent).toBeGreaterThanOrEqual(55);
      expect(entry.metricPercent).toBeLessThanOrEqual(99);
    });
  });

  it("returns podium entries in 2-1-3 order", () => {
    const entries = buildProgressLeaderboardEntries([
      makeEntry({ id: "first", rank: 1, averageScore: 98 }),
      makeEntry({ id: "second", rank: 2, averageScore: 95 }),
      makeEntry({ id: "third", rank: 3, averageScore: 90 }),
    ]);

    const podium = getPodiumEntries(entries);

    expect(podium.map((entry) => entry.rank)).toEqual([2, 1, 3]);
  });

  it("builds improvement leaderboard entries from separate growth XP", () => {
    const entries = buildImprovementEntries([
      makeImprovementEntry({ id: "b", rank: 2, xp: 10 }),
      makeImprovementEntry({ id: "a", rank: 1, xp: 25 }),
      makeImprovementEntry({ id: "c", rank: 3, xp: -10, missedCount: 1, improvementCount: 0 }),
    ]);

    expect(entries.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(entries[0]?.xp).toBe(25);
    expect(entries[2]?.metricPercent).toBeGreaterThanOrEqual(55);
  });

  it("fills the improvement leaderboard with mock entries up to top 10", () => {
    const entries = buildMockImprovementEntries({
      entries: [
        makeImprovementEntry({
          id: "student-2",
          fullName: "Bataa B.",
          rank: 1,
          xp: 18,
          improvementCount: 1,
        }),
      ],
      currentUserId: "current-student",
      currentUserName: "Anu Bold",
    });

    expect(entries).toHaveLength(10);
    expect(entries.map((entry) => entry.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(entries.some((entry) => entry.id === "current-student")).toBe(true);
    expect(
      entries.some((entry) => entry.id.startsWith("mock-improvement-")),
    ).toBe(true);
    expect(entries[0]?.xp).toBeGreaterThanOrEqual(entries[1]?.xp ?? 0);
    entries.forEach((entry) => {
      expect(entry.metricPercent).toBeGreaterThanOrEqual(55);
      expect(entry.metricPercent).toBeLessThanOrEqual(99);
    });
  });
});
