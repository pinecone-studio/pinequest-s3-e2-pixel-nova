import {
	AlertTriangleIcon,
	Clock3Icon,
	FileSearch,
	UserRoundSearch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cardClass, sectionDescriptionClass } from "../styles";
import type { Exam, Submission, ExamStatsSummary, ExamAudioChunk } from "../types";
import type { StudentProfile } from "@/lib/backend-auth";
import AttendanceStatsCard from "./AttendanceStatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExamAttendanceStats } from "../types";
import { getExamAudioChunks, getStudentCheatEvents } from "@/api/cheat";
import { formatDateTime, getRateTone, VIOLATION_LABELS } from "../utils";

type ResultsDetailPanelProps = {
	selectedSubmission: Submission | null;
	selectedExam: Exam | null;
	examStats: ExamStatsSummary | null;
	attendanceStats: ExamAttendanceStats | null;
	attendanceLoading: boolean;
	studentProfile: StudentProfile | null;
	profileLoading: boolean;
};

const getPerformanceMeta = (percentage: number) => {
	if (percentage >= 80) {
		return {
			label: "Тогтвортой",
			badgeClass: "border-[#d7e6dd] bg-[#f6faf7] text-[#557565]",
		};
	}
	if (percentage >= 60) {
		return {
			label: "Хэвийн",
			badgeClass: "border-[#d9e4f0] bg-[#f7fafd] text-[#5b718b]",
		};
	}
	return {
		label: "Дэмжлэг хэрэгтэй",
		badgeClass: "border-[#e7dfcf] bg-[#fbf8f2] text-[#8a7654]",
	};
};

const getProfileRows = (studentProfile: StudentProfile | null) => {
	if (!studentProfile) return [];
	return [
		{ label: "Нэр", value: studentProfile.fullName },
		{ label: "Имэйл", value: studentProfile.email },
		{ label: "Утас", value: studentProfile.phone },
		{ label: "Сургууль", value: studentProfile.school },
		{ label: "Анги", value: studentProfile.grade },
		{ label: "Бүлэг", value: studentProfile.groupName },
		{
			label: "Түвшин",
			value: typeof studentProfile.level === "number" ? `Lv.${studentProfile.level}` : null,
		},
		{
			label: "XP",
			value: typeof studentProfile.xp === "number" ? `${studentProfile.xp}` : null,
		},
		{ label: "Танилцуулга", value: studentProfile.bio },
	].filter((row): row is { label: string; value: string } => Boolean(row.value));
};

const SidebarStat = ({
	label,
	value,
	description,
	className = "border-[#e3e8ef] bg-[#fbfdff]",
}: {
	label: string;
	value: string;
	description: string;
	className?: string;
}) => (
	<div className={`rounded-[18px] border px-4 py-3 ${className}`}>
		<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
			{label}
		</div>
		<div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
		<div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
	</div>
);

