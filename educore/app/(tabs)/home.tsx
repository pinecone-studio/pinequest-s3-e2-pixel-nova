import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStudentApp } from "@/lib/student-app/context";
import {
  BIOLOGY_MOCK_EXAM_ID,
  BIOLOGY_MOCK_ROOM_CODE,
  BIOLOGY_MOCK_TITLE,
} from "@/lib/student-app/mock-exam";
import { homeStyles as styles } from "@/styles/screens/home";

type HomeExamStatus =
  | "active"
  | "waiting"
  | "late"
  | "missed"
  | "completed";

type HomeExamCard = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: HomeExamStatus;
  statusText: string;
  canJoin: boolean;
  canViewDetail: boolean;
  roomCode?: string | null;
  className?: string | null;
  groupName?: string | null;
  teacherName?: string | null;
  sortTime: number;
};

const HOME_EXAM_STATUS_ORDER: Record<HomeExamStatus, number> = {
  active: 0,
  waiting: 1,
  late: 2,
  missed: 3,
  completed: 4,
};

type CalendarDay = {
  key: string;
  label: string;
  dayNumber: number;
  isSelected: boolean;
  date: Date;
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 18) return "Өдрийн мэнд";
  return "Оройн мэнд";
}

function getGreetingIcon(): keyof typeof Ionicons.glyphMap {
  const hour = new Date().getHours();

  if (hour < 12) return "sunny-outline";
  if (hour < 18) return "partly-sunny-outline";
  return "moon-outline";
}

