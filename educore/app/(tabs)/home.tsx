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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Өглөөний мэнд";
  if (h < 17) return "Өдрийн мэнд";
  return "Оройн мэнд";
}

function getGreetingIcon(h: number): keyof typeof Ionicons.glyphMap {
  if (h < 6) return "moon-outline";
  if (h < 12) return "sunny-outline";
  if (h < 17) return "partly-sunny-outline";
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
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );

  return Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function buildCards(args: ReturnType<typeof useStudentApp>): HomeExamCard[] {
  const { activeSession, upcomingExams } = args;
  const cards: HomeExamCard[] = [];

  if (activeSession) {
    const scheduledAt = activeSession.exam.scheduledAt ?? activeSession.startedAt;
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

    const id = exam.examId;
    if (cards.some((card) => card.id === id)) continue;

    const dayDiff = getDayDiff(scheduledAt);
    cards.push({
      id,
      title: exam.title,
      date: formatDateLabel(scheduledAt),
      time: formatTimeLabel(scheduledAt),
      duration: `${exam.durationMin} минут`,
      status: exam.status === "active" ? "active" : "waiting",
      statusText:
        exam.status === "active"
          ? "Эхэлсэн"
          : dayDiff === null
            ? "Товлогдсон"
            : dayDiff <= 0
              ? "Өнөөдөр"
              : `${dayDiff} хоног`,
      primaryAction: false,
    });
  }

  return cards;
}

export default function HomeScreen() {
  const router = useRouter();
  const studentApp = useStudentApp();
  const { dashboardError } = studentApp;
  const hour = new Date().getHours();
  const examCards = buildCards(studentApp);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Ionicons
          name={getGreetingIcon(hour)}
          size={18}
          color="#F5A623"
          style={styles.greetingIcon}
        />
        <Text style={styles.greeting}>{getGreeting()}</Text>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Шалгалт өгөх</Text>
        <TouchableOpacity style={styles.sectionLinkRow} onPress={() => router.push("/exam")}>
          <Text style={styles.sectionLink}>Бүгд</Text>
          <Ionicons name="chevron-forward" size={13} color="#5B67F8" />
        </TouchableOpacity>
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

              <View style={styles.metaTable}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Өдөр:</Text>
                  <Text style={styles.metaValue}>{exam.date}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Эхэлсэн цаг:</Text>
                  <Text style={styles.metaValue}>{exam.time}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Үргэлжилсэн хугацаа:</Text>
                  <Text style={styles.metaValue}>{exam.duration}</Text>
                </View>
              </View>

              {exam.primaryAction ? (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.push("/exam")}
                >
                  <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.detailLinkRow}
                  onPress={() => router.push("/exam")}
                >
                  <Text style={styles.detailLink}>Дэлгэрэнгүй</Text>
                  <Ionicons name="chevron-forward" size={13} color="#5B67F8" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
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

      {dashboardError ? (
        <Text style={styles.errorText}>{dashboardError}</Text>
      ) : null}
    </ScrollView>
  );
}