export default function ResultsDetailPanel({
	selectedSubmission,
	selectedExam,
	examStats,
	attendanceStats,
	attendanceLoading,
	studentProfile,
	profileLoading,
}: ResultsDetailPanelProps) {
	const [countdown, setCountdown] = useState("00:00:00");
	const [nowTs, setNowTs] = useState(() => Date.now());
	const [audioChunks, setAudioChunks] = useState<ExamAudioChunk[]>([]);
	const [flaggedEventTimes, setFlaggedEventTimes] = useState<string[]>([]);
	const [audioLoading, setAudioLoading] = useState(false);

	const violationEntries = useMemo(
		() =>
			selectedSubmission?.violations
				? Object.entries(selectedSubmission.violations)
						.filter(([, value]) => Number(value) > 0)
						.map(([key, value]) => ({
							label: VIOLATION_LABELS[key] ?? key,
							value: Number(value),
						}))
				: [],
		[selectedSubmission],
	);

	const violationTotal = useMemo(
		() => violationEntries.reduce((s, v) => s + v.value, 0),
		[violationEntries],
	);

	const answerMap = useMemo(
		() => new Map(selectedSubmission?.answers?.map((a) => [a.questionId, a])),
		[selectedSubmission],
	);

	const finishAt = useMemo(() => {
		if (!selectedExam) return null;
		if (selectedExam.finishedAt) return selectedExam.finishedAt;
		if (selectedExam.examStartedAt && selectedExam.duration) {
			const start = new Date(selectedExam.examStartedAt).getTime();
			if (!Number.isNaN(start)) {
				return new Date(start + selectedExam.duration * 60_000).toISOString();
			}
		}
		return null;
	}, [selectedExam]);

	const resolvedSessionId = selectedSubmission?.sessionId ?? selectedSubmission?.id ?? null;
	const selectedExamId = selectedExam?.id ?? null;
	const selectedStudentId = selectedSubmission?.studentId ?? null;

	useEffect(() => {
		if (!resolvedSessionId) {
			setAudioChunks([]);
			setFlaggedEventTimes([]);
			setAudioLoading(false);
			return;
		}

		let active = true;
		setAudioLoading(true);
		void Promise.all([
			getExamAudioChunks(resolvedSessionId),
			selectedExamId && selectedStudentId
				? getStudentCheatEvents(selectedExamId, selectedStudentId)
				: Promise.resolve([]),
		])
			.then(([chunks, events]) => {
				if (!active) return;
				setAudioChunks(chunks);
				setFlaggedEventTimes(
					events
						.map((event) => event.createdAt)
						.filter((createdAt) => typeof createdAt === "string" && createdAt.length > 0),
				);
			})
			.catch(() => {
				if (!active) return;
				setAudioChunks([]);
				setFlaggedEventTimes([]);
			})
			.finally(() => {
				if (active) setAudioLoading(false);
			});

		return () => {
			active = false;
		};
	}, [resolvedSessionId, selectedExamId, selectedStudentId]);

	const derivedFinished = useMemo(() => {
		if (!selectedExam) return false;
		if (selectedExam.status === "finished" || Boolean(selectedExam.finishedAt)) return true;
		if (!finishAt) return false;
		const finishTime = new Date(finishAt).getTime();
		return !Number.isNaN(finishTime) && nowTs >= finishTime;
	}, [finishAt, nowTs, selectedExam]);

	const resultsLocked = Boolean(selectedExam && !derivedFinished);

	const highlightedChunkIds = useMemo(() => {
		if (flaggedEventTimes.length === 0) return new Set<string>();
		const violationTimes = flaggedEventTimes
			.map((value) => new Date(value).getTime())
			.filter((value) => !Number.isNaN(value));
		return new Set(
			audioChunks
				.filter((chunk) => {
					const start = new Date(chunk.chunkStartedAt).getTime();
					const end = new Date(chunk.chunkEndedAt).getTime();
					return (
						!Number.isNaN(start) &&
						!Number.isNaN(end) &&
						violationTimes.some((violationTs) => violationTs >= start && violationTs <= end)
					);
				})
				.map((chunk) => chunk.id),
		);
	}, [audioChunks, flaggedEventTimes]);

	const questionStatMap = useMemo(
		() => new Map(examStats?.questionStats.map((s) => [s.id, s])),
		[examStats],
	);

	useEffect(() => {
		if (!finishAt || !resultsLocked) {
			setCountdown("00:00:00");
			return;
		}
		const updateCountdown = () => {
			const target = new Date(finishAt).getTime();
			if (Number.isNaN(target)) {
				setCountdown("00:00:00");
				return;
			}
			const diff = Math.max(target - Date.now(), 0);
			const hours = Math.floor(diff / 3_600_000);
			const minutes = Math.floor((diff % 3_600_000) / 60_000);
			const seconds = Math.floor((diff % 60_000) / 1000);
			const pad = (value: number) => value.toString().padStart(2, "0");
			setCountdown(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
			setNowTs(Date.now());
		};
		updateCountdown();
		const timer = window.setInterval(updateCountdown, 1000);
		return () => window.clearInterval(timer);
	}, [finishAt, resultsLocked]);

	const answeredCount = selectedSubmission?.answers?.filter((answer) => answer.selectedAnswer).length ?? 0;
	const performanceMeta = selectedSubmission
		? getPerformanceMeta(selectedSubmission.percentage)
		: null;
	const profileRows = getProfileRows(studentProfile);

	return (
		<div className={cardClass}>
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className="text-xl font-semibold text-slate-900">Дэлгэрэнгүй</h2>
					<p className={`mt-2 ${sectionDescriptionClass}`}>
						Сонгосон сурагчийн профайл, зөрчил, хариултыг нэг дороос харна.
					</p>
				</div>
				<div className="rounded-full border border-[#dce5ef] bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold text-slate-600">
					{selectedSubmission ? "Тайлан нээлттэй" : "Тайлан хүлээгдэж байна"}
				</div>
			</div>

			{!selectedSubmission && (
				<div className="mt-6 rounded-[26px] border border-dashed border-[#d8e3f0] bg-[linear-gradient(180deg,#fbfdff_0%,#f6f9fe_100%)] px-5 py-8 text-center shadow-[0_18px_34px_-34px_rgba(15,23,42,0.22)]">
					<div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-[0_14px_30px_-24px_rgba(37,99,235,0.5)]">
						{selectedExam ? (
							<UserRoundSearch className="h-5 w-5" />
						) : (
							<FileSearch className="h-5 w-5" />
						)}
					</div>
					<h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-slate-900">
						{selectedExam ? "Сурагч сонгоогүй байна" : "Шалгалт сонгоогүй байна"}
					</h3>
					<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
						{selectedExam
							? `"${selectedExam.title}" шалгалтын жагсаалтаас нэг сурагч сонговол энд дэлгэрэнгүй тайлан харагдана.`
							: "Гүйцэтгэлийн жагсаалтаас шалгалт сонгоод дүн, тайлан, хариултын мэдээллээ нээнэ үү."}
					</p>
					{selectedExam && (
						<div className="mx-auto mt-5 max-w-sm rounded-[18px] border border-[#dce5ef] bg-white px-4 py-3 text-left">
							<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
								Идэвхтэй шалгалт
							</div>
							<div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
								{selectedExam.title}
							</div>
						</div>
					)}
				</div>
			)}

			{selectedSubmission && (
				<div className="mt-6 space-y-4 text-sm">
					<div className="rounded-[24px] border border-[#dce5ef] bg-[linear-gradient(180deg,#f7fbff_0%,#eef5ff_100%)] px-5 py-5">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
									Сонгосон сурагч
								</div>
								<div className="mt-2 text-lg font-semibold text-slate-900">
									{selectedSubmission.studentName}
								</div>
								<div className="mt-2 text-sm text-slate-500">
									Илгээсэн: {formatDateTime(selectedSubmission.submittedAt)}
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{performanceMeta && (
										<span
											className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${performanceMeta.badgeClass}`}
										>
											{performanceMeta.label}
										</span>
									)}
									{selectedSubmission.terminated && (
										<span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
											Зогссон сесс
										</span>
									)}
								</div>
							</div>
							<div className="rounded-[20px] border border-[#d7e3f4] bg-white px-4 py-3 text-right shadow-[0_12px_30px_-24px_rgba(37,99,235,0.35)]">
								<div className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
									{selectedSubmission.percentage}%
								</div>
								<div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
									Гүйцэтгэл
								</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<SidebarStat
							label="Оноо"
							value={`${selectedSubmission.score}/${selectedSubmission.totalPoints}`}
							description="Нийт авсан оноо"
						/>
						<SidebarStat
							label="Хариулсан"
							value={`${answeredCount}`}
							description="Сонгосон хариулттай асуулт"
						/>
						<SidebarStat
							label="Зөрчил"
							value={`${violationTotal}`}
							description="Сессийн явцад бүртгэгдсэн нийт тэмдэглэл"
							className="col-span-2 border-[#e7dfcf] bg-[#fbf8f2]"
						/>
					</div>

					<div className="rounded-[22px] border border-[#e3e8ef] bg-[#fbfdff] px-4 py-4">
						<div className="flex items-center justify-between gap-3">
							<div className="text-sm font-semibold text-slate-900">Сурагчийн профайл</div>
							<div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
								Профайл
							</div>
						</div>
						{profileLoading && (
							<div className="mt-4 grid gap-2">
								<Skeleton className="h-4 w-28 rounded-full bg-slate-200" />
								<Skeleton className="h-4 w-40 rounded-full bg-slate-200" />
								<Skeleton className="h-4 w-32 rounded-full bg-slate-200" />
							</div>
						)}
						{!profileLoading && !studentProfile && (
							<div className="mt-4 rounded-[16px] border border-dashed border-[#d7e0ea] bg-white px-4 py-4 text-sm text-slate-400">
								Профайл мэдээлэл алга.
							</div>
						)}
						{!profileLoading && studentProfile && (
							<div className="mt-4 space-y-2 text-sm">
								{profileRows.map((row) => (
									<div
										key={row.label}
										className="flex items-start justify-between gap-3 rounded-[16px] border border-white bg-white px-3 py-3"
									>
										<div className="text-slate-400">{row.label}</div>
										<div className="max-w-[60%] text-right font-medium text-slate-700">
											{row.value}
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<AttendanceStatsCard stats={attendanceStats} loading={attendanceLoading} />

					{violationEntries.length > 0 && (
						<div className="rounded-[22px] border border-[#e7dfcf] bg-[#fbf8f2] px-4 py-4">
							<div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
								<AlertTriangleIcon className="size-4 text-[#8a7654]" />
								Зөрчлийн тэмдэглэл
							</div>
							<div className="mt-3 space-y-2">
								{violationEntries.map((item) => (
									<div
										key={item.label}
										className="flex items-center justify-between gap-3 rounded-[16px] border border-[#eadfca] bg-white px-3 py-3 text-sm"
									>
										<div className="text-slate-600">{item.label}</div>
										<div className="font-semibold text-slate-900">{item.value}</div>
									</div>
								))}
							</div>
						</div>
					)}

					<div className="rounded-[22px] border border-[#e3e8ef] bg-[#fbfdff] px-4 py-4">
						<div className="text-sm font-semibold text-slate-900">Аудио баримт</div>
						{audioLoading && (
							<div className="mt-2 text-sm text-slate-500">Ачаалж байна...</div>
						)}
						{!audioLoading && audioChunks.length === 0 && (
							<div className="mt-2 text-sm text-slate-400">
								Энэ сессэд аудио файл одоогоор алга.
							</div>
						)}
						{!audioLoading && audioChunks.length > 0 && (
							<div className="mt-3 space-y-2">
								<div className="text-[11px] text-slate-500">
									{audioChunks.length} clip, flagged event overlap: {highlightedChunkIds.size}
								</div>
								{audioChunks.map((chunk) => (
									<div
										key={chunk.id}
										className={`rounded-[16px] border px-3 py-3 ${
											highlightedChunkIds.has(chunk.id)
												? "border-[#f4b183] bg-[#fff7ed]"
												: "border-[#dce5ef] bg-white"
										}`}
									>
										<div className="flex items-center justify-between gap-3">
											<div>
												<div className="text-sm font-semibold text-slate-900">
													Clip #{chunk.sequenceNumber + 1}
												</div>
												<div className="mt-1 text-[11px] text-slate-500">
													{new Date(chunk.chunkStartedAt).toLocaleTimeString()} -{" "}
													{new Date(chunk.chunkEndedAt).toLocaleTimeString()}
												</div>
											</div>
											<span className="rounded-full border border-[#dce5ef] bg-[#f8fafc] px-2 py-1 text-[11px] font-semibold text-slate-600">
												{Math.round(chunk.durationMs / 1000)}s
											</span>
										</div>
										<div className="mt-3 flex flex-wrap gap-2">
											<audio controls preload="none" src={chunk.assetUrl} className="max-w-full" />
											<a
												className="inline-flex items-center rounded-[12px] border border-[#dce5ef] bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:bg-[#f8fafc]"
												href={chunk.assetUrl}
												target="_blank"
												rel="noreferrer"
											>
												Open
											</a>
										</div>
										{highlightedChunkIds.has(chunk.id) && (
											<div className="mt-2 text-[11px] font-semibold text-[#c46a17]">
												Contains a flagged event window
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>

					{resultsLocked && (
						<div className="rounded-[22px] border border-[#f2df9d] bg-[#fffbeb] px-4 py-4 text-sm text-amber-800">
							<div className="flex items-center gap-2 font-semibold">
								<Clock3Icon className="size-4" />
								Шалгалт дуусаагүй байна
							</div>
							<div className="mt-2 leading-6">
								Шалгалт бүрэн дууссаны дараа энэ сурагчийн хариултын тайлан бүрэн гарна.
							</div>
							{finishAt && (
								<div className="mt-3 rounded-[16px] border border-amber-200 bg-white px-3 py-3 text-sm font-semibold text-amber-700">
									Дуусах хүртэл: {countdown}
								</div>
							)}
						</div>
					)}

					{selectedExam && selectedSubmission.answers && !resultsLocked && (
						<div className="rounded-[22px] border border-[#e3e8ef] bg-[#fbfdff] px-4 py-4">
							<div className="flex items-center justify-between gap-3">
								<div>
									<div className="text-sm font-semibold text-slate-900">Хариултын тайлан</div>
									<div className="mt-1 text-xs leading-5 text-slate-500">
										Сонгосон хариулт болон нийт ангийн тухайн асуултын зөв хариултын хувийг харуулна.
									</div>
								</div>
							</div>
							<div className="mt-4 space-y-3">
								{selectedExam.questions.map((question, index) => {
									const answer = answerMap.get(question.id);
									const stat = questionStatMap.get(question.id);
									const rate = stat?.correctRate ?? 0;
									const tone = getRateTone(rate);
									const answerState = !answer?.selectedAnswer
										? "Алгассан"
										: answer.correct
											? "Зөв"
											: "Буруу";
									const answerStateClass = !answer?.selectedAnswer
										? "border-slate-200 bg-slate-100 text-slate-600"
										: answer.correct
											? "border-[#d7e6dd] bg-[#f6faf7] text-[#557565]"
											: "border-[#e7dfcf] bg-[#fbf8f2] text-[#8a7654]";

									return (
										<div
											key={question.id}
											className="rounded-[18px] border border-white bg-white px-4 py-4"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0 flex-1">
													<div className="text-sm font-semibold leading-6 text-slate-900">
														{index + 1}. {question.text}
													</div>
												</div>
												<div
													className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${answerStateClass}`}
												>
													{answerState}
												</div>
											</div>

											<div className="mt-3 space-y-2 text-sm">
												<div className="rounded-[14px] border border-[#eef2f7] bg-[#fbfdff] px-3 py-3">
													<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
														Өгсөн хариулт
													</div>
													<div className="mt-1 font-medium text-slate-700">
														{answer?.selectedAnswer || "Хариулаагүй"}
													</div>
												</div>
												{!answer?.correct && (
													<div className="rounded-[14px] border border-[#eef2f7] bg-[#fbfdff] px-3 py-3">
														<div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
															Зөв хариулт
														</div>
														<div className="mt-1 font-medium text-slate-700">
															{question.correctAnswer}
														</div>
													</div>
												)}
											</div>

											<div className="mt-3 flex items-center gap-3">
												<div className="min-w-[84px] text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
													Ангийн зөв хувь
												</div>
												<div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e8eef6]">
													<div
														className={`h-full rounded-full ${tone.bar}`}
														style={{ width: `${rate}%`, transition: "width 700ms ease" }}
													/>
												</div>
												<div className={`text-xs font-semibold ${tone.text}`}>{rate}%</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
