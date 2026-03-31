import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import { homeStyles as styles } from "@/styles/screens/home";

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EXAMS = [
  {
    id: "mock-1",
    title: "Математик Явцын Шалгалт",
    date: "2026/03/30",
    time: "11:00",
    duration: "40 минут",
    status: "active",
    statusText: "Эхэлсэн",
  },
  {
    id: "mock-2",
    title: "Монгол хэл Явцын Шалгалт",
    date: "2026/03/30",
    time: "11:00",
    duration: "40 минут",
    status: "waiting",
    statusText: "9 хоног",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const { dashboardError } = useStudentApp();
  const hour = new Date().getHours();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Greeting ── */}
      <View style={styles.header}>
        <Ionicons
          name={getGreetingIcon(hour)}
          size={18}
          color="#F5A623"
          style={styles.greetingIcon}
        />
        <Text style={styles.greeting}>{getGreeting()}</Text>
      </View>

      {/* ── Section header ── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Шалгалт өгөх</Text>
        <TouchableOpacity style={styles.sectionLinkRow}>
          <Text style={styles.sectionLink}>Бүгд</Text>
          <Ionicons name="chevron-forward" size={13} color="#5B67F8" />
        </TouchableOpacity>
      </View>

      {/* ── Exam cards ── */}
      {MOCK_EXAMS.map((exam) => (
        <View key={exam.id} style={styles.card}>
          <View style={styles.cardBody}>
            {/* Title + pill */}
            <View style={styles.cardRow}>
              <Text style={styles.examTitle}>{exam.title}</Text>
              <View
                style={[
                  styles.statusPill,
                  exam.status === "active"
                    ? styles.statusPillGreen
                    : styles.statusPillAmber,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    exam.status === "active"
                      ? styles.statusPillTextGreen
                      : styles.statusPillTextAmber,
                  ]}
                >
                  {exam.statusText}
                </Text>
              </View>
            </View>

            {/* Meta table */}
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

            {/* Action */}
            {exam.status === "active" ? (
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
      ))}

      {dashboardError ? (
        <Text style={styles.errorText}>{dashboardError}</Text>
      ) : null}
    </ScrollView>
  );
}
