import { ChevronRightIcon, SendIcon } from "lucide-react";
import { cardClass, sectionDescriptionClass } from "../styles";
import { formatDateTime } from "../utils";
import type { Submission } from "../types";


type ResultsSubmissionsListProps = {
	submissions: Submission[];
	onSelect: (id: string) => void;
	selectedSubmissionId: string | null;
};

const getStudentInitials = (name: string) =>
	name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("") || "SU";

export default function ResultsSubmissionsList({
	submissions,
	onSelect,
	selectedSubmissionId,
}: ResultsSubmissionsListProps) {
	const passedCount = submissions.filter((submission) => submission.percentage >= 60).length;
	const flaggedCount = submissions.filter((submission) => {
		const violationTotal = Object.values(submission.violations ?? {}).reduce(
			(sum, value) => sum + Number(value),
			0,
		);
		return violationTotal > 0 || submission.isFlagged;
	}).length;

	return (
		<div className={cardClass}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-slate-900">Сурагчдын дүн</h2>
					<p className={`mt-2 ${sectionDescriptionClass}`}>
						Жагсаалтаас нэг сурагч сонгоход баруун талд тайлан гарна.
					</p>
				</div>
				<div className="rounded-full border border-[#dce5ef] bg-[#fbfcfe] px-3 py-1.5 text-xs font-semibold text-slate-500">
					{submissions.length} илгээлт
				</div>
			</div>

			{submissions.length > 0 && (
				<div className="mt-5 grid gap-3 sm:grid-cols-3">
					<div className="rounded-[18px] border border-[#e3e8ef] bg-[#fbfdff] px-4 py-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
							Нийт дүн
						</div>
						<div className="mt-2 text-2xl font-semibold text-slate-900">{submissions.length}</div>
					</div>
					<div className="rounded-[18px] border border-[#d7e6dd] bg-[#f6faf7] px-4 py-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#557565]">
							Тэнцсэн
						</div>
						<div className="mt-2 text-2xl font-semibold text-slate-900">{passedCount}</div>
					</div>
					<div className="rounded-[18px] border border-[#e7dfcf] bg-[#fbf8f2] px-4 py-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a7654]">
							Нягтлах
						</div>
						<div className="mt-2 text-2xl font-semibold text-slate-900">{flaggedCount}</div>
					</div>
				</div>
			)}

			<div className="mt-6 space-y-3 text-sm">
				{submissions.length === 0 ? (
					<div className="rounded-[24px] border border-dashed border-[#d8e3f0] bg-[#f8fbff] px-5 py-8 text-center">
						<div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-[#2563eb]">
							<SendIcon className="size-5" />
						</div>
						<div className="mt-4 text-base font-semibold text-slate-900">Одоогоор дүн алга</div>
						<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
							Сурагчийн илгээлт орж ирэхэд энд энгийн жагсаалт гарна.
						</p>
					</div>
				) : (
					submissions.map((submission, index) => {
						const passed = submission.percentage >= 60;
						const isSelected = selectedSubmissionId === submission.id;
						const violationTotal = Object.values(submission.violations ?? {}).reduce(
							(sum, value) => sum + Number(value),
							0,
						);
						const initials = getStudentInitials(submission.studentName);

						return (
							<button
								key={submission.id}
								type="button"
								onClick={() => onSelect(submission.id)}
								className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
									isSelected
										? "border-[#bfdbfe] bg-[#f4f8ff] shadow-[0_18px_40px_-34px_rgba(37,99,235,0.55)]"
										: "border-[#dce5ef] bg-[#fbfdff] hover:border-[#c9d8ea] hover:bg-white"
								}`}
							>
								<div className="flex items-start gap-4">
									<div className="grid size-12 shrink-0 place-items-center rounded-[18px] border border-[#dce5ef] bg-white text-sm font-semibold text-slate-700">
										{initials}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<div className="min-w-0 truncate font-semibold text-slate-900">
												{submission.studentName}
											</div>
											<span className="rounded-full border border-[#dce5ef] bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-400">
												#{index + 1}
											</span>
											<span
												className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
													passed
														? "border border-[#d7e6dd] bg-[#f6faf7] text-[#557565]"
														: "border border-[#e7dfcf] bg-[#fbf8f2] text-[#8a7654]"
												}`}
											>
												{passed ? "Тэнцсэн" : "Нэмэлт ажил хэрэгтэй"}
											</span>
											{submission.terminated && (
												<span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
													Зогссон
												</span>
											)}
											{violationTotal > 0 && (
												<span className="rounded-full border border-[#e7dfcf] bg-[#fbf8f2] px-2.5 py-1 text-[11px] font-semibold text-[#8a7654]">
													{violationTotal} зөрчил
												</span>
											)}
										</div>
										<div className="mt-1 text-xs text-slate-500">
											{formatDateTime(submission.submittedAt)}
										</div>
										<div className="mt-4 flex items-center gap-3">
											<div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef6]">
												<div
													className={passed ? "h-full rounded-full bg-[#8fb7a0]" : "h-full rounded-full bg-[#d5bf93]"}
													style={{ width: `${submission.percentage}%` }}
												/>
											</div>
											<div className="shrink-0 text-xs font-semibold text-slate-500">
												{submission.percentage}%
											</div>
										</div>
									</div>
								</div>
								<div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf2f7] pt-3">
									<div className="text-sm font-semibold text-slate-900">
										{submission.score}/{submission.totalPoints} оноо
									</div>
									<div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
										Тайлан нээх
										<ChevronRightIcon className="size-3.5" />
									</div>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
