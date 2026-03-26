import { inputClass } from "../../styles";

type ExamMetaFieldsProps = {
  examTitle: string;
  setExamTitle: (value: string) => void;
};

export default function ExamMetaFields({
  examTitle,
  setExamTitle,
}: ExamMetaFieldsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_160px_180px]">
      <input
        className={inputClass}
        placeholder="Шалгалтын нэр оруулна уу"
        value={examTitle ?? ""}
        onChange={(event) => setExamTitle(event.target.value)}
      />
    </div>
  );
}
