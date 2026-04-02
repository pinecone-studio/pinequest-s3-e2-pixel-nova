import { buildChartData } from "@/app/teacher/components/AnalyticsTab";

describe("AnalyticsTab chart helpers", () => {
	it("shows only months from the current year up to the current month", () => {
		const chartData = buildChartData(
			[
				{ month: "2025-12", avgScore: 77, passRate: 70 },
				{ month: "2026-03", avgScore: 88.6, passRate: 67 },
				{ month: "2026-04", avgScore: 91.5, passRate: 100 },
			],
			new Date(2026, 3, 2),
		);

		expect(chartData).toEqual([
			{ name: "1 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "2 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "3 сар", "дундаж": 88.6, "тэнцсэн": 67 },
			{ name: "4 сар", "дундаж": 91.5, "тэнцсэн": 100 },
		]);
	});
});
