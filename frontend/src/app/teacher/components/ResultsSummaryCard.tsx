import {
	AlertTriangleIcon,
	BadgePercentIcon,
	CheckCircle2Icon,
	TrendingUpIcon,
} from "lucide-react";
import type { Exam, ExamStatsSummary } from "../types";
import TeacherSelect from "./TeacherSelect";
import { badgeClass, cardClass, emptyStateClass } from "../styles";
import { getRateTone } from "../utils";

type ResultsSummaryCardProps = {
	examOptions: Exam[];
	activeExamId: string | null;
	onSelectExam: (value: string) => void;
	examStats: ExamStatsSummary | null;
};

const getSummaryHeadline = (average: number, passRate: number) => {
	if (average >= 80 && passRate >= 80) return "маш сайн ахицтай явж байна";
	if (average >= 60 && passRate >= 60) {
		return "суурь ойлголттой ч бэхжүүлэх сэдэв байна";
	}
	return "нэмэлт тайлбар, чиглүүлэг хэрэгтэй байна";
};

const getPriorityMeta = (average: number, atRiskCount: number) => {
	if (average >= 80 && atRiskCount === 0) {
		return {
			description: "Одоогийн хэмнэлээ хадгалахад хангалттай.",
			border: "border-[#d7e6dd]",
			bg: "bg-[#f6faf7]",
			text: "text-[#557565]",
			icon: CheckCircle2Icon,
		};
	}
	if (average >= 60 && atRiskCount <= 2) {
		return {
			description: "Гол сэдвүүд дээр суурь ойлголт бүрдэж байна.",
			border: "border-[#d9e4f0]",
			bg: "bg-[#f7fafd]",
			text: "text-[#5b718b]",
			icon: TrendingUpIcon,
		};
	}
	return {
		description: "Эхэлж анхаарах асуултуудаа дахин тайлбарлах хэрэгтэй.",
		border: "border-[#e7dfcf]",
		bg: "bg-[#fbf8f2]",
		text: "text-[#8a7654]",
		icon: AlertTriangleIcon,
	};
};

const getFocusText = (
	examStats: ExamStatsSummary,
	atRiskCount: number,
	passCount: number,
) => {
	if (atRiskCount > 0 && examStats.mostMissed[0]) {
		return `"${examStats.mostMissed[0].text}" асуултаас эхэлж тайлбарлавал хамгийн үр дүнтэй.`;
	}
	if (examStats.passRate < 70) {
		return `${examStats.submissionCount - passCount} сурагчид богино давтлага эсвэл нэмэлт дасгал хэрэгтэй байна.`;
	}
	return "Одоогийн дүн тогтвортой тул дараагийн хичээлдээ ахисан түвшний даалгавар нэмж болно.";
};

const CompactStatCard = ({
	label,
	value,
	hint,
	icon: Icon,
	tone,
}: {
	label: string;
	value: string;
	hint: string;
	icon: typeof TrendingUpIcon;
	tone: ReturnType<typeof getRateTone>;
}) => (
	<div className="rounded-[20px] border border-[#e7edf4] bg-white px-4 py-4 shadow-[0_10px_28px_-28px_rgba(15,23,42,0.18)]">
		<div className="flex items-center justify-between gap-3">
			<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
				{label}
			</div>
			<div
				className={`grid size-8 place-items-center rounded-xl border ${tone.border} ${tone.bg} ${tone.text}`}
			>
				<Icon className="size-4" />
			</div>
		</div>
		<div className="mt-3 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
			{value}
		</div>
		<div className="mt-2 text-sm leading-6 text-slate-500">{hint}</div>
	</div>
);

