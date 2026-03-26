import { inputClass } from "../../styles";

type ExamMetaFieldsProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
  createDate: string;
  setCreateDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
};

export default function ExamMetaFields({
  examTitle,
  setExamTitle,
  createDate,
  setCreateDate,
  durationMinutes,
  setDurationMinutes,
}: ExamMetaFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_160px]">
      <input
        className={inputClass}
        placeholder="Шалгалтын нэр оруулна уу"
        value={examTitle ?? ""}
        onChange={(event) => setExamTitle(event.target.value)}
      />
      <input
        type="datetime-local"
        className={inputClass}
        value={createDate ?? ""}
        onChange={(event) => setCreateDate(event.target.value)}
      />
      <input
        type="number"
        min={10}
        className={inputClass}
        value={Number.isFinite(durationMinutes) ? durationMinutes : 0}
        onChange={(event) => setDurationMinutes(Number(event.target.value))}
        placeholder="45 мин"
      />
    </div>
  );
}
