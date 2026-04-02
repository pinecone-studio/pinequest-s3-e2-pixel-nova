"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceDot,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
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

// ─── Skeleton ───────────────────────────────────────────────────────────────
function AnalyticsTabSkeleton() {
	return (
		<div className="flex animate-pulse gap-[46px]">
			<div className="min-w-0 flex-1">
				<div className="h-7 w-52 rounded-full bg-[#e2e8f0]" />
				<div className="mt-3 h-4 w-[420px] rounded-full bg-[#e2e8f0]" />
				<div className="mt-6 flex gap-[14px]">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="h-[110px] flex-1 rounded-2xl bg-[#e2e8f0]" />
					))}
				</div>
				<div className="mt-[26px] h-[420px] rounded-2xl bg-[#e2e8f0]" />
			</div>
			<div className="flex w-[421px] shrink-0 flex-col pt-[43.5px]">
				<div className="h-[318px] rounded-2xl bg-[#e2e8f0]" />
				<div className="mt-[41px] h-[210px] rounded-2xl bg-[#e2e8f0]" />
			</div>
		</div>
	);
}

// ─── Chart helpers ───────────────────────────────────────────────────────────
export function buildChartData(
	monthlyData: { month: string; avgScore: number | null; passRate: number | null }[],
	now = new Date(),
) {
	const year = now.getFullYear();
	const startMonth = now.getMonth() + 1;
	const count = 13 - startMonth;
	return Array.from({ length: count }, (_, i) => {
		const month = startMonth + i;
		const key = `${year}-${String(month).padStart(2, "0")}`;
		const found = monthlyData.find((m) => m.month === key);
		return {
			name: `${month} сар`,
			дундаж: found?.avgScore ?? undefined,
			тэнцсэн: found?.passRate ?? undefined,
		};
	});
}

