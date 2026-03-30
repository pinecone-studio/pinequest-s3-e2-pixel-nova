import { minuteOptions, secondOptions } from "./exam-schedule-constants";
import TeacherSelect from "./TeacherSelect";

type ExamScheduleDurationProps = {
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  seconds: string;
  setSeconds: (value: string) => void;
};

export default function ExamScheduleDuration({
  durationMinutes,
  setDurationMinutes,
  seconds,
  setSeconds,
}: ExamScheduleDurationProps) {
  return (
    <div className="grid gap-3">
      <span className="text-[16px] font-semibold text-black">
        Гүйцэтгэх хугацаа (Заавал биш)
      </span>
      <div className="flex flex-wrap gap-5">
        <TeacherSelect
          compact
          options={minuteOptions.map((item) => ({
            value: item,
            label: item === "15" ? "Минут" : `${item} минут`,
          }))}
          value={String(durationMinutes)}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
          onWheel={(event) => event.currentTarget.blur()}
        />
        <TeacherSelect
          compact
          options={secondOptions.map((item) => ({
            value: item,
            label: item === "00" ? "Секунд" : `${item} секунд`,
          }))}
          value={seconds}
          onChange={(event) => setSeconds(event.target.value)}
          onWheel={(event) => event.currentTarget.blur()}
        />
      </div>
    </div>
  );
}