function formatDateLabel(value?: string | null) {
  if (!value) return "--/--/--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--/--/--";
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function formatTimeLabel(value?: string | null) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${hour}:${minute}`;
}

function getDayDiff(value?: string | null) {
  if (!value) return null;
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function parseDateSafe(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isPastCalendarDay(value: Date, now: Date) {
  return startOfDay(value).getTime() < startOfDay(now).getTime();
}

function getCalendarLabel(date: Date) {
  return `${date.getMonth() + 1} сар ${date.getFullYear()}`;
}

function buildCalendarWeek(weekDate: Date, selectedDate: Date): CalendarDay[] {
  const labels = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  const weekStart = new Date(weekDate);
  weekStart.setDate(weekDate.getDate() - weekDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);

    return {
      key: day.toISOString(),
      label: labels[index],
      dayNumber: day.getDate(),
      isSelected: isSameDay(day, selectedDate),
      date: day,
    };
  });
}

function wasLateSubmission(
  scheduledAt?: string | null,
  startedAt?: string | null,
) {
  const scheduled = parseDateSafe(scheduledAt);
  const started = parseDateSafe(startedAt);

  if (!scheduled || !started) return false;

  return started.getTime() >= scheduled.getTime() + 5 * 60 * 1000;
}

function getHistoryDurationMinutes(
  startedAt?: string | null,
  submittedAt?: string | null,
) {
  if (!startedAt || !submittedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = new Date(submittedAt).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }

  return Math.max(1, Math.round((end - start) / (60 * 1000)));
}

function getStatusText(
  status: HomeExamStatus,
  selectedDate: Date,
  now: Date,
) {
  switch (status) {
    case "active":
      return "Эхэлсэн";
    case "waiting":
      return isSameDay(selectedDate, now) ? "Хүлээгдэж буй" : "Товлогдсон";
    case "late":
      return "Хоцорсон";
    case "missed":
      return "Ороогүй";
    case "completed":
      return "Өгсөн";
  }
}

function getUpcomingExamStatus(
  scheduledAt: string | null | undefined,
  rawStatus: string | null | undefined,
  selectedDate: Date,
  now: Date,
): Exclude<HomeExamStatus, "completed"> {
  const scheduledDate = parseDateSafe(scheduledAt);
  if (!scheduledDate) return "waiting";

  if (!isSameDay(selectedDate, now)) {
    return isPastCalendarDay(selectedDate, now) ? "missed" : "waiting";
  }

  const startTime = scheduledDate.getTime();
  const nowTime = now.getTime();
  const onTimeDeadline = startTime + 5 * 60 * 1000;
  const lateDeadline = startTime + 10 * 60 * 1000;

  if (nowTime > lateDeadline) return "missed";
  if (nowTime > onTimeDeadline) return "late";
  if (rawStatus === "active" || nowTime >= startTime) return "active";
  return "waiting";
}

function canJoinUpcomingExam(
  scheduledAt: string | null | undefined,
  selectedDate: Date,
  now: Date,
) {
  if (!isSameDay(selectedDate, now)) return false;
  const scheduledDate = parseDateSafe(scheduledAt);
  if (!scheduledDate) return false;

  const startTime = scheduledDate.getTime();
  const nowTime = now.getTime();

  return (
    nowTime >= startTime - 5 * 60 * 1000 &&
    nowTime <= startTime + 10 * 60 * 1000
  );
}

function getHistoryExamStatus(
  status: string,
  scheduledAt: string | null,
  startedAt: string | null,
  selectedDate: Date,
  now: Date,
): Extract<HomeExamStatus, "late" | "missed" | "completed"> | null {
  if (wasLateSubmission(scheduledAt, startedAt)) return "late";
  if (status === "graded" || status === "submitted") return "completed";
  if (status === "late") return "late";
  if (isPastCalendarDay(selectedDate, now)) return "missed";
  return null;
}

function getTeacherName(title: string) {
  if (title.toLowerCase().includes("english")) return "Г. Сарантуяа";
  if (title.toLowerCase().includes("мат")) return "Б. Нарантуяа";
  if (title.toLowerCase().includes("монгол")) return "Д. Оюун";
  return "Г. Сарантуяа";
}

function buildPrimaryCardsForDate(
  studentApp: ReturnType<typeof useStudentApp>,
  selectedDate: Date,
  now: Date,
): HomeExamCard[] {
  const { activeSession, history, upcomingExams } = studentApp;
  const cards: HomeExamCard[] = [];
  const coveredExamIds = new Set<string>();

  if (isSameDay(selectedDate, now)) {
    const mockStart = new Date(now.getTime() - 2 * 60 * 1000);
    cards.push({
      id: `mock:${BIOLOGY_MOCK_EXAM_ID}`,
      title: BIOLOGY_MOCK_TITLE,
      date: formatDateLabel(mockStart.toISOString()),
      time: formatTimeLabel(mockStart.toISOString()),
      duration: "20 минут",
      status: "active",
      statusText: "Эхэлсэн",
      canJoin: true,
      canViewDetail: false,
      roomCode: BIOLOGY_MOCK_ROOM_CODE,
      className: "12A",
      groupName: "Mock",
      teacherName: "Demo Teacher",
      sortTime: mockStart.getTime(),
    });
    coveredExamIds.add(BIOLOGY_MOCK_EXAM_ID);
  }

  if (activeSession) {
    const scheduledAt =
      activeSession.exam.scheduledAt ?? activeSession.startedAt;
    const scheduledDate = parseDateSafe(scheduledAt);

    if (
      scheduledDate &&
      isSameDay(scheduledDate, selectedDate) &&
      !coveredExamIds.has(activeSession.exam.id)
    ) {
      const status: HomeExamStatus =
        activeSession.entryStatus === "late" ? "late" : "active";

      cards.push({
        id: activeSession.sessionId,
        title: activeSession.exam.title,
        date: formatDateLabel(scheduledAt),
        time: formatTimeLabel(scheduledAt),
        duration: `${activeSession.exam.durationMin} минут`,
        status,
        statusText: getStatusText(status, selectedDate, now),
        canJoin: true,
        canViewDetail: false,
        roomCode: activeSession.roomCode,
        className: null,
        groupName: null,
        teacherName: getTeacherName(activeSession.exam.title),
        sortTime: scheduledDate.getTime(),
      });
      coveredExamIds.add(activeSession.exam.id);
    }
  }

  for (const item of history) {
    const scheduledAt = item.scheduledAt ?? item.startedAt ?? item.submittedAt;
    const scheduledDate = parseDateSafe(scheduledAt);
    if (!scheduledDate || !isSameDay(scheduledDate, selectedDate)) continue;

    const status = getHistoryExamStatus(
      item.status,
      item.scheduledAt,
      item.startedAt,
      selectedDate,
      now,
    );
    if (!status) continue;

    const timeSource = item.submittedAt ?? item.startedAt ?? item.scheduledAt;
    const sortTime =
      parseDateSafe(timeSource)?.getTime() ?? scheduledDate.getTime();

    cards.push({
      id: item.sessionId,
      title: item.title,
      date: formatDateLabel(item.scheduledAt ?? timeSource),
      time: formatTimeLabel(timeSource),
      duration: `${getHistoryDurationMinutes(item.startedAt, item.submittedAt)} минут`,
      status,
      statusText: getStatusText(status, selectedDate, now),
      canJoin: false,
      canViewDetail: true,
      roomCode: null,
      className: null,
      groupName: null,
      teacherName: getTeacherName(item.title),
      sortTime,
    });
    coveredExamIds.add(item.examId);
  }

  for (const exam of upcomingExams) {
    const scheduledAt = exam.scheduledAt ?? exam.startedAt;
    if (!scheduledAt || coveredExamIds.has(exam.examId)) continue;

    const scheduledDate = parseDateSafe(scheduledAt);
    if (!scheduledDate || !isSameDay(scheduledDate, selectedDate)) continue;

    const status = getUpcomingExamStatus(
      scheduledAt,
      exam.status,
      selectedDate,
      now,
    );
    const canJoin = canJoinUpcomingExam(scheduledAt, selectedDate, now);

    cards.push({
      id: exam.examId,
      title: exam.title,
      date: formatDateLabel(scheduledAt),
      time: formatTimeLabel(scheduledAt),
      duration: `${exam.durationMin} минут`,
      status,
      statusText: getStatusText(status, selectedDate, now),
      canJoin: canJoin && status !== "missed",
      canViewDetail: true,
      roomCode: exam.roomCode,
      className: exam.className,
      groupName: exam.groupName,
      teacherName: getTeacherName(exam.title),
      sortTime: scheduledDate.getTime(),
    });
  }

  return cards.sort((left, right) => {
    if (left.sortTime !== right.sortTime) {
      return left.sortTime - right.sortTime;
    }

    return (
      HOME_EXAM_STATUS_ORDER[left.status] -
      HOME_EXAM_STATUS_ORDER[right.status]
    );
  });
}

function buildScheduledCards(
  studentApp: ReturnType<typeof useStudentApp>,
): HomeExamCard[] {
  const { upcomingExams } = studentApp;

  return upcomingExams
    .filter((exam) => {
      if (exam.status !== "scheduled") return false;
      const scheduledAt = parseDateSafe(exam.scheduledAt ?? exam.startedAt);

      return (
        scheduledAt !== null &&
        scheduledAt.getTime() > Date.now() &&
        !isSameDay(scheduledAt, new Date())
      );
    })
    .map((exam) => {
      const scheduledAt = exam.scheduledAt ?? exam.startedAt;
      const dayDiff = getDayDiff(scheduledAt);

      return {
        id: exam.examId,
        title: exam.title,
        date: formatDateLabel(scheduledAt),
        time: formatTimeLabel(scheduledAt),
        duration: `${exam.durationMin} минут`,
        status: "waiting",
        statusText:
          dayDiff === null
            ? "Товлогдсон"
            : dayDiff <= 0
              ? "Өнөөдөр"
              : `${dayDiff} хоног`,
        canJoin: false,
        canViewDetail: true,
        roomCode: exam.roomCode,
        className: exam.className,
        groupName: exam.groupName,
        teacherName: getTeacherName(exam.title),
        sortTime: parseDateSafe(scheduledAt)?.getTime() ?? 0,
      } satisfies HomeExamCard;
    });
}

function openExamDetail(
  router: ReturnType<typeof useRouter>,
  exam: HomeExamCard,
) {
  router.push({
    pathname: "/exam-detail" as never,
    params: {
      title: exam.title,
      date: exam.date,
      time: exam.time,
      duration: exam.duration,
      statusText: exam.statusText,
      className: exam.className ?? "",
      groupName: exam.groupName ?? "",
      teacherName: exam.teacherName ?? getTeacherName(exam.title),
    } as never,
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const studentApp = useStudentApp();
  const { dashboardError } = studentApp;
  const [now, setNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const calendarDays = buildCalendarWeek(calendarDate, selectedDate);
  const examCards = buildPrimaryCardsForDate(studentApp, selectedDate, now);
  const secondaryExams = buildScheduledCards(studentApp);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <Ionicons name={getGreetingIcon()} size={16} color="#F59E0B" />
          <Text style={styles.greetingText}>{getGreeting()}</Text>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => {
                setCalendarDate((current) => addDays(current, -7));
                setSelectedDate((current) => addDays(current, -7));
              }}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={18} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {getCalendarLabel(calendarDate)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setCalendarDate((current) => addDays(current, 7));
                setSelectedDate((current) => addDays(current, 7));
              }}
              hitSlop={10}
            >
              <Ionicons name="arrow-forward" size={18} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.calendarWeekRow}>
            {calendarDays.map((day) => (
              <TouchableOpacity
                key={day.key}
                style={styles.calendarDay}
                onPress={() => {
                  setSelectedDate(day.date);
                  setCalendarDate(day.date);
                }}
              >
                <Text style={styles.calendarDayLabel}>{day.label}</Text>
                <View
                  style={[
                    styles.calendarDayCircle,
                    day.isSelected && styles.calendarDayCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.calendarDayNumber,
                      day.isSelected && styles.calendarDayNumberActive,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Шалгалт өгөх</Text>
        </View>

        {examCards.length > 0 ? (
          examCards.map((exam) => {
            const isPastSelectedDate = isPastCalendarDay(selectedDate, now);
            const showDetailButton =
              !isPastSelectedDate && (exam.canViewDetail || !exam.canJoin);

            return (
              <View key={exam.id} style={styles.upcomingCard}>
                <View style={styles.listCardRow}>
                  <Text style={styles.upcomingCardTitle}>{exam.title}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      exam.status === "active"
                        ? styles.statusPillGreen
                        : exam.status === "late" || exam.status === "missed"
                          ? styles.statusPillRed
                          : exam.status === "completed"
                            ? styles.statusPillBlue
                            : styles.statusPillAmber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        exam.status === "active"
                          ? styles.statusPillTextGreen
                          : exam.status === "late" || exam.status === "missed"
                            ? styles.statusPillTextRed
                            : exam.status === "completed"
                              ? styles.statusPillTextBlue
                              : styles.statusPillTextAmber,
                      ]}
                    >
                      {exam.statusText}
                    </Text>
                  </View>
                </View>

                <View style={styles.upcomingMetaGroup}>
                  <View style={styles.upcomingMetaRow}>
                    <Text style={styles.upcomingMetaLabel}>Өдөр:</Text>
                    <Text style={styles.upcomingMetaValue}>{exam.date}</Text>
                  </View>
                  <View style={styles.upcomingMetaRow}>
                    <Text style={styles.upcomingMetaLabel}>Эхэлсэн цаг:</Text>
                    <Text style={styles.upcomingMetaValue}>{exam.time}</Text>
                  </View>
                  <View style={styles.upcomingMetaRow}>
                    <Text style={styles.upcomingMetaLabel}>
                      Үргэлжилсэн хугацаа:
                    </Text>
                    <Text style={styles.upcomingMetaValue}>{exam.duration}</Text>
                  </View>
                </View>

                {exam.canJoin ? (
                  <TouchableOpacity
                    style={styles.upcomingPrimaryButton}
                    onPress={() =>
                      router.push({
                        pathname: "/join",
                        params: exam.roomCode
                          ? { roomCode: exam.roomCode }
                          : {},
                      })
                    }
                  >
                    <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
                  </TouchableOpacity>
                ) : showDetailButton ? (
                  <View style={styles.upcomingButtonRow}>
                    <View style={styles.upcomingDivider} />
                    <TouchableOpacity
                      style={styles.upcomingDetailButton}
                      onPress={() => openExamDetail(router, exam)}
                    >
                      <Text style={styles.upcomingDetailText}>Дэлгэрэнгүй</Text>
                      <Ionicons
                        name="chevron-forward"
                        size={24}
                        color="#111827"
                        style={styles.upcomingDetailArrow}
                      />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyStateCardBody}>
              <View style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>
                  Сонгосон өдөр шалгалт байхгүй байна
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Дараагийн шалгалтууд</Text>
          <TouchableOpacity
            style={styles.sectionLinkRow}
            onPress={() =>
              router.push({
                pathname: "/exam",
                params: { tab: "active" },
              })
            }
          >
            <Text style={styles.sectionLinkMuted}>Бүгд</Text>
            <Ionicons name="chevron-forward" size={13} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {secondaryExams.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.nextList}
          >
            {secondaryExams.map((exam) => (
              <View key={exam.id} style={styles.nextCard}>
                <View style={styles.cardRow}>
                  <Text style={styles.nextCardTitle}>{exam.title}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      exam.status === "active"
                        ? styles.statusPillGreen
                        : exam.status === "late"
                          ? styles.statusPillRed
                          : styles.statusPillAmber,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        exam.status === "active"
                          ? styles.statusPillTextGreen
                          : exam.status === "late"
                            ? styles.statusPillTextRed
                            : styles.statusPillTextAmber,
                      ]}
                    >
                      {exam.statusText}
                    </Text>
                  </View>
                </View>

                <View style={styles.nextMetaTable}>
                  <View style={styles.nextMetaRow}>
                    <Text style={styles.nextMetaLabel}>Өдөр:</Text>
                    <Text style={styles.nextMetaValue}>{exam.date}</Text>
                  </View>
                  <View style={styles.nextMetaRow}>
                    <Text style={styles.nextMetaLabel}>Эхлэх цаг:</Text>
                    <Text style={styles.nextMetaValue}>{exam.time}</Text>
                  </View>
                </View>

                <View style={styles.nextDivider} />

                <TouchableOpacity
                  style={styles.detailLinkRow}
                  onPress={() => openExamDetail(router, exam)}
                >
                  <Text style={styles.detailLink}>Дэлгэрэнгүй</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color="#111827"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {dashboardError ? (
          <Text style={styles.errorText}>{dashboardError}</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
