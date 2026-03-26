import { figmaCompactSelectClass } from "../styles";
import { minuteOptions, secondOptions } from "./exam-schedule-constants";

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
  );
}
