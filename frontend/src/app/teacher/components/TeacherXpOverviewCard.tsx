import { badgeClass, cardClass, sectionDescriptionClass, sectionTitleClass } from "../styles";
import type { XpLeaderboardEntry } from "../types";
import { ZapIcon } from "lucide-react";

type TeacherXpOverviewCardProps = {
	students: XpLeaderboardEntry[];
};

const LEADERBOARD_LIMIT = 6;

export default function TeacherXpOverviewCard({ students }: TeacherXpOverviewCardProps) {
	const topStudent = students[0] ?? null;
	const leaderboard = students.slice(0, LEADERBOARD_LIMIT);
	const totalXp = students.reduce((sum, s) => sum + s.xp, 0);
	const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;

	return (
		<div className={`${cardClass} overflow-hidden`}>
			<div>
				<span className={badgeClass}>Сурагчийн ахиц</span>
				<h2 className={`mt-3 ${sectionTitleClass}`}>XP эрэмбэ</h2>
				<p className={`mt-2 ${sectionDescriptionClass}`}>
					Хамгийн идэвхтэй сурагчид болон дундаж XP үзүүлэлт.
				</p>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
				{[
					{ label: "Нийт XP", value: totalXp },
					{ label: "Дундаж XP", value: avgXp },
					{ label: "Сурагч", value: students.length },
				].map((item) => (
					<div key={item.label} className="rounded-[18px] border border-[#e2e9f0] bg-[#f8fafc] px-4 py-3">
						<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
							{item.label}
						</div>
						<div className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
					</div>
				))}
			</div>

			{students.length === 0 ? (
				<div className="mt-6 rounded-[22px] border border-dashed border-[#d7e0ea] bg-[#f8fafc] px-4 py-10 text-center text-sm text-slate-400">
					Сурагчид шалгалт өгч эхэлмэгц эрэмбэ энд гарч ирнэ.
				</div>
			) : (
				<>
					{topStudent && (
						<div className="mt-6 rounded-[24px] border border-[#d9e4f0] bg-[linear-gradient(180deg,#f5f9fd_0%,#ffffff_100%)] px-5 py-5">
							<div className="flex items-start gap-4">
								<div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[#d9e4f0] bg-white text-2xl">
									{topStudent.icon}
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
										Тэргүүлж буй сурагч
									</div>
									<div className="mt-2 truncate text-lg font-semibold text-slate-900">
										{topStudent.name}
									</div>
									<div className="mt-1 text-sm text-slate-500">
										{topStudent.xp} XP · Түвшин {topStudent.level}
									</div>
									<div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e8eef6]">
										<div
											className="h-full rounded-full bg-[#9bb5d1]"
											style={{ width: `${topStudent.progressPercent}%` }}
										/>
									</div>
								</div>
							</div>
						</div>
					)}

					<div className="mt-6">
						<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
							<ZapIcon className="size-3.5" />
							Тэргүүлэх жагсаалт
						</div>
						<div className="mt-3 space-y-2">
							{leaderboard.map((student, index) => (
								<div
									key={student.studentId}
									className="flex items-center gap-3 rounded-[18px] border border-[#e2e9f0] bg-white px-4 py-3"
								>
									<div className="w-6 shrink-0 text-center text-sm font-semibold text-slate-400">
										{index + 1}
									</div>
									<div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#e2e9f0] bg-[#f8fafc] text-lg">
										{student.icon}
									</div>
									<div className="min-w-0 flex-1">
										<div className="truncate text-sm font-semibold text-slate-900">{student.name}</div>
										<div className="mt-1 text-xs text-slate-500">
											Түвшин {student.level} · {student.examsTaken} шалгалт
										</div>
									</div>
									<div className="shrink-0 text-right">
										<div className="text-sm font-semibold text-slate-900">{student.xp} XP</div>
										<div className="text-[11px] text-slate-400">{student.progressPercent}%</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
