import {
	buildClassEntries,
	buildSubjectEntries,
	formatCompactXp,
	getPodiumEntries,
	type LeaderboardEntry,
} from "@/app/student/components/student-leaderboard-helpers";

const makeEntry = (overrides: Partial<LeaderboardEntry>): LeaderboardEntry => ({
	id: "student-1",
	fullName: "Saran T.",
	xp: 1200,
	level: 3,
	rank: 1,
	...overrides,
});

describe("student leaderboard helpers", () => {
	it("formats XP with compact suffix", () => {
		expect(formatCompactXp(999)).toBe("999");
		expect(formatCompactXp(1000)).toBe("1k");
		expect(formatCompactXp(1540)).toBe("1.5k");
	});

	it("builds class entries with metric percent bounds", () => {
		const entries = [
			makeEntry({ id: "a", rank: 1, xp: 500 }),
			makeEntry({ id: "b", rank: 2, xp: 1200 }),
			makeEntry({ id: "c", rank: 3, xp: 2000 }),
		];
		const result = buildClassEntries(entries);

		expect(result).toHaveLength(3);
		result.forEach((entry) => {
			expect(entry.focusLabel).toBe("10-р анги");
			expect(entry.metricPercent).toBeGreaterThanOrEqual(55);
			expect(entry.metricPercent).toBeLessThanOrEqual(99);
		});
	});

	it("builds subject entries and re-ranks by metric value", () => {
		const entries = [
			makeEntry({ id: "alpha", rank: 1, xp: 900 }),
			makeEntry({ id: "bravo", rank: 2, xp: 1200 }),
			makeEntry({ id: "charlie", rank: 3, xp: 1400 }),
		];
		const result = buildSubjectEntries(entries);

		expect(result[0].rank).toBe(1);
		expect(result[1].rank).toBe(2);
		expect(result[2].rank).toBe(3);
		result.forEach((entry) => {
			expect(entry.focusLabel.length).toBeGreaterThan(0);
		});
	});

	it("returns podium entries in 2-1-3 order", () => {
		const entries = [
			makeEntry({ id: "first", rank: 1 }),
			makeEntry({ id: "second", rank: 2 }),
			makeEntry({ id: "third", rank: 3 }),
		];
		const podium = getPodiumEntries(entries);
		expect(podium.map((entry) => entry.rank)).toEqual([2, 1, 3]);
	});
});
