"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
} from "recharts";
import { AlarmClockIcon, ZapIcon } from "lucide-react";
import { useAnalyticsData } from "../hooks/useAnalyticsData";
import type { Exam, ExamStatsSummary, XpLeaderboardEntry } from "../types";

type AnalyticsTabProps = {
	teacherId: string | null;
	exams: Exam[];
	fallbackXpLeaderboard: XpLeaderboardEntry[];
	fallbackExamStats: ExamStatsSummary | null;
};

// ─── Chart helpers ───────────────────────────────────────────────────────────
function buildChartData(
	monthlyData: { month: string; avgScore: number | null; passRate: number | null }[],
) {
	const now = new Date();
	return Array.from({ length: 11 }, (_, i) => {
		const date = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1);
		const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
		const found = monthlyData.find((m) => m.month === key);
		return {
			name: `${date.getMonth() + 1} сар`,
			дундаж: found?.avgScore ?? undefined,
			тэнцсэн: found?.passRate ?? undefined,
		};
	});
}

const formatXp = (xp: number) =>
	xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp.toString();

const getRankStyle = (index: number) =>
	index === 0 ? "bg-[#FFA705] text-white" : "bg-[#e8eef6] text-slate-500";

const getLevelEmoji = (level: number) => {
	if (level >= 10) return "👑";
	if (level >= 7) return "🏆";
	if (level >= 5) return "🥇";
	if (level >= 3) return "⭐";
	return "🐱";
};

// ─── Main component ──────────────────────────────────────────────────────────
export default function AnalyticsTab({
	teacherId,
	exams,
	fallbackXpLeaderboard,
	fallbackExamStats,
}: AnalyticsTabProps) {
	const { data } = useAnalyticsData(teacherId, exams);
	const leaderboard =
		data.xpLeaderboard.length > 0 ? data.xpLeaderboard : fallbackXpLeaderboard;

	const stats = [
		{ label: "Нийт ордог анги", value: data.overview?.totalClasses ?? "—" },
		{ label: "Нийт сурагчид", value: data.overview?.totalStudents ?? "—" },
		{ label: "7 хоног орох", value: data.overview?.weeklySubmissions ?? "—" },
		{ label: "Нийт оролт", value: data.overview?.totalSubmissions ?? "—" },
	];

	const chartData = buildChartData(data.overview?.monthlyData ?? []);

	const insight = (() => {
		const missedQuestions =
			data.latestExam?.mostMissed?.length
				? data.latestExam.mostMissed
				: fallbackExamStats?.mostMissed ?? [];
		if (!missedQuestions.length) return null;
		return missedQuestions
			.slice(0, 2)
			.map((q) => q.text.slice(0, 40))
			.join(" болон ");
	})();
	const averageScore =
		data.latestExam?.averageScore ?? fallbackExamStats?.average ?? null;

	return (
		<div className="flex gap-[46px]">
			{/* Left column */}
			<div className="min-w-0 flex-1">
				<h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-900">
					Шалгалтын аналитик
				</h1>
				<p className="mt-1 text-sm text-slate-400">
					Таны хамгийн сүүлийн шалгалтын дундаж оноо болон анхаарах шаардлагатай зөвлөгөө.
				</p>

				{/* 4 stat cards */}
				<div className="mt-6 flex gap-[14px]">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="flex-1 rounded-2xl border border-[#e2e9f0] bg-white p-5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]"
						>
							<p className="text-sm text-slate-400">{stat.label}</p>
							<p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
						</div>
					))}
				</div>

				{/* Wave chart */}
				<div className="mt-[26px] rounded-2xl border border-[#e2e9f0] bg-white p-5">
					<h2 className="text-base font-semibold text-slate-800">
						Шалгалтын дундаж өсөлт, бууралт
					</h2>
					<div className="mt-4 h-[320px]">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart
								data={chartData}
								margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
							>
								<defs>
									<linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
										<stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
								<XAxis
									dataKey="name"
									tick={{ fontSize: 11, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip
									formatter={(value, name) => [
										typeof value === "number" ? `${value}%` : String(value ?? "—"),
										name === "дундаж" ? "Дундаж оноо" : "Тэнцсэн хувь",
									]}
									labelStyle={{ color: "#1e293b", fontWeight: 600 }}
									contentStyle={{
										borderRadius: 12,
										border: "1px solid #e2e8f0",
										fontSize: 12,
										boxShadow: "0 4px 12px -4px rgba(15,23,42,0.12)",
									}}
								/>
								<Area
									type="monotone"
									dataKey="тэнцсэн"
									stroke="#22c55e"
									strokeWidth={2}
									fill="url(#gradGreen)"
									dot={false}
									connectNulls
								/>
								<Area
									type="monotone"
									dataKey="дундаж"
									stroke="#3b82f6"
									strokeWidth={2}
									fill="url(#gradBlue)"
									dot={false}
									connectNulls
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>

			{/* Right column — XP starts at 86px from header */}
			<div className="flex w-[421px] shrink-0 flex-col pt-[43.5px]">
				{/* XP Leaderboard */}
				<div className="rounded-2xl border border-[#e2e9f0] bg-white p-5">
					<h2 className="text-base font-semibold text-slate-800">Сурагчдын ХР оноо</h2>
					<div className="mt-4 max-h-[250px] space-y-3 overflow-y-auto pr-1">
						{leaderboard.length === 0 ? (
							<p className="py-6 text-center text-sm text-slate-400">
								Өгөгдөл байхгүй байна.
							</p>
						) : (
							leaderboard.map((student, index) => (
								<div
									key={student.studentId}
									className="flex items-center gap-3 rounded-xl border border-[#e8eef6] bg-white p-3"
								>
									<div
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getRankStyle(index)}`}
									>
										{index + 1}
									</div>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5f0e8] text-xl">
										{getLevelEmoji(student.level)}
									</div>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-semibold text-slate-900">
											{student.name}
										</p>
										<p className="text-xs text-slate-400">Lvl {student.level}</p>
									</div>
									<div className="flex items-center gap-1 text-sm font-semibold text-[#FFA705]">
										<ZapIcon className="size-3.5" />
										{formatXp(student.xp)}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Insight card */}
				<div className="mt-[41px] rounded-2xl border border-[#FFA705] bg-white p-5">
					<div className="flex items-center gap-2">
						<AlarmClockIcon className="size-4 text-[#FFA705]" />
						<h2 className="text-sm font-semibold text-slate-800">Гол анхаарах зүйл</h2>
					</div>
					<div className="mt-3 text-sm leading-6 text-slate-700">
						{insight ? (
							<>
								<span className="font-bold">{insight}</span>
								{" "}сэдвүүд дээр сурагчдын гүйцэтгэл сул байна. Эдгээр сэдвүүдийг
								жишээ, дасгалаар бататгахыг зөвлөж байна.
							</>
						) : averageScore != null ? (
							<>
								Ангийн дундаж оноо{" "}
								<span className="font-bold">{averageScore}%</span>
								{averageScore >= 75
									? " байгаа нь тогтвортой гүйцэтгэлийг харуулж байна."
									: " байгаа тул нэмэлт дэмжлэг шаардлагатай хичээлүүдийг тодорхойлж, бататгах хэрэгтэй."}
							</>
						) : (
							"Шалгалтын дүн цугарсны дараа автоматаар зөвлөгөө гарч ирнэ."
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
