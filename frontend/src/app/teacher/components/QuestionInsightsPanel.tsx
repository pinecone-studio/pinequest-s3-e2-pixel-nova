import { AlertTriangleIcon } from "lucide-react";
import { badgeClass, cardClass, emptyStateClass } from "../styles";
import type { ExamStatsSummary } from "../types";
import { getRateTone } from "../utils";

type QuestionInsightsPanelProps = {
	examStats: ExamStatsSummary | null;
};

const getTeacherGuidance = (
	correctRate: number,
	missedCount: number,
	topWrongAnswer: string | null,
) => {
	if (correctRate >= 75) {
		return "Ойлголт тогтвортой байна.";
	}
	if (correctRate >= 45) {
		return "Богино давтлага, нэмэлт жишээ хэрэгтэй.";
	}
	if (topWrongAnswer) {
		return `${missedCount} сурагч "${topWrongAnswer}" хариултад алдсан байна.`;
	}
	return `${missedCount} сурагч энэ асуулт дээр алдсан байна.`;
};

const SummaryMetricCard = ({
	label,
	value,
	description,
	accentClass,
}: {
	label: string;
	value: string;
	description: string;
	accentClass: string;
}) => (
	<div className="rounded-[22px] border border-[#e7edf4] bg-white px-4 py-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.18)]">
		<div className="flex items-center gap-2">
			<span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
			<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
				{label}
			</div>
		</div>
		<div className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-slate-900">
			{value}
		</div>
		<div className="mt-1 text-sm leading-6 text-slate-500">{description}</div>
	</div>
);

const MetricPill = ({
	label,
	value,
	hint,
}: {
	label: string;
	value: string;
	hint: string;
}) => (
	<div className="rounded-[16px] border border-[#edf2f7] bg-white px-3 py-3">
		<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
			{label}
		</div>
		<div className="mt-2 text-base font-semibold text-slate-900">{value}</div>
		<div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
	</div>
);

