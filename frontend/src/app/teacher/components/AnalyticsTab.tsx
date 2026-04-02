"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { AlarmClockIcon, ZapIcon } from "lucide-react";
import { useState } from "react";
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
	const startMonth = now.getMonth() + 1; // current month (1-based)
	const count = 13 - startMonth; // from current month to December
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

const renderMonthTick =
	(activeLabel: string | null) =>
	({
		x,
		y,
		payload,
	}: {
		x?: number | string;
		y?: number | string;
		payload?: { value?: string };
	}) => {
		const label = payload?.value ?? "";
		const isActive = label === activeLabel;
		return (
			<text
				x={typeof x === "number" ? x : Number(x ?? 0)}
				y={(typeof y === "number" ? y : Number(y ?? 0)) + 24}
				textAnchor="middle"
				fill={isActive ? "#111827" : "#8b95c7"}
				fontSize={isActive ? 15 : 14}
				fontWeight={isActive ? 600 : 500}
			>
				{label}
			</text>
		);
	};

const renderHighlightedDot =
	(activeLabel: string | null, color: string, glow: string, onPosition?: (cx: number, cy: number) => void) =>
	({
		cx,
		cy,
		payload,
	}: {
		cx?: number;
		cy?: number;
		payload?: { name?: string };
	}) => {
		if (payload?.name !== activeLabel || typeof cx !== "number" || typeof cy !== "number") {
			return null;
		}

		onPosition?.(cx, cy);

		return (
			<g>
				<circle cx={cx} cy={cy} r={16} fill={glow} />
				<circle cx={cx} cy={cy} r={8} fill={color} stroke="#ffffff" strokeWidth={4} />
			</g>
		);
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

	const [dotPos, setDotPos] = useState<{ cx: number; cy: number } | null>(null);

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
	const currentAverageValue =
		typeof highlightedPoint?.дундаж === "number"
			? highlightedPoint.дундаж
			: averageScore;

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
				<div className="mt-[26px] rounded-[28px] border border-[#e2e9f0] bg-white px-7 pb-7 pt-7 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)]">
					<h2 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-800">
						Шалгалтын дундаж өсөлт, бууралт
					</h2>
					{/* Chart area — light bg box */}
					<div className="relative mt-5 overflow-hidden rounded-2xl bg-[#f6f8fc]" style={{ height: 260 }}>
						{highlightedLabel && currentAverageValue != null && dotPos ? (
							<div
								className="pointer-events-none absolute z-10 flex h-[60px] w-[135px] flex-col justify-center rounded-2xl border border-[#e4ebf5] bg-white/95 px-4 shadow-[0_8px_24px_-12px_rgba(59,130,246,0.3)]"
								style={{
									left: Math.min(dotPos.cx + 12, 999),
									top: Math.max(dotPos.cy - 30, 4),
									transform: "translateX(0)",
								}}
							>
								<p className="text-[13px] font-medium text-[#8b95c7]">Одоогийн дундаж</p>
								<p className="text-[15px] font-semibold text-slate-900">
									{formatPercent(currentAverageValue)}
								</p>
							</div>
						) : null}
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={chartData} margin={{ top: 20, right: 12, left: 12, bottom: 0 }}>
								<defs>
									<linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#5E81F4" stopOpacity={0.22} />
										<stop offset="100%" stopColor="#5E81F4" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#4cd9a0" stopOpacity={0.22} />
										<stop offset="100%" stopColor="#4cd9a0" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="2 10" stroke="#ccd4e8" horizontal={false} vertical />
								{highlightedLabel ? (
									<ReferenceLine x={highlightedLabel} stroke="#a8b8d4" strokeWidth={1.5} />
								) : null}
								<YAxis hide domain={["auto", "auto"]} />
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
								<Area type="monotone" dataKey="тэнцсэн" stroke="#4cd9a0" strokeWidth={2.5} fill="url(#gradGreen)" dot={renderHighlightedDot(highlightedLabel, "#4cd9a0", "rgba(76,217,160,0.22)")} connectNulls />
								<Area type="monotone" dataKey="дундаж" stroke="#5E81F4" strokeWidth={2.5} fill="url(#gradBlue)" dot={renderHighlightedDot(highlightedLabel, "#5E81F4", "rgba(94,129,244,0.2)", (cx, cy) => setDotPos({ cx, cy }))} connectNulls />
							</AreaChart>
						</ResponsiveContainer>
					</div>
					{/* X-axis labels below chart box */}
					<div className="mt-2.5 flex px-2">
						{chartData.map((point) => (
							<div key={point.name} className="flex-1 text-center">
								<span className={`text-[12px] font-medium ${point.name === highlightedLabel ? "font-semibold text-slate-700" : "text-[#9aa5c4]"}`}>
									{point.name}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Right column — XP starts at 86px from header */}
			<div className="flex w-[421px] shrink-0 flex-col justify-between pt-[43.5px]">
				{/* XP Leaderboard */}
				<div className="flex h-[318px] flex-col rounded-2xl border border-[#e2e9f0] bg-white p-5">
					<h2 className="text-base font-semibold text-slate-800">Сурагчдын ХР оноо</h2>
					<div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
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
				<div className="mt-auto pt-[41px]">
					<div className="rounded-2xl border border-[#FFA705] bg-white p-5">
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
									<span className="font-bold">{formatPercent(averageScore)}</span>
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
		</div>
	);
}
