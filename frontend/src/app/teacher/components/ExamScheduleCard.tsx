import { useEffect, useState } from "react";
import {
  buttonPrimary,
  buttonSecondary,
  cardClass,
  figmaCompactSelectClass,
  figmaFieldClass,
  figmaTextareaClass,
} from "../styles";

type ExamScheduleCardProps = {
  scheduleTitle: string;
  setScheduleTitle: (value: string) => void;
  scheduleDate: string;
  setScheduleDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  roomCode: string | null;
  onSchedule: () => void;
  onCopyCode: (code: string) => void;
};

export default function ExamScheduleCard({
  scheduleTitle,
  setScheduleTitle,
  scheduleDate,
  setScheduleDate,
  durationMinutes,
  setDurationMinutes,
  roomCode,
  onSchedule,
  onCopyCode,
}: ExamScheduleCardProps) {
  const examTypes = [
    { value: "progress", label: "Явцын шалгалт" },
    { value: "term", label: "Улирлын шалгалт" },
  ] as const;
  const classOptions = [
    "6-р анги",
    "7-р анги",
    "8-р анги",
    "9-р анги",
    "10-р анги",
    "11-р анги",
    "12-р анги",
  ];
  const subjectOptions = [
    "Англи хэл",
    "Математик",
    "Монгол хэл",
    "Физик",
    "Хими",
    "Түүх",
  ];
  const minuteOptions = ["15", "30", "45", "60", "90"];
  const secondOptions = ["00", "15", "30", "45"];

  const [examType, setExamType] = useState<(typeof examTypes)[number]["value"]>("progress");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [description, setDescription] = useState("");
  const [seconds, setSeconds] = useState("00");

  const examTypeLabel =
    examTypes.find((item) => item.value === examType)?.label ?? "";

  useEffect(() => {
    const nextTitle = [selectedClass, selectedSubject, examTypeLabel]
      .filter(Boolean)
      .join(" ");
    if (nextTitle !== scheduleTitle) {
      setScheduleTitle(nextTitle);
    }
  }, [examTypeLabel, scheduleTitle, selectedClass, selectedSubject, setScheduleTitle]);

  return (
    <div className={`${cardClass} h-full font-sans`}>
      <div className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid gap-4">
              <div className="text-[16px] font-semibold text-black">Төрөл</div>
              <div className="flex flex-wrap items-center gap-[30px]">
                {examTypes.map((item) => {
                  const checked = examType === item.value;
                  return (
                    <button
                      key={item.value}
                      className="inline-flex items-center gap-[10px]"
                      onClick={() => setExamType(item.value)}
                      type="button"
                    >
                      <span
                        className={`grid size-5 place-items-center rounded-full border-[2.5px] ${
                          checked ? "border-[#2563eb]" : "border-[#bbbbbb]"
                        }`}
                      >
                        {checked && <span className="size-2 rounded-full bg-[#2563eb]" />}
                      </span>
                      <span className="text-[14px] font-medium text-black">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">Анги</span>
              <select
                className={figmaFieldClass}
                value={selectedClass}
                onChange={(event) => setSelectedClass(event.target.value)}
              >
                <option value="">Анги сонгоно уу.</option>
                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">Хичээл</span>
              <select
                className={figmaFieldClass}
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
              >
                <option value="">Хичээл сонгоно уу.</option>
                {subjectOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">Тайлбар</span>
              <textarea
                className={figmaTextareaClass}
                placeholder="Жишээ нь: Шалгалтын сэдэв"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">Огноо</span>
              <input
                type="datetime-local"
                className={figmaFieldClass}
                value={scheduleDate ?? ""}
                onChange={(event) => setScheduleDate(event.target.value)}
              />
            </label>

            <div className="grid gap-3">
              <span className="text-[16px] font-semibold text-black">
                Гүйцэтгэх хугацаа (Заавал биш)
              </span>
              <div className="flex flex-wrap gap-5">
                <select
                  className={`${figmaCompactSelectClass} min-w-[100px]`}
                  value={String(durationMinutes)}
                  onChange={(event) => setDurationMinutes(Number(event.target.value))}
                >
                  {minuteOptions.map((item) => (
                    <option key={item} value={item}>
                      {item === "15" ? "Минут" : `${item} минут`}
                    </option>
                  ))}
                </select>
                <select
                  className={`${figmaCompactSelectClass} min-w-[110px]`}
                  value={seconds}
                  onChange={(event) => setSeconds(event.target.value)}
                >
                  {secondOptions.map((item) => (
                    <option key={item} value={item}>
                      {item === "00" ? "Секунд" : `${item} секунд`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button className={`w-full ${buttonPrimary}`} onClick={onSchedule} type="button">
          Хуваарь үүсгэх
        </button>

        {roomCode && (
          <div className="rounded-[16px] border border-[rgba(0,0,0,0.12)] bg-white px-3 py-2 text-sm text-slate-700">
            <div className="text-[16px] font-semibold text-black">
              Шалгалтын код
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xl font-semibold tracking-[0.08em] text-slate-900">
                {roomCode}
              </span>
              <button
                className={buttonSecondary}
                onClick={() => onCopyCode(roomCode)}
                type="button"
              >
                Хуулах
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
