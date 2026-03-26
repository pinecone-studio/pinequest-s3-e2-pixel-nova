import { useEffect, useState } from "react";

export const useExamScheduleState = () => {
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleExamType, setScheduleExamType] = useState("progress");
  const [scheduleClassName, setScheduleClassName] = useState("");
  const [scheduleGroupName, setScheduleGroupName] = useState("");
  const [scheduleSubjectName, setScheduleSubjectName] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [selectedScheduleExamId, setSelectedScheduleExamId] = useState("");

  useEffect(() => {
    const examTypeLabel =
      scheduleExamType === "term" ? "Улирлын шалгалт" : "Явцын шалгалт";
    const nextTitle = [
      scheduleClassName,
      scheduleGroupName,
      scheduleSubjectName,
      examTypeLabel,
    ]
      .filter(Boolean)
      .join(" ");

    if (nextTitle !== scheduleTitle) {
      setScheduleTitle(nextTitle);
    }
  }, [
    scheduleClassName,
    scheduleExamType,
    scheduleGroupName,
    scheduleSubjectName,
    scheduleTitle,
  ]);

  return {
    scheduleTitle,
    setScheduleTitle,
    scheduleDate,
    setScheduleDate,
    scheduleExamType,
    setScheduleExamType,
    scheduleClassName,
    setScheduleClassName,
    scheduleGroupName,
    setScheduleGroupName,
    scheduleSubjectName,
    setScheduleSubjectName,
    scheduleDescription,
    setScheduleDescription,
    selectedScheduleExamId,
    setSelectedScheduleExamId,
  };
};
