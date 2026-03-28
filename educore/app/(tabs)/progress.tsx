import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  Card,
  Pill,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import { formatDateTime } from '@/lib/student-app/utils';

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
            <Text style={uiStyles.statValue}>{profile?.level ?? student?.level ?? 1}</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>XP</Text>
            <Text style={uiStyles.statValue}>{profile?.xp ?? student?.xp ?? 0}</Text>
          </View>
        </View>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Average</Text>
            <Text style={uiStyles.statValue}>
              {progressSummary.averageScore ?? '--'}
              {progressSummary.averageScore !== null ? '%' : ''}
            </Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Best</Text>
            <Text style={uiStyles.statValue}>
              {progressSummary.bestScore ?? '--'}
              {progressSummary.bestScore !== null ? '%' : ''}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.historyTitle}>Recent exams</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>
            No exam history yet. Completed sessions will appear here once they are recorded.
          </Text>
        ) : (
          history.slice(0, 6).map((item) => (
            <View key={item.sessionId} style={styles.historyRow}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyName}>{item.title}</Text>
                <Pill label={item.status} />
              </View>
              <Text style={styles.historyMeta}>
                Score: {item.score ?? '--'}
                {item.score !== null ? '%' : ''} · {formatDateTime(item.submittedAt ?? item.startedAt)}
              </Text>
            </View>
          ))
        )}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#203229',
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
    paddingTop: 14,
    gap: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  historyName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#24392F',
  },
  historyMeta: {
    fontSize: 13,
    color: '#6E6A62',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#5F665E',
  },
});
