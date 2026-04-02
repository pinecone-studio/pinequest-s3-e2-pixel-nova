import { buildChartData } from "@/app/teacher/components/AnalyticsTab";

describe("AnalyticsTab chart helpers", () => {
	it("shows months from the current month through the end of the year", () => {
		const chartData = buildChartData(
			[
				{ month: "2026-04", avgScore: 91.5, passRate: 100 },
				{ month: "2026-11", avgScore: 77, passRate: 70 },
			],
			new Date(2026, 3, 2),
		);

		expect(chartData).toEqual([
			{ name: "4 сар", "дундаж": 91.5, "тэнцсэн": 100 },
			{ name: "5 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "6 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "7 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "8 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "9 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "10 сар", "дундаж": undefined, "тэнцсэн": undefined },
			{ name: "11 сар", "дундаж": 77, "тэнцсэн": 70 },
			{ name: "12 сар", "дундаж": undefined, "тэнцсэн": undefined },
		]);
	});
});