export default function ResultsSummaryCard({
	examOptions,
	activeExamId,
	onSelectExam,
	examStats,
}: ResultsSummaryCardProps) {
	const atRiskCount = examStats
		? examStats.questionStats.filter((q) => q.correctRate < 45).length
		: 0;
	const passCount = examStats
		? Math.round((examStats.submissionCount * examStats.passRate) / 100)
		: 0;

	return (
		<div className={`${cardClass} overflow-hidden`}>
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<span className={badgeClass}>1. Шалгалт сонгох</span>
					<h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
						Дүнгийн тойм
					</h2>
					<p className="mt-1 text-sm text-slate-400">
						Эхлээд ерөнхий дүр зургийг, дараа нь дэлгэрэнгүй хэсгүүдийг харуулна.
					</p>
				</div>
				<div className="w-full max-w-xs">
					<TeacherSelect
						label="Шалгалт"
						helperText="Тайлан харах шалгалтаа сонгоно уу."
						value={activeExamId ?? ""}
						onChange={(e) => onSelectExam(e.target.value)}
						options={
							examOptions.length === 0
								? [{ value: "", label: "Шалгалт байхгүй", disabled: true }]
								: examOptions.map((exam) => ({
										value: exam.id,
										label: exam.title,
								  }))
						}
					/>
				</div>
			</div>

			{!examStats && (
				<div className={`mt-6 ${emptyStateClass}`}>
					Дууссан шалгалт сонгоход энд ангийн дундаж, анхаарах асуултууд, сурагчдын тайлан харагдана.
				</div>
			)}

			{examStats &&
				(() => {
					const avgTone = getRateTone(examStats.average);
					const passTone = getRateTone(examStats.passRate);
					const summaryHeadline = getSummaryHeadline(
						examStats.average,
						examStats.passRate,
					);
					const priorityMeta = getPriorityMeta(examStats.average, atRiskCount);
					const focusText = getFocusText(examStats, atRiskCount, passCount);
					const riskTone =
						atRiskCount > 0
							? {
									border: "border-[#e7dfcf]",
									bg: "bg-[#fbf8f2]",
									text: "text-[#8a7654]",
									bar: "bg-[#d5bf93]",
									label: "Дахин тайлбарлах",
							  }
							: {
									border: "border-[#d7e6dd]",
									bg: "bg-[#f6faf7]",
									text: "text-[#557565]",
									bar: "bg-[#8fb7a0]",
									label: "Хэвийн",
							  };
					const PriorityIcon = priorityMeta.icon;

					return (
						<>
							<div className="mt-6 rounded-[24px] border border-[#e3e8ef] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] px-5 py-5">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
									<div className="max-w-3xl">
										<div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
											Товч дүгнэлт
										</div>
										<h3 className="mt-2 text-xl font-semibold text-slate-900">
											Анги нийтээрээ {summaryHeadline}
										</h3>
										<p className="mt-2 text-sm leading-6 text-slate-600">
											{examStats.submissionCount} сурагчийн дүн дээр үндэслэн
											энэ шалгалтын ерөнхий зургийг нэгтгэлээ.
										</p>
									</div>
									<div
										className={`flex items-start gap-3 rounded-[18px] border ${priorityMeta.border} ${priorityMeta.bg} px-4 py-3 lg:max-w-[280px]`}
									>
										<div
											className={`grid size-8 shrink-0 place-items-center rounded-xl bg-white ${priorityMeta.text}`}
										>
											<PriorityIcon className="size-4" />
										</div>
										<div className="text-sm leading-6 text-slate-600">
											{priorityMeta.description}
										</div>
									</div>
								</div>

								<div className="mt-4 rounded-[18px] border border-[#e8edf4] bg-white px-4 py-3 text-sm leading-6 text-slate-600">
									<span className="font-semibold text-slate-900">
										Гол анхаарах зүйл:
									</span>{" "}
									{focusText}
								</div>
							</div>

							<div className="mt-5 grid gap-3 md:grid-cols-3">
								<CompactStatCard
									label="Ангийн дундаж"
									value={`${examStats.average}%`}
									hint="Шалгалтын ерөнхий гүйцэтгэл"
									icon={TrendingUpIcon}
									tone={avgTone}
								/>
								<CompactStatCard
									label="Тэнцсэн сурагч"
									value={`${passCount}/${examStats.submissionCount}`}
									hint={`${examStats.passRate}% нь босго давсан`}
									icon={BadgePercentIcon}
									tone={passTone}
								/>
								<CompactStatCard
									label="Анхаарах асуулт"
									value={`${atRiskCount}`}
									hint={
										atRiskCount > 0
											? "Дахин тайлбарлах шаардлагатай"
											: "Одоогоор эрсдэл багатай"
									}
									icon={AlertTriangleIcon}
									tone={riskTone}
								/>
							</div>
						</>
					);
				})()}
		</div>
	);
}
