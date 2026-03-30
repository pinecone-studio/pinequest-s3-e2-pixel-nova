import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Pill } from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import { formatDateTime } from "@/lib/student-app/utils";
import { progressStyles as styles } from "@/styles/screens/progress";

function ScoreTrendChart({ data }: { data: number[] }) {
  const months = ["Sep", "Oct", "Nov", "Dec", "Feb", "Mar", "Apr"];
  const min = 50;
  const max = 100;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.yAxis}>
        {[100, 80, 65, 50].map((v) => (
          <Text key={v} style={chartStyles.axisLabel}>
            {v}
          </Text>
        ))}
      </View>
      <View style={{ flex: 1 }}>
        <View style={chartStyles.chartArea}>
          {data.map((val, i) => {
            const left = (i / (data.length - 1)) * 100;
            const bottom = ((val - min) / (max - min)) * 100;
            return (
              <View
                key={i}
                style={[
                  chartStyles.dot,
                  { left: `${left}%` as any, bottom: `${bottom}%` as any },
                ]}
              />
            );
          })}
          {[0, 30, 50, 100].map((p) => (
            <View
              key={p}
              style={[chartStyles.gridLine, { bottom: `${p}%` as any }]}
            />
          ))}
        </View>
        <View style={chartStyles.xAxis}>
          {months.map((m) => (
            <Text key={m} style={chartStyles.axisLabel}>
              {m}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

function SubjectBar({
  label,
  abbr,
  score,
  color,
  bgColor,
}: {
  label: string;
  abbr: string;
  score: number;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={subjectStyles.row}>
      <View style={[subjectStyles.avatar, { backgroundColor: bgColor }]}>
        <Text style={subjectStyles.avatarText}>{abbr}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={subjectStyles.labelRow}>
          <Text style={subjectStyles.label}>{label}</Text>
          <Text style={[subjectStyles.score, { color }]}>{score}%</Text>
        </View>
        <View style={subjectStyles.barBg}>
          <View
            style={[
              subjectStyles.barFill,
              { width: `${score}%` as any, backgroundColor: color },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function ProgressScreen() {
  const { history, progressSummary, profile, student } = useStudentApp();
  const [period, setPeriod] = useState<"week" | "month">("week");

  const avg = progressSummary.averageScore ?? 83;

  const subjects = [
    {
      label: "Math",
      abbr: "Ma",
      score: 88,
      color: "#5B67F8",
      bgColor: "#EEF0FF",
    },
    {
      label: "Physics",
      abbr: "Ph",
      score: 74,
      color: "#5B67F8",
      bgColor: "#E8E6FF",
    },
    {
      label: "English",
      abbr: "En",
      score: 92,
      color: "#22C55E",
      bgColor: "#DCFCE7",
    },
    {
      label: "History",
      abbr: "Hi",
      score: 65,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
    },
    {
      label: "Science",
      abbr: "Sc",
      score: 79,
      color: "#EC4899",
      bgColor: "#FCE7F3",
    },
  ];

  const trendData =
    history.length >= 3
      ? history
          .slice(0, 7)
          .map((h) => h.score ?? avg)
          .reverse()
      : [75, 80, 72, 85, 78, 88, 80];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>Your Progress</Text>
      <Text style={styles.pageSubtitle}>Track your learning journey</Text>

      {/* Period selector */}
      <View style={styles.periodRow}>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            period === "week" && styles.periodBtnActive,
          ]}
          onPress={() => setPeriod("week")}
        >
          <Text
            style={[
              styles.periodBtnText,
              period === "week" && styles.periodBtnTextActive,
            ]}
          >
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodBtn,
            period === "month" && styles.periodBtnActive,
          ]}
          onPress={() => setPeriod("month")}
        >
          <Text
            style={[
              styles.periodBtnText,
              period === "month" && styles.periodBtnTextActive,
            ]}
          >
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Score Trend */}
      <View style={styles.card}>
        <View style={styles.trendHeader}>
          <View>
            <Text style={styles.cardTitle}>Score Trend</Text>
            <Text style={styles.cardSubtitle}>Avg: {avg}%</Text>
          </View>
          <View style={styles.trendBadge}>
            <Text style={styles.trendBadgeText}>↗ +12%</Text>
          </View>
        </View>
        <ScoreTrendChart data={trendData} />
      </View>

      {/* Subject Scores */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Subject Scores</Text>
        <View style={{ gap: 16, marginTop: 8 }}>
          {subjects.map((s) => (
            <SubjectBar key={s.label} {...s} />
          ))}
        </View>
      </View>

      {/* Recent exams — богино кодын historyRow, Pill, formatDateTime ашигласан */}
      <View style={styles.card}>
        <Text style={styles.historyTitle}>Recent exams</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>
            No exam history yet. Completed sessions will appear here once they
            are recorded.
          </Text>
        ) : (
          history.slice(0, 6).map((item) => (
            <View key={item.sessionId} style={styles.historyRow}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyName}>{item.title}</Text>
                <Pill label={item.status} />
              </View>
              <Text style={styles.historyMeta}>
                Score: {item.score ?? "--"}
                {item.score !== null ? "%" : ""} ·{" "}
                {formatDateTime(item.submittedAt ?? item.startedAt)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  container: { flexDirection: "row", height: 120, gap: 4 },
  yAxis: { justifyContent: "space-between", paddingVertical: 2, width: 30 },
  axisLabel: { fontSize: 10, color: "#BBBFC9", textAlign: "right" },
  chartArea: {
    flex: 1,
    position: "relative",
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E8EAF0",
  },
  dot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5B67F8",
    marginLeft: -4,
    marginBottom: -4,
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#F0F1F5",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
});

const subjectStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, fontWeight: "800", color: "#5B67F8" },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: { fontSize: 14, fontWeight: "600", color: "#111" },
  score: { fontSize: 14, fontWeight: "700" },
  barBg: {
    height: 8,
    backgroundColor: "#F2F4F7",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 4 },
});
