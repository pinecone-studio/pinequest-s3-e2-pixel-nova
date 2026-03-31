import {
  buildProgressLeaderboardEntries,
  formatAverageScore,
  getPodiumEntries,
  type LeaderboardEntry,
} from "@/app/student/components/student-leaderboard-helpers";

const makeEntry = (overrides: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  id: "student-1",
  fullName: "Saran T.",
  level: 3,
  rank: 1,
  averageScore: 92,
  examCount: 4,
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
});
