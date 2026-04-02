import { figmaTextareaClass } from "../styles";
import { classOptions, subjectOptions } from "./exam-schedule-constants";
import TeacherSelect from "./TeacherSelect";

type ExamScheduleMetaFieldsProps = {
  scheduleClassName: string;
  setScheduleClassName: (value: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (value: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (value: string) => void;
  scheduleExpectedStudentsCount: number;
  setScheduleExpectedStudentsCount: (value: number) => void;
};

export default function ExamScheduleMetaFields({
  scheduleClassName,
  setScheduleClassName,
  scheduleSubjectName,
  setScheduleSubjectName,
  scheduleDescription,
  setScheduleDescription,
  scheduleExpectedStudentsCount,
  setScheduleExpectedStudentsCount,
}: ExamScheduleMetaFieldsProps) {
  const selectedClasses = scheduleClassName
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const availableClasses = classOptions.filter(
    (item) => !selectedClasses.includes(item),
  );

  const addClass = (value: string) => {
    if (!value || selectedClasses.includes(value)) return;
    setScheduleClassName([...selectedClasses, value].join(", "));
  };

  const removeClass = (value: string) => {
    setScheduleClassName(
      selectedClasses.filter((item) => item !== value).join(", "),
    );
  };

  return (
    <>
      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Анги</span>
        <div className="grid gap-2">
          <div className="text-[12px] text-[#8a8f98]">
            Жишээ: 9А, 8Б заавал судлах
          </div>
          {selectedClasses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedClasses.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => removeClass(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d9dee8] bg-[#f3f5f9] px-3 py-1 text-[12px] font-medium text-[#515761] transition hover:bg-[#e9edf4]"
                >
                  <span>{item}</span>
                  <span className="text-[13px] leading-none text-[#7c8493]">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
          <TeacherSelect
            options={[
              { value: "", label: "Анги сонгоно уу." },
              ...availableClasses.map((item) => ({ value: item, label: item })),
            ]}
            value=""
            onChange={(event) => addClass(event.target.value)}
          />
        </div>
      </label>

      <TeacherSelect
        label="Хичээл"
        options={[
          { value: "", label: "Хичээл сонгоно уу." },
          ...subjectOptions.map((item) => ({ value: item, label: item })),
        ]}
        value={scheduleSubjectName}
        onChange={(event) => setScheduleSubjectName(event.target.value)}
      />

      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Тайлбар</span>
        <textarea
          className={figmaTextareaClass}
          placeholder="Хичээлтэй холбоотой тайлбар болон шалгалтын чиглэлийг энд бичнэ үү."
          value={scheduleDescription}
          onChange={(event) => setScheduleDescription(event.target.value)}
        />
      </label>
    </>
  );
}
