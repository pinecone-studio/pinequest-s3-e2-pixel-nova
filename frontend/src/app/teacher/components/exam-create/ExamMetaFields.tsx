import { inputClass, labelClass } from "../../styles";

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

  expectedStudentsCount,
  setExpectedStudentsCount,
}: ExamMetaFieldsProps) {
  return (
    <div className=" gap-2 flex">
      <label className="w-[85%]">
        <span className={labelClass}>Гарчиг</span>
        <input
          className={`${inputClass} h-12`}
          placeholder="Гарчиг оруулна уу"
          value={examTitle ?? ""}
          onChange={(event) => setExamTitle(event.target.value)}
        />
      </label>
      <label className="w-[15%]">
        <span className={labelClass}>Сурагчийн тоо</span>
        <input
          className={`${inputClass} h-12`}
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
      </label>
    </div>
  );
}