export default function QuestionInsightsPanel({
	examStats,
}: QuestionInsightsPanelProps) {
	const atRiskCount = examStats
		? examStats.questionStats.filter((question) => question.correctRate < 45).length
		: 0;
	const questionCount = examStats?.questionStats.length ?? 0;
	const stableCount = examStats
		? examStats.questionStats.filter((question) => question.correctRate >= 70).length
		: 0;
	const averageCorrectRate = examStats
		? Math.round(
				examStats.questionStats.reduce(
					(sum, question) => sum + question.correctRate,
					0,
				) / Math.max(examStats.questionStats.length, 1),
		  )
		: 0;
	const focusQuestion = examStats?.questionStats.reduce((current, question) => {
		if (!current) return question;
		if (question.correctRate < current.correctRate) return question;
		if (
			question.correctRate === current.correctRate &&
			question.missCount > current.missCount
		) {
			return question;
		}
		return current;
	}, examStats.questionStats[0] ?? null);

	return (
		<section className={cardClass}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<span className={badgeClass}>3. Асуултын шинжилгээ</span>
					<h3 className="mt-3 text-xl font-semibold text-slate-900">
						Асуулт тус бүрийн үзүүлэлт
					</h3>
					<p className="mt-1 text-sm text-slate-400">
						Аль асуултад төвлөрөх, аль хэсэг тогтвортой байгааг хурдан харуулна.
					</p>
				</div>
				{examStats && (
					<div className="flex items-center gap-2">
						{atRiskCount > 0 && (
							<div className="flex items-center gap-1.5 rounded-full border border-[#e7dfcf] bg-[#fbf8f2] px-3 py-1.5 text-xs font-semibold text-[#8a7654]">
								<AlertTriangleIcon className="size-3.5" />
								{atRiskCount} анхаарах асуулт
							</div>
						)}
						<div className="rounded-full border border-[#e3e8ef] bg-[#fbfcfe] px-3 py-1.5 text-xs font-semibold text-slate-500">
							{questionCount} асуулт
						</div>
					</div>
				)}
			</div>

			{!examStats || examStats.questionStats.length === 0 ? (
				<div className={`mt-6 ${emptyStateClass}`}>
					Шалгалт сонгоход асуулт тус бүрийн дүн шинжилгээ эндээс харагдана.
				</div>
			) : (
				<>
					<div className="mt-6 grid gap-3 md:grid-cols-3">
						<SummaryMetricCard
							label="Анхаарах асуулт"
							value={`${atRiskCount}`}
							description="45%-иас доош зөв хариулттай асуулт"
							accentClass="bg-[#d2b47a]"
						/>
						<SummaryMetricCard
							label="Дундаж ойлголт"
							value={`${averageCorrectRate}%`}
							description={`Нийт ${questionCount} асуултын дундаж зөв хувь`}
							accentClass="bg-[#7da7d9]"
						/>
						<SummaryMetricCard
							label="Тогтвортой хэсэг"
							value={`${stableCount}`}
							description="70%-иас дээш зөв хариулттай асуулт"
							accentClass="bg-[#98c0a9]"
						/>
					</div>

					{focusQuestion && (
						<div className="mt-4 rounded-[22px] border border-[#e7dfcf] bg-[linear-gradient(180deg,#fffdf8_0%,#fffaf1_100%)] px-4 py-4">
							<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7654]">
								Эхэлж тайлбарлах асуулт
							</div>
							<div className="mt-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<p className="text-sm leading-6 text-slate-700">
									<span className="font-semibold text-slate-900">
										{focusQuestion.text}
									</span>
									{" "}дээр илүү олон алдаа гарсан тул эхэлж тайлбарлавал ойлголт хурдан сэргэнэ.
								</p>
								<div className="shrink-0 rounded-full border border-[#eadcb8] bg-white px-3 py-1 text-xs font-semibold text-[#8a7654]">
									{focusQuestion.correctRate}% зөв
								</div>
							</div>
						</div>
					)}

					<div className="mt-5 space-y-3">
						{examStats.questionStats.map((question, index) => {
							const tone = getRateTone(question.correctRate);
							const teacherGuidance = getTeacherGuidance(
								question.correctRate,
								question.missCount,
								question.topWrongAnswer,
							);
							const isFocusQuestion = focusQuestion?.id === question.id;

							return (
								<article
									key={question.id}
									className={`rounded-[24px] border px-5 py-5 transition ${
										isFocusQuestion
											? "border-[#dfe7f5] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_20px_44px_-34px_rgba(37,99,235,0.18)]"
											: "border-[#e7edf4] bg-white shadow-[0_14px_34px_-34px_rgba(15,23,42,0.16)]"
									}`}
								>
									<div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px] xl:items-start">
										<div className="min-w-0">
											<div className="flex items-start gap-3">
												<div
													className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border text-sm font-semibold ${tone.border} ${tone.bg} ${tone.text}`}
												>
													{index + 1}
												</div>
												<div className="min-w-0">
													<p className="text-sm font-semibold leading-6 text-slate-900">
														{question.text}
													</p>
													<p className="mt-2 text-sm leading-6 text-slate-500">
														{teacherGuidance}
													</p>
												</div>
											</div>
										</div>

										<div className="rounded-[20px] border border-[#edf2f7] bg-[#fbfcfe] p-4">
											<div className="flex items-start justify-between gap-3">
												<div>
													<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
														Зөв хувь
													</div>
													<div className={`mt-1 text-[28px] font-semibold tracking-[-0.03em] ${tone.text}`}>
														{question.correctRate}%
													</div>
												</div>
												<div
													className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone.border} ${tone.bg} ${tone.text}`}
												>
													{tone.label}
												</div>
											</div>
											<div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e9eef5]">
												<div
													className={`h-full rounded-full ${tone.bar}`}
													style={{ width: `${question.correctRate}%` }}
												/>
											</div>
										</div>

										<div className="grid gap-3 sm:grid-cols-3 xl:col-span-2">
											<MetricPill
												label="Зөв"
												value={`${question.correctCount}/${question.total}`}
												hint="хариулсан сурагч"
											/>
											<MetricPill
												label="Алгассан"
												value={`${question.skippedCount}`}
												hint="сурагч"
											/>
											<MetricPill
												label="Түгээмэл буруу"
												value={question.topWrongAnswer || "Илрээгүй"}
												hint={
													question.topWrongAnswer
														? `${question.topWrongAnswerCount} сурагч`
														: "Хэв маяг ажиглагдсангүй"
												}
											/>
										</div>
									</div>
								</article>
							);
						})}
					</div>
				</>
			)}
		</section>
	);
}
