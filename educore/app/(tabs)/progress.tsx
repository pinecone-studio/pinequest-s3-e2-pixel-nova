import { Text, View } from "react-native";

import {
  AppScreen,
  Card,
  Pill,
  SectionTitle,
  uiStyles,
} from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import { formatDateTime } from "@/lib/student-app/utils";
import { progressStyles as styles } from "@/styles/screens/progress";

export default function ProgressScreen() {
  const { history, progressSummary, profile, student } = useStudentApp();

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title="Progress"
          subtitle="A backend-backed summary of sessions, scores, and XP for the current student."
        />
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Level</Text>
            <Text style={uiStyles.statValue}>
              {profile?.level ?? student?.level ?? 1}
            </Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>XP</Text>
            <Text style={uiStyles.statValue}>
              {profile?.xp ?? student?.xp ?? 0}
            </Text>
          </View>
        </View>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Average</Text>
            <Text style={uiStyles.statValue}>
              {progressSummary.averageScore ?? "--"}
              {progressSummary.averageScore !== null ? "%" : ""}
            </Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Best</Text>
            <Text style={uiStyles.statValue}>
              {progressSummary.bestScore ?? "--"}
              {progressSummary.bestScore !== null ? "%" : ""}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
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
      </Card>
    </AppScreen>
  );
}
