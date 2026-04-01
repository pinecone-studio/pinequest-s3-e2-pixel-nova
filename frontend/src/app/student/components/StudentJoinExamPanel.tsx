import {
  CircleAlert,
  ClipboardX,
  Clock3,
  Info,
  Play,
  RefreshCcw,
  Video,
} from "lucide-react";
import type { Exam } from "../types";
import { formatDate, gradeFromPercentage } from "../utils";

type JoinExamPanelProps = {
  loading: boolean;
  roomCodeInput: string;
  setRoomCodeInput: (value: string) => void;
  joinLoading: boolean;
  joinError: string | null;
  onLookup: () => void;
  selectedExam?: Exam | null;
  studentHistory: {
    examId: string;
    title: string;
    percentage: number;
    score?: number;
    totalPoints?: number;
    grade?: "A" | "B" | "C" | "D" | "F";
    date: string;
  }[];
};

const infoItems = [
  {
    title: "Буцах боломжгүй",
    description: "Өмнөх асуулт руу буцах боломжгүй",
    icon: RefreshCcw,
    className: "border-[#cfd8ff] bg-white text-[#6670d6]",
    iconClassName: "text-[#6670d6]",
  },
  {
    title: "Автоматаар илгээнэ",
    description: "Хугацаа дуусмагц автоматаар илгээгдэнэ",
    icon: Clock3,
    className: "border-[#cfd8ff] bg-white text-[#6670d6]",
    iconClassName: "text-[#6670d6]",
  },
  {
    title: "Хуулах, буулгах",
    description: "Идэвхгүй",
    icon: ClipboardX,
    className: "border-[#f1c1c1] bg-[#fff9f9] text-[#ef6f67]",
    iconClassName: "text-[#ef6f67]",
  },
  {
    title: "Камер",
    description: "Заавал асаалттай байна",
    icon: Video,
    className: "border-[#f1c1c1] bg-[#fff9f9] text-[#ef6f67]",
    iconClassName: "text-[#ef6f67]",
  },
] as const;

export default function StudentJoinExamPanel({
  loading,
  roomCodeInput,
  setRoomCodeInput,
  joinLoading,
  joinError,
  onLookup,
  selectedExam,
  studentHistory,
}: JoinExamPanelProps) {
  if (loading) {
    return (
      <section
        aria-label="student-exams-loading"
        className="mx-auto w-full max-w-[1272px]"
      >
        <div className="h-[224px] w-full animate-pulse rounded-[24px] bg-[#e4e4e4]" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1272px] space-y-8">
      <div className="rounded-[36px] border border-[#dfe5fb] bg-white px-6 py-6 shadow-[0_26px_70px_rgba(80,94,133,0.10)] sm:px-8 sm:py-6">
        <div className="grid items-center gap-8 xl:grid-cols-[496px_minmax(0,1fr)]">
          <div className="flex min-h-[235px] w-full max-w-[496px] flex-col justify-between rounded-[30px] bg-white pr-0 xl:pr-6">
            <div>
              <div className="text-[15px] font-medium text-[#aeb9d6]">
                Шалгалтын мэдээлэл
              </div>
              <h2 className="mt-2 text-[2.35rem] font-semibold tracking-[-0.055em] text-[#5564d9] sm:text-[2.65rem]">
                Шалгалтад нэвтрэх
              </h2>
            </div>

            <div className="mt-6 max-w-[496px] min-h-[40x] space-y-4">
              <input
                className="h-14 w-full rounded-[20px] border border-[#dfe5fb] bg-[#fbfcff] px-5 text-base font-medium text-slate-800 outline-none transition placeholder:text-[#adb7cf] focus:border-[#aab7ff] focus:bg-white"
                placeholder="Өрөөний код"
                value={roomCodeInput}
                onChange={(event) =>
                  setRoomCodeInput(event.target.value.toUpperCase())
                }
              />

              <div className="flex justify-end pt-1">
                <button
                  className={`inline-flex h-11 min-w-[198px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6354ee] to-[#4f4be4] px-5 text-[15px] font-semibold text-white shadow-[0_20px_42px_rgba(96,84,228,0.28)] transition hover:brightness-105 ${
                    joinLoading ? "opacity-70" : ""
                  }`}
                  onClick={onLookup}
                  disabled={joinLoading}
                >
                  <Play className="h-[18px] w-[18px]" />
                  {joinLoading ? "Нэвтэрч байна..." : "Шалгалтад нэвтрэх"}
                </button>
              </div>

              {joinError && (
                <div className="rounded-[18px] border border-[#ffd4d4] bg-[#fff7f7] px-4 py-3 text-sm text-[#e45d5d]">
                  {joinError}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-[#edf1ff] bg-[#f7f8ff] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:px-6">
            <div className="flex items-center gap-2.5 text-[1.15rem] font-semibold text-[#4f5fc7]">
              <CircleAlert className="h-5 w-5" />
              Шалгалтын дүрэм ба мэдээлэл
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {infoItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`flex min-h-[62px] flex-col justify-center rounded-[14px] border px-3.5 py-2.5 ${item.className}`}
                  >
                    <div className="flex items-center gap-2 text-[0.95rem] font-semibold leading-none">
                      <Icon className={`h-[18px] w-[18px] ${item.iconClassName}`} />
                      {item.title}
                    </div>
                    <div className="mt-1 text-[12px] leading-[1.15] text-slate-400">
                      {item.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-[#e6ecfb] bg-[#f8fbff] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Info className="h-4 w-4 text-[#62a9ff]" />
          Эхлэхийн өмнө
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-500">
          <li>Шалгалтын дүрэм, хугацаагаа урьдчилан шалгаарай.</li>
          <li>Бүтэн дэлгэц ба хуулалтын эсрэг хамгаалалт автоматаар асна.</li>
          <li>Шалгалт эхэлмэгц хариултууд автоматаар хадгалагдана.</li>
          {selectedExam?.requiresAudioRecording && (
            <li>Микрофоны хяналтын аудио бичлэг шаардлагатай.</li>
          )}
        </ul>
      </div>

      <div className="rounded-[30px] border border-[#e8edf9] bg-white p-6 shadow-[0_22px_55px_rgba(68,84,125,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Өмнөх шалгалтууд
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {studentHistory.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-[#d7def4] bg-[#fafbff] px-5 py-8 text-sm text-slate-400">
              Одоогоор өмнөх шалгалтын түүх алга байна.
            </div>
          ) : (
            studentHistory.map((item) => {
              const score = item.score ?? Math.round(item.percentage);
              const totalPoints = item.totalPoints ?? 100;
              const grade = item.grade ?? gradeFromPercentage(item.percentage);

              return (
                <div
                  key={`${item.examId}-${item.date}`}
                  className="rounded-[22px] border border-[#e7ecfb] bg-[#fafcff] px-5 py-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#5c63ce]">
                        {grade}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        {score}/{totalPoints}
                      </div>
                      <div className="text-sm text-slate-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
