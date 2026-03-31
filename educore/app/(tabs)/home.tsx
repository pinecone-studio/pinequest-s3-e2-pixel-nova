import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import { homeStyles as styles } from "@/styles/screens/home";

type HomeExamCard = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  status: "active" | "waiting" | "late";
  statusText: string;
  primaryAction: boolean;
};

type CalendarDay = {
  key: string;
  label: string;
  dayNumber: number;
  isSelected: boolean;
};

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Өглөөний мэнд";
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
      isSelected:
        day.getFullYear() === now.getFullYear() &&
        day.getMonth() === now.getMonth() &&
        day.getDate() === now.getDate(),
    };
  });
}

function buildPrimaryCards(
  args: ReturnType<typeof useStudentApp>,
  now: Date,
): HomeExamCard[] {
  const { activeSession, upcomingExams } = args;
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
      statusText: activeSession.entryStatus === "late" ? "Хоцорсон" : "Эхэлсэн",
      primaryAction: true,
    });
  }

  for (const exam of upcomingExams) {
    const scheduledAt = exam.scheduledAt ?? exam.startedAt;
    if (!scheduledAt) continue;
    const scheduledDate = parseDateSafe(scheduledAt);
    const isToday = scheduledDate !== null && isSameDay(scheduledDate, now);
    const hasStarted =
      exam.status === "active" ||
      (scheduledDate !== null && scheduledDate.getTime() <= now.getTime());

    if (!hasStarted || !isToday) continue;

    const id = exam.examId;
    if (cards.some((card) => card.id === id)) continue;
    cards.push({
      id,
      title: exam.title,
      date: formatDateLabel(scheduledAt),
      time: formatTimeLabel(scheduledAt),
      duration: `${exam.durationMin} минут`,
      status: "active",
      statusText: "Өнөөдөр",
      primaryAction: true,
    });
  }

  return cards;
}

function buildScheduledCards(
  args: ReturnType<typeof useStudentApp>,
): HomeExamCard[] {
  const { upcomingExams } = args;

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
        status: "waiting" as const,
        statusText:
          dayDiff === null
            ? "Товлогдсон"
            : dayDiff <= 0
              ? "Өнөөдөр"
              : `${dayDiff} хоног`,
        primaryAction: false,
      };
    });
}

export default function HomeScreen() {
  const router = useRouter();
  const studentApp = useStudentApp();
  const { dashboardError } = studentApp;
  const now = new Date();
  const calendarDays = buildCalendarWeek(now);
  const examCards = buildPrimaryCards(studentApp, now);
  const primaryExam = examCards[0] ?? null;
  const secondaryExams = buildScheduledCards(studentApp);

  return (
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

      {primaryExam ? (
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Text style={styles.examTitle}>{primaryExam.title}</Text>
              <View
                style={[
                  styles.statusPill,
                  primaryExam.status === "active"
                    ? styles.statusPillGreen
                    : primaryExam.status === "late"
                      ? styles.statusPillRed
                      : styles.statusPillAmber,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    primaryExam.status === "active"
                      ? styles.statusPillTextGreen
                      : primaryExam.status === "late"
                        ? styles.statusPillTextRed
                        : styles.statusPillTextAmber,
                  ]}
                >
                  {primaryExam.statusText}
                </Text>
              </View>
            </View>

            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Өдөр:</Text>
                <Text style={styles.metaValue}>{primaryExam.date}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Эхлэх цаг:</Text>
                <Text style={styles.metaValue}>{primaryExam.time}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Үргэлжлэх хугацаа:</Text>
                <Text style={styles.metaValue}>{primaryExam.duration}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/exam")}
            >
              <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.examTitle}>Товлогдсон шалгалт алга</Text>
            <Text style={styles.examMeta}>
              Багш шалгалт товлоход энд backend data-аараа шууд харагдана.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/exam")}
            >
              <Text style={styles.primaryBtnText}>Шалгалтууд харах</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Дараагийн шалгалтууд</Text>
        <TouchableOpacity
          style={styles.sectionLinkRow}
          onPress={() => router.push("/exam")}
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

              <TouchableOpacity
                style={styles.nextPrimaryBtn}
                onPress={() => router.push("/exam")}
              >
                <Text style={styles.nextPrimaryBtnText}>Дэлгэрэнгүй</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {dashboardError ? (
        <Text style={styles.errorText}>{dashboardError}</Text>
      ) : null}
    </ScrollView>
  );
}
