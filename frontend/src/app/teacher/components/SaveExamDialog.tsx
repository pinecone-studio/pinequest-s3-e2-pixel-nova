"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, FolderIcon } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import { buttonPrimary, buttonSecondary } from "../styles";

const CLASS_OPTIONS = [
	"1-р анги",
	"2-р анги",
	"3-р анги",
	"4-р анги",
	"5-р анги",
	"6-р анги",
	"7-р анги",
	"8-р анги",
	"9-р анги",
	"10-р анги",
	"11-р анги",
	"12-р анги",
];

type SaveExamDialogProps = {
	open: boolean;
	onClose: () => void;
	examTitle: string;
	onSave: (title: string, className: string) => void;
	saving: boolean;
};

export default function SaveExamDialog({
	open,
	onClose,
	examTitle,
	onSave,
	saving,
}: SaveExamDialogProps) {
	const [title, setTitle] = useState(examTitle);
	const [className, setClassName] = useState("");

	useEffect(() => {
		if (open) {
			setTitle(examTitle);
		}
	}, [open, examTitle]);

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent
				showCloseButton={false}
				className="max-w-[360px] gap-0 overflow-hidden rounded-2xl border border-[#d5dfeb] p-0 shadow-[0_24px_56px_-20px_rgba(15,23,42,0.22)]">
				<DialogTitle className="sr-only">Шалгалт хадгалах</DialogTitle>
				<div className="px-5 pt-4 pb-5">
					<p className="mb-4 text-xs text-slate-400">save file</p>

					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<label className="w-[88px] shrink-0 text-right text-sm text-slate-600">
								Файлын нэр:
							</label>
							<input
								className="flex-1 rounded-xl border border-[#d5dfeb] bg-[#f8fafc] px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								autoFocus
							/>
						</div>

						<div className="flex items-center gap-3">
							<label className="w-[88px] shrink-0 text-right text-sm text-slate-600">
								Ангилах:
							</label>
							<div className="relative flex-1">
								<FolderIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
								<select
									className="w-full appearance-none rounded-xl border border-[#d5dfeb] bg-[#f8fafc] py-1.5 pl-8 pr-8 text-sm text-slate-800 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
									value={className}
									onChange={(e) => setClassName(e.target.value)}>
									<option value="">Анги сонгох</option>
									{CLASS_OPTIONS.map((opt) => (
										<option key={opt} value={opt}>
											{opt}
										</option>
									))}
								</select>
								<ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
							</div>
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-2 border-t border-[#edf0f6] px-5 py-3">
					<button
						type="button"
						onClick={onClose}
						disabled={saving}
						className={buttonSecondary}>
						Болих
					</button>
					<button
						type="button"
						disabled={saving || !title.trim()}
						onClick={() => onSave(title.trim(), className)}
						className={`${buttonPrimary} disabled:cursor-not-allowed disabled:opacity-50`}>
						{saving ? (
							<>
								<svg
									className="size-4 animate-spin"
									viewBox="0 0 24 24"
									fill="none">
									<circle
										cx="12"
										cy="12"
										r="9"
										stroke="currentColor"
										strokeOpacity="0.28"
										strokeWidth="2"
									/>
									<path
										d="M21 12a9 9 0 0 0-9-9"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
									/>
								</svg>
								Хадгалж байна...
							</>
						) : (
							"Хадгалах"
						)}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
