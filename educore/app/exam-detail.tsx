import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { examStyles as styles } from "@/styles/screens/exam";

function getMockTeacherName(title: string) {
  if (title.toLowerCase().includes("english")) return "Г. Сарантуяа";
  if (title.toLowerCase().includes("мат")) return "Б. Нарантуяа";
  if (title.toLowerCase().includes("монгол")) return "Д. Оюун";
  return "Г. Сарантуяа";
}

function readParam(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default function ExamDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    date?: string;
    time?: string;
    duration?: string;
    statusText?: string;
    className?: string;
    groupName?: string;
    teacherName?: string;
  }>();

  const title = readParam(params.title, "Шалгалтын мэдээлэл");
  const date = readParam(params.date, "--/--/--");
  const time = readParam(params.time, "--:--");
  const duration = readParam(params.duration, "--");
  const statusText = readParam(params.statusText, "Товлогдсон");
  const className = readParam(params.className);
  const groupName = readParam(params.groupName);
  const teacherName = readParam(params.teacherName, getMockTeacherName(title));
  const classLabel = [className, groupName].filter(Boolean).join(" · ");

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.detailTopBar}>
        <Pressable
          style={styles.detailBackButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.detailHeaderTitle}>Дэлгэрэнгүй</Text>
        <View style={styles.detailHeaderSpacer} />
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.detailContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHeroCard}>
          <View style={styles.listCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailExamTitle}>{title}</Text>
              <Text style={styles.detailExamSub}>Шалгалтын мэдээлэл</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{statusText}</Text>
            </View>
          </View>

          <View style={styles.detailInfoRow}>
            <View style={styles.detailInfoChip}>
              <View style={styles.detailInfoIcon}>
                <Ionicons name="person-outline" size={18} color="#7C8798" />
              </View>
              <View>
                <Text style={styles.detailInfoLabel}>Багш</Text>
                <Text style={styles.detailInfoValue}>{teacherName}</Text>
              </View>
            </View>

            <View style={styles.detailInfoChip}>
              <View style={styles.detailInfoIcon}>
                <Ionicons name="school-outline" size={18} color="#7C8798" />
              </View>
              <View>
                <Text style={styles.detailInfoLabel}>Анги</Text>
                <Text style={styles.detailInfoValue}>
                  {classLabel || "10а анги"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.detailSectionCard}>
          <View style={styles.detailSectionHeader}>
            <Ionicons name="time-outline" size={20} color="#111827" />
            <Text style={styles.detailSectionTitle}>Хугацаа</Text>
          </View>

          <View style={styles.durationHighlight}>
            <Ionicons name="timer-outline" size={18} color="#3568F5" />
            <Text style={styles.durationLabel}>Үргэлжлэх хугацаа</Text>
            <Text style={styles.durationValue}>{duration}</Text>
          </View>

          <View style={styles.scheduleRow}>
            <View style={[styles.scheduleCard, styles.scheduleCardGreen]}>
              <Ionicons name="play-outline" size={18} color="#22C55E" />
              <Text style={styles.scheduleLabel}>Эхлэх цаг</Text>
              <Text style={styles.scheduleValue}>{time}</Text>
            </View>

            <View style={styles.scheduleCard}>
              <Ionicons name="calendar-outline" size={18} color="#111827" />
              <Text style={styles.scheduleLabel}>Огноо</Text>
              <Text style={styles.scheduleValue}>{date}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
