import { StyleSheet, Text } from 'react-native';

import { AppScreen, Card, SectionTitle, uiStyles } from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';

export default function ProgressScreen() {
  const { profile, student, submittedResult } = useStudentApp();

  return (
    <AppScreen>
      <Card>
        <SectionTitle
          title="Progress"
          subtitle="A lightweight overview for the currently selected student."
        />
        <Text style={uiStyles.statLabel}>Student</Text>
        <Text style={styles.valueText}>{student?.fullName ?? 'Unknown user'}</Text>
        <Text style={uiStyles.statLabel}>Level</Text>
        <Text style={styles.valueText}>{profile?.level ?? student?.level ?? 1}</Text>
        <Text style={uiStyles.statLabel}>XP</Text>
        <Text style={styles.valueText}>{profile?.xp ?? student?.xp ?? 0}</Text>
        <Text style={uiStyles.statLabel}>Latest score</Text>
        <Text style={styles.valueText}>
          {submittedResult ? `${submittedResult.score}%` : 'No submitted exam yet'}
        </Text>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  valueText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#203229',
    marginBottom: 8,
  },
});
