import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStudentApp } from "@/lib/student-app/context";
import { homeStyles as styles } from "@/styles/screens/home";

type HomeExamCard = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: "active" | "waiting" | "late" | "missed";
  statusText: string;
  canJoin: boolean;
  canViewDetail: boolean;
  roomCode?: string | null;
  className?: string | null;
  groupName?: string | null;
  teacherName?: string | null;
};

type CalendarDay = {
  key: string;
  label: string;
  dayNumber: number;
  isSelected: boolean;
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

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getCalendarLabel(date: Date) {
  return `${date.getMonth() + 1} сар ${date.getFullYear()}`;
}

function buildCalendarWeek(now: Date): CalendarDay[] {
  const labels = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);

    return {
      key: day.toISOString(),
      label: labels[index],
      dayNumber: day.getDate(),
      isSelected: isSameDay(day, now),
    };
  });
}

function buildPrimaryCards(
  studentApp: ReturnType<typeof useStudentApp>,
  now: Date,
): HomeExamCard[] {
  const { activeSession, upcomingExams } = studentApp;
  const cards: HomeExamCard[] = [];

  if (activeSession) {
    const scheduledAt =
      activeSession.exam.scheduledAt ?? activeSession.startedAt;

    cards.push({
      id: activeSession.sessionId,
      title: activeSession.exam.title,
      date: formatDateLabel(scheduledAt),
      time: formatTimeLabel(scheduledAt),
      duration: `${activeSession.exam.durationMin} минут`,
      status: activeSession.entryStatus === "late" ? "late" : "active",
      statusText: activeSession.entryStatus === "late" ? "Хоцорсон" : "Өнөөдөр",
      canJoin: true,
      canViewDetail: false,
      roomCode: activeSession.roomCode,
      className: null,
      groupName: null,
      teacherName: null,
    });
  }

  for (const exam of upcomingExams) {
    const scheduledAt = exam.scheduledAt ?? exam.startedAt;
    if (!scheduledAt) continue;

    const scheduledDate = parseDateSafe(scheduledAt);
    const isToday = scheduledDate !== null && isSameDay(scheduledDate, now);
    if (!isToday) continue;
    if (cards.some((card) => card.id === exam.examId)) continue;

    const startTime = scheduledDate?.getTime() ?? null;
    const nowTime = now.getTime();
    const joinWindowStartsAt =
      startTime !== null ? startTime - 5 * 60 * 1000 : null;
    const onTimeDeadline =
      startTime !== null ? startTime + 5 * 60 * 1000 : null;
    const lateDeadline = startTime !== null ? startTime + 10 * 60 * 1000 : null;
    const hasStarted =
      exam.status === "active" || (startTime !== null && startTime <= nowTime);
    const isLateWindow =
      onTimeDeadline !== null &&
      lateDeadline !== null &&
      nowTime > onTimeDeadline &&
      nowTime <= lateDeadline;
    const isMissed = lateDeadline !== null && nowTime > lateDeadline;
    const canJoinNormally =
      joinWindowStartsAt !== null &&
      lateDeadline !== null &&
      nowTime >= joinWindowStartsAt &&
      nowTime <= lateDeadline;

    cards.push({
      id: exam.examId,
      title: exam.title,
      date: formatDateLabel(scheduledAt),
      time: formatTimeLabel(scheduledAt),
      duration: `${exam.durationMin} минут`,
      status: isMissed
        ? "missed"
        : isLateWindow
          ? "late"
          : hasStarted
            ? "active"
            : "waiting",
      statusText: isMissed ? "Өгөөгүй" : isLateWindow ? "Хоцорсон" : "Өнөөдөр",
      canJoin: canJoinNormally,
      canViewDetail: !canJoinNormally && !isMissed,
      roomCode: exam.roomCode,
      className: exam.className,
      groupName: exam.groupName,
      teacherName: null,
    });
  }

  return cards;
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
        teacherName: null,
      } satisfies HomeExamCard;
    });
}

function getTeacherName(title: string) {
  if (title.toLowerCase().includes("english")) return "Г. Сарантуяа";
  if (title.toLowerCase().includes("мат")) return "Б. Нарантуяа";
  if (title.toLowerCase().includes("монгол")) return "Д. Оюун";
  return "Г. Сарантуяа";
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
  const now = new Date();
  const calendarDays = buildCalendarWeek(now);
  const examCards = buildPrimaryCards(studentApp, now);
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
            <Ionicons name="arrow-back" size={18} color="#111827" />
            <Text style={styles.calendarTitle}>{getCalendarLabel(now)}</Text>
            <Ionicons name="arrow-forward" size={18} color="#111827" />
          </View>
          <View style={styles.calendarWeekRow}>
            {calendarDays.map((day) => (
              <View key={day.key} style={styles.calendarDay}>
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
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Шалгалт өгөх</Text>
        </View>

        {examCards.length > 0 ? (
          examCards.map((exam) => (
            <View key={exam.id} style={styles.card}>
              <View style={styles.cardBody}>
                <View style={styles.cardRow}>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      exam.status === "active"
                        ? styles.statusPillGreen
                        : exam.status === "late" || exam.status === "missed"
                          ? styles.statusPillRed
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
                            : styles.statusPillTextAmber,
                      ]}
                    >
                      {exam.statusText}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaTable}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Өдөр:</Text>
                    <Text style={styles.metaValue}>{exam.date}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Эхлэх цаг:</Text>
                    <Text style={styles.metaValue}>{exam.time}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Үргэлжлэх хугацаа:</Text>
                    <Text style={styles.metaValue}>{exam.duration}</Text>
                  </View>
                </View>

                {exam.canJoin ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
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
                ) : exam.canViewDetail ? (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => openExamDetail(router, exam)}
                  >
                    <Text style={styles.primaryBtnText}>Дэлгэрэнгүй</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <View style={styles.emptyStateCardBody}>
              <View style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>
                  Товлогдсон шалгалт байхгүй байна
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
