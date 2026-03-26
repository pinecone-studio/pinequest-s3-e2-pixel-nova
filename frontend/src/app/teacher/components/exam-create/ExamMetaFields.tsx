import { inputClass } from "../../styles";

type ExamMetaFieldsProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
  createDate: string;
  setCreateDate: (value: string) => void;
  durationMinutes: number;
  setDurationMinutes: (value: number) => void;
  expectedStudentsCount: number;
  setExpectedStudentsCount: (value: number) => void;
};

export default function ExamMetaFields({
  examTitle,
  setExamTitle,
  createDate,
  setCreateDate,
  durationMinutes,
  setDurationMinutes,
  expectedStudentsCount,
  setExpectedStudentsCount,
}: ExamMetaFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_160px_180px]">
      <input
        className={inputClass}
        placeholder="Шалгалтын нэр оруулна уу"
        value={examTitle ?? ""}
        onChange={(event) => setExamTitle(event.target.value)}
      />
      <input
        className={inputClass}
        type="datetime-local"
        value={createDate ?? ""}
        onChange={(event) => setCreateDate(event.target.value)}
      />
      <input
        className={inputClass}
        type="number"
        min={0}
        step={1}
        placeholder="Минут"
        value={Number.isFinite(durationMinutes) ? durationMinutes : 0}
        onChange={(event) =>
          setDurationMinutes(Number(event.target.value) || 0)
        }
      />
      <input
        className={inputClass}
        type="number"
        min={0}
        step={1}
        placeholder="Хүлээгдэж буй сурагч"
        value={
          Number.isFinite(expectedStudentsCount) ? expectedStudentsCount : 0
        }
        onChange={(event) =>
          setExpectedStudentsCount(Number(event.target.value) || 0)
        }
      />
    </div>
  );
}
