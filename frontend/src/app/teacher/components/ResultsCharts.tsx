import { badgeClass, cardClass } from "../styles";
import type { ExamStatsSummary, ScoreBand } from "../types";

type ResultsChartsProps = {
	examStats: ExamStatsSummary | null;
};

const BAND_TONE: Record<string, { bar: string; bg: string; text: string }> = {
	high: { bar: "bg-[#8fb7a0]", bg: "bg-[#f6faf7]", text: "text-[#557565]" },
	mid: { bar: "bg-[#9bb5d1]", bg: "bg-[#f7fafd]", text: "text-[#5b718b]" },
	low: { bar: "bg-[#d5bf93]", bg: "bg-[#fbf8f2]", text: "text-[#8a7654]" },
};

const getBandTone = (label: string) => {
	if (label.startsWith("90") || label.startsWith("75")) return BAND_TONE.high;
	if (label.startsWith("60")) return BAND_TONE.mid;
	return BAND_TONE.low;
};

const getBandStart = (label: string) => {
	const match = label.match(/^(\d+)/);
	return match ? Number(match[1]) : 0;
};

const BandRow = ({ band, total }: { band: ScoreBand; total: number }) => {
	const pct = total > 0 ? Math.round((band.count / total) * 100) : 0;
	const tone = getBandTone(band.label);
	const bandStart = getBandStart(band.label);
	const bandMessage =
		pct >= 40 ? "Ихэнх нь энд байна" : bandStart < 60 && band.count > 0 ? "Анхаарах бүлэг" : "Хэвийн";
	return (
		<div className="rounded-[18px] border border-[#e7edf5] bg-white px-4 py-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<span
					className={`whitespace-nowrap rounded-lg px-2 py-0.5 text-xs font-semibold ${tone.bg} ${tone.text}`}
				>
					{band.label}
				</span>
				<div className="min-w-[120px] text-left sm:text-right">
					<div className="text-sm font-semibold text-slate-900">{band.count} сурагч</div>
					<div className="text-[11px] text-slate-400">{pct}% · {bandMessage}</div>
				</div>
			</div>
			<div className="mt-3 h-2 overflow-hidden rounded-full bg-[#edf1f6]">
				<div
					className={`h-full rounded-full ${tone.bar} transition-all duration-500`}
					style={{ width: `${pct}%`, backgroundColor: band.color }}
				/>
			</div>
		</div>
	);
};

export default function ResultsCharts({ examStats }: ResultsChartsProps) {
	const totalAnswers = examStats
		? examStats.correctTotal + examStats.incorrectTotal
		: 0;
	const correctRate =
		totalAnswers > 0 && examStats
			? Math.round((examStats.correctTotal / totalAnswers) * 100)
			: 0;
	const incorrectRate = totalAnswers > 0 ? 100 - correctRate : 0;
	const dominantBand = examStats?.performanceBands.reduce<ScoreBand | null>(
		(current, band) => (!current || band.count > current.count ? band : current),
		null,
	);
	const supportBandCount = examStats
		? examStats.performanceBands
				.filter((band) => getBandStart(band.label) < 60)
				.reduce((sum, band) => sum + band.count, 0)
		: 0;
	const answerInsight =
		correctRate >= 75
			? "Анги нийтээрээ гол ойлголтыг тогтвортой эзэмшиж байна."
			: correctRate >= 60
				? "Суурь ойлголт байгаа ч зарим асуулт дээр нэмэлт тайлбар хэрэгтэй."
				: "Зөв хариултын хувь сул байгаа тул асуулт, тайлбараа дахин нягтлах хэрэгтэй.";

	return (
		<section className={cardClass}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<span className={badgeClass}>2. Ангийн ерөнхий зураг</span>
					<h3 className="mt-3 text-xl font-semibold text-slate-900">
						Оноо болон хариултын төлөв
					</h3>
					<p className="mt-1 text-sm text-slate-400">
						Аль онооны бүсэд төвлөрч байгааг болон зөв, буруу хариултын ерөнхий балансыг харуулна.
					</p>
				</div>
				{dominantBand && (
					<div className="rounded-full border border-[#e3e8ef] bg-[#fbfcfe] px-3 py-1.5 text-xs font-semibold text-slate-600">
						Ихэнх нь {dominantBand.label} бүсэд байна
					</div>
				)}
			</div>

			{!examStats ? (
				<div className="mt-6 rounded-[20px] border border-dashed border-[#d5dfeb] bg-[#f8fafc] px-4 py-10 text-center text-sm text-slate-400">
					Шалгалт сонгоход энд онооны тархалт болон хариултын ерөнхий байдал харагдана.
				</div>
			) : (
				<div className="mt-6 grid gap-4">
					<div className="rounded-[22px] border border-[#e3e8ef] bg-[#fcfdff] px-5 py-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<div className="text-sm font-semibold text-slate-800">Онооны тархалт</div>
								<div className="mt-0.5 text-xs text-slate-400">
									Сурагчид аль онооны бүсэд байгааг бүлгээр нь харууллаа
								</div>
							</div>
							<span className="rounded-full border border-[#e3e8ef] bg-white px-3 py-1 text-xs font-semibold text-slate-500">
								{examStats.submissionCount} илгээлт
							</span>
						</div>
						<div className="mt-5 space-y-3">
							{examStats.performanceBands.length > 0 ? (
								examStats.performanceBands.map((band) => (
									<BandRow key={band.label} band={band} total={examStats.submissionCount} />
								))
							) : (
								<div className="rounded-[16px] border border-dashed border-[#d5dfeb] px-4 py-6 text-center text-sm text-slate-400">
									Онооны тархалтын өгөгдөл байхгүй.
								</div>
							)}
						</div>
					</div>

					<div className="rounded-[22px] border border-[#e3e8ef] bg-[#fcfdff] px-5 py-5">
						<div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
							Хариултын баланс
						</div>
						<div className="mt-2 text-sm leading-6 text-slate-600">
							{answerInsight}
						</div>
						<div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eef6]">
							<div className="flex h-full w-full">
								<div className="h-full bg-[#8fb7a0]" style={{ width: `${correctRate}%` }} />
								<div
									className="h-full bg-[#c7d1dc]"
									style={{ width: `${incorrectRate}%` }}
								/>
							</div>
						</div>
						<div className="mt-4 grid gap-3">
							<div className="rounded-[18px] border border-[#e7edf5] bg-white px-4 py-3">
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
									Гол зураг
								</div>
								<div className="mt-2 text-sm font-semibold text-slate-900">
									{dominantBand ? `${dominantBand.label} бүсэд ихэнх нь байна` : "Тархалт хараахан бүрдээгүй"}
								</div>
								<div className="mt-1 text-xs leading-6 text-slate-500">
									{dominantBand
										? `${dominantBand.count} сурагч энэ бүсэд байна. Доод бүсэд ${supportBandCount} сурагч байна.`
										: "Илгээлт цугларсны дараа илүү тодорхой болно."}
								</div>
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-[18px] border border-[#d7e6dd] bg-[#f6faf7] px-4 py-3">
									<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#557565]">
										Зөв
									</div>
									<div className="mt-2 text-xl font-bold text-slate-900">{correctRate}%</div>
								</div>
								<div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
									<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
										Буруу
									</div>
									<div className="mt-2 text-xl font-bold text-slate-900">{incorrectRate}%</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
