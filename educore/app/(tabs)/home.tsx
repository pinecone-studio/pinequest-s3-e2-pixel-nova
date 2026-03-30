import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useStudentApp } from "@/lib/student-app/context";
import { formatDateTime, getSessionStateLabel } from "@/lib/student-app/utils";
import { homeStyles as styles } from "@/styles/screens/home";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Өглөөний мэнд";
  if (h < 17) return "Өдрийн мэнд";
  return "Оройн мэнд";
}

function AchievementBadge({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeIcon, { backgroundColor: color }]}>
        <Text style={styles.badgeEmoji}>{icon}</Text>
      </View>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    activeSession,
    dashboardError,
    history,
    profile,
    progressSummary,
    student,
    submittedResult,
  } = useStudentApp();

  const latestHistory = history[0] ?? null;
  const xp = profile?.xp ?? student?.xp ?? 0;
  const level = profile?.level ?? student?.level ?? 1;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.brandIcon}
          />
          <View style={styles.brandTextWrap}>
            <Text style={styles.brandName}>PineQuest</Text>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>
              Тавтай морил, {student?.fullName?.split(" ")[0] ?? "Оюутан"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bell}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Шалгалт өгөх</Text>
      <View style={styles.card}>
        {activeSession ? (
          <>
            <View style={styles.cardTopBar} />
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <Text style={styles.examTitle}>{activeSession.exam.title}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {getSessionStateLabel(activeSession.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.examMeta}>
                📅 {formatDateTime(activeSession.exam?.startedAt ?? "")} ·{" "}
                {activeSession.exam.durationMin} мин
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => router.push("/exam")}
              >
                <Text style={styles.primaryBtnText}>Шалгалтанд орох</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.cardBody}>
            <Text style={styles.examTitle}>Идэвхтэй шалгалт байхгүй</Text>
            <Text style={styles.examMeta}>
              Багш шалгалт нээхэд room code-оор нэгдэнэ үү.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push("/join")}
            >
              <Text style={styles.primaryBtnText}>Шалгалтанд нэгдэх</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View all &gt;</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.badgeRow}>
        <AchievementBadge icon="🏆" label="Top Scorer" color="#F5A623" />
        <AchievementBadge icon="⚡" label="Speed Run" color="#6C5CE7" />
        <AchievementBadge icon="🏆" label="Top Scorer" color="#F5A623" />
        <AchievementBadge icon="⚡" label="Speed Run" color="#6C5CE7" />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{xp}</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{level}</Text>
          <Text style={styles.statLabel}>Түвшин</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{progressSummary.totalSessions}</Text>
          <Text style={styles.statLabel}>Шалгалт</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {progressSummary.averageScore !== null
              ? `${progressSummary.averageScore}%`
              : "--"}
          </Text>
          <Text style={styles.statLabel}>Дундаж</Text>
        </View>
      </View>

      {(submittedResult || latestHistory) && (
        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.sectionTitle}>Сүүлийн үр дүн</Text>
            <Text style={styles.bigScore}>
              {submittedResult?.score ?? latestHistory?.score ?? 0}%
            </Text>
            <Text style={styles.examMeta}>
              {formatDateTime(
                submittedResult?.submittedAt ?? latestHistory?.submittedAt,
              )}
            </Text>
          </View>
        </View>
      )}

      {dashboardError ? (
        <Text style={styles.errorText}>{dashboardError}</Text>
      ) : null}
    </ScrollView>
  );
}
