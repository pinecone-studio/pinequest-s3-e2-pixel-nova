import type { Exam } from "../types";

export const examAccentPalette = [
  {
    badge: "bg-[#4b5cff]",
    soft: "bg-[#eef1ff]",
    text: "text-[#4b5cff]",
  },
  {
    badge: "bg-[#c952ef]",
    soft: "bg-[#faedff]",
    text: "text-[#c952ef]",
  },
  {
    badge: "bg-[#4ab88f]",
    soft: "bg-[#eafaf4]",
    text: "text-[#2f8c6a]",
  },
] as const;

export const weekLabels = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

export const toDayKey = (value: string | number | Date) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const formatExamDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { dateLabel: "Тодорхойгүй", timeLabel: "Дараа" };
  }

  return {
    dateLabel: date.toLocaleDateString("mn-MN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    timeLabel: date.toLocaleTimeString("mn-MN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};

export const buildLinePath = (values: number[]) => {
  const width = 100;
  const height = 34;
  const stepX = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - (value / 100) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
};

export const buildAreaPath = (values: number[]) => {
  const line = buildLinePath(values);
  return `${line} L 100 34 L 0 34 Z`;
};

export const getFirstName = (value: string) =>
  value.trim().split(/\s+/)[0] || value;

export const normalizeExamOverview = (params: {
  selectedExam: Exam | null;
  studentHistory: Array<{
    examId: string;
    title: string;
    percentage: number;
    totalPoints?: number;
    date: string;
  }>;
}) => {
  const { selectedExam, studentHistory } = params;
  const displayItems: Array<{
    title: string;
    subtitle: string;
    questions: number;
    date: string;
  }> = [];

  if (selectedExam) {
    displayItems.push({
      title: selectedExam.title,
      subtitle: "Эхлэхэд бэлэн",
      questions: selectedExam.questions.length || 0,
      date: selectedExam.createdAt,
    });
  }

  studentHistory.slice(0, 3).forEach((item) => {
    displayItems.push({
      title: item.title,
      subtitle: item.percentage >= 80 ? "Сайн үр дүн" : "Дахин давтах",
      questions: item.totalPoints ?? 25,
      date: item.date,
    });
  });

  return displayItems.slice(0, 3);
};