const formatPercent = (value: number | null | undefined) => {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	const rounded = Math.round(value * 10) / 10;
	return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

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
	const { data, loading } = useAnalyticsData(teacherId, exams);

	if (loading) return <AnalyticsTabSkeleton />;
	const leaderboard =
		data.xpLeaderboard.length > 0 ? data.xpLeaderboard : fallbackXpLeaderboard;

	const stats = [
		{ label: "Нийт ордог анги", value: data.overview?.totalClasses ?? "—" },
		{ label: "Нийт сурагчид", value: data.overview?.totalStudents ?? "—" },
		{ label: "7 хоног орох", value: data.overview?.weeklySubmissions ?? "—" },
		{ label: "Нийт оролт", value: data.overview?.totalSubmissions ?? "—" },
	];

	const chartData = buildChartData(data.overview?.monthlyData ?? []);
	const averageScore =
		data.latestExam?.averageScore ?? fallbackExamStats?.average ?? null;
	const highlightedPoint =
		[...chartData]
			.reverse()
			.find((point) => typeof point.дундаж === "number" || typeof point.тэнцсэн === "number") ??
		null;
	const highlightedLabel = highlightedPoint?.name ?? null;
	const highlightedIndex =
		highlightedLabel != null ? chartData.findIndex((point) => point.name === highlightedLabel) : -1;
	const currentAverageValue =
		typeof highlightedPoint?.дундаж === "number"
			? highlightedPoint.дундаж
			: averageScore;
	const summaryLeftPercent =
		highlightedIndex >= 0 && chartData.length > 0
			? Math.min(78, Math.max(22, ((highlightedIndex + 0.5) / chartData.length) * 100 + 8))
			: 58;

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
				<div className="mt-[23.5px] flex gap-[14px]">
					{stats.map((stat) => (
						<div
							key={stat.label}
							className="flex h-[125px] flex-1 flex-col justify-center rounded-2xl border border-[#e2e9f0] bg-white px-6 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]"
						>
							<p className="text-[16px] leading-5 text-slate-400">{stat.label}</p>
							<p className="mt-2 text-[32px] font-semibold leading-none text-slate-900">{stat.value}</p>
						</div>
					))}
				</div>

				{/* Wave chart */}
				<div className="mt-[26px] rounded-[28px] border border-[#e5ebf4] bg-white px-10 pb-5 pt-9 shadow-[0_22px_44px_-38px_rgba(15,23,42,0.16)]">
					<h2 className="text-[19px] font-semibold tracking-[-0.02em] text-[#20232d]">
						Шалгалтын дундаж өсөлт, бууралт
					</h2>
					<div className="relative mt-8 overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)]" style={{ height: 250 }}>
						{highlightedLabel && currentAverageValue != null ? (
							<div
								className="pointer-events-none absolute top-[58px] z-10 flex min-h-[78px] w-[184px] flex-col justify-center rounded-[24px] border border-[#edf1f7] bg-white/96 px-6 py-4 shadow-[0_30px_50px_-38px_rgba(59,130,246,0.55)]"
								style={{
									left: `${summaryLeftPercent}%`,
									transform: "translateX(-18%)",
								}}
							>
								<p className="text-[18px] font-medium tracking-[-0.01em] text-[#8c95c3]">
									Одоогийн дундаж
								</p>
								<p className="mt-1 text-[17px] font-semibold text-[#20232d]">
									{formatPercent(currentAverageValue)}
								</p>
							</div>
						) : null}
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 18, right: 0, left: 0, bottom: 0 }}>
								<defs>
									<linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#5E81F4" stopOpacity={0.16} />
										<stop offset="100%" stopColor="#5E81F4" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#6fe7b0" stopOpacity={0.18} />
										<stop offset="100%" stopColor="#4cd9a0" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="5 5"
									stroke="#dfe6f2"
									horizontal={false}
									vertical
								/>
								{highlightedLabel ? (
									<ReferenceLine x={highlightedLabel} stroke="#b7c1d5" strokeWidth={1.5} />
								) : null}
								{highlightedLabel && typeof highlightedPoint?.тэнцсэн === "number" ? (
									<>
										<ReferenceDot
											x={highlightedLabel}
											y={highlightedPoint.тэнцсэн}
											r={16}
											fill="rgba(111,231,176,0.18)"
											stroke="none"
										/>
										<ReferenceDot
											x={highlightedLabel}
											y={highlightedPoint.тэнцсэн}
											r={8}
											fill="#6fe7b0"
											stroke="#ffffff"
											strokeWidth={4}
										/>
									</>
								) : null}
								{highlightedLabel && typeof highlightedPoint?.дундаж === "number" ? (
									<>
										<ReferenceDot
											x={highlightedLabel}
											y={highlightedPoint.дундаж}
											r={16}
											fill="rgba(94,129,244,0.15)"
											stroke="none"
										/>
										<ReferenceDot
											x={highlightedLabel}
											y={highlightedPoint.дундаж}
											r={8}
											fill="#5E81F4"
											stroke="#ffffff"
											strokeWidth={4}
										/>
									</>
								) : null}
								<YAxis hide domain={[0, 100]} />
								<XAxis hide dataKey="name" />
								<Tooltip
									formatter={(value, name) => [
										typeof value === "number" ? formatPercent(value) : String(value ?? "—"),
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
									type="basis"
									dataKey="тэнцсэн"
									stroke="#6fe7b0"
									strokeWidth={3}
									fill="url(#gradGreen)"
									dot={false}
									connectNulls
								/>
								<Area
									type="basis"
									dataKey="дундаж"
									stroke="#5E81F4"
									strokeWidth={3}
									fill="url(#gradBlue)"
									dot={false}
									connectNulls
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-0 border-t border-[#e9edf4] px-1 pt-[18px]">
						<div className="flex">
						{chartData.map((point) => (
							<div key={point.name} className="flex-1 text-center">
								<span
									className={`text-[15px] leading-none ${
										point.name === highlightedLabel
											? "font-semibold text-[#20232d]"
											: "font-medium text-[#8c95c3]"
									}`}
								>
									{point.name}
								</span>
							</div>
						))}
						</div>
					</div>
				</div>
			</div>

			{/* Right column — XP starts at 86px from header */}
			<div className="flex w-[421px] shrink-0 flex-col gap-[34px] pt-[43.5px]">
				{/* XP Leaderboard */}
				<div className="flex h-[318px] flex-col rounded-[28px] border border-[#e2e9f0] bg-white px-8 pb-4 pt-6 shadow-[0_16px_36px_-34px_rgba(15,23,42,0.18)]">
					<h2 className="text-[17px] font-semibold leading-7 tracking-[-0.02em] text-[#20232d]">
						Сурагчдын ХР оноо
					</h2>
					<div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
						{leaderboard.length === 0 ? (
							<p className="py-6 text-center text-sm text-slate-400">
								Өгөгдөл байхгүй байна.
							</p>
						) : (
							leaderboard.map((student, index) => (
								<div
									key={student.studentId}
									className="flex h-[66px] items-center gap-3 rounded-[16px] border border-[#dbe4f0] bg-white px-5 py-3 shadow-[0_2px_10px_-8px_rgba(15,23,42,0.12)]"
								>
									<div
										className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold ${getRankStyle(index)}`}
									>
										{index + 1}
									</div>
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[24px]">
										{getLevelEmoji(student.level)}
									</div>
									<div className="min-w-0 flex-1 space-y-0.5">
										<p className="truncate text-[15px] font-semibold leading-5 text-[#20232d]">
											{student.name}
										</p>
										<p className="text-[13px] leading-4 text-[#6f7c96]">
											Lvl {student.level}
										</p>
									</div>
									<div className="flex w-[72px] shrink-0 items-center justify-end gap-1.5 text-[16px] font-semibold text-[#dd8a00]">
										<ZapIcon className="size-4" />
										{formatXp(student.xp)}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Insight card */}
				<div>
					<div className="min-h-[225px] rounded-[30px] border border-[#FFA705] bg-white px-[34px] pb-[30px] pt-[28px] shadow-[0_16px_34px_-30px_rgba(15,23,42,0.16)]">
						<div className="flex items-center gap-3">
							<AlarmClockIcon className="size-[18px] text-[#FFA705]" />
							<h2 className="text-[17px] font-semibold tracking-[-0.02em] text-slate-800">
								Гол анхаарах зүйл
							</h2>
						</div>
						<div className="mt-[18px] text-[17px] leading-[1.6] text-slate-800">
							{insight ? (
								<>
									<span className="font-bold">{insight}</span>
									{" "}сэдвүүд дээр сурагчдын гүйцэтгэл сул байна. Эдгээр сэдвүүдийг
									жишээ, дасгалаар бататгахыг зөвлөж байна.
								</>
							) : averageScore != null ? (
								<>
									Ангийн дундаж оноо{" "}
									<span className="font-bold">{formatPercent(averageScore)}</span>
									{averageScore >= 75
										? " байгаа нь тогтвортой гүйцэтгэлийг харуулж байна."
										: " байгаа тул нэмэлт дэмжлэг шаардлагатай хичээлүүдийг тодорхойлж, бататгах хэрэгтэй."}
								</>
							) : (
								"Шалгалтын дүн цугларсаны дараа автоматаар зөвлөгөө гарч ирнэ."
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
