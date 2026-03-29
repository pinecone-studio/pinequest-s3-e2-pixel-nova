import { Text, View } from 'react-native';

import { AppScreen, Card, Pill, SectionTitle } from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import { leaderboardStyles as styles } from '@/styles/screens/leaderboard';

export default function LeaderboardScreen() {
  const { availableUsers, authMode, student } = useStudentApp();
  const rankedUsers = [...availableUsers].sort((left, right) => {
    const xpDiff = (right.xp ?? 0) - (left.xp ?? 0);
    if (xpDiff !== 0) return xpDiff;
    return left.fullName.localeCompare(right.fullName);
  });

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title="Leaderboard"
          subtitle="Ranking based on the currently available student roster from the backend."
        />
        <Pill label={authMode === 'user_switcher' ? 'Roster view' : 'Student view'} />
        {rankedUsers.map((entry, index) => {
          const active = entry.id === student?.id;
          return (
            <View key={entry.id} style={[styles.row, active && styles.activeRow]}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.body}>
                <Text style={styles.name}>{entry.fullName}</Text>
                <Text style={styles.meta}>
                  {entry.xp ?? 0} XP · Level {entry.level ?? 1}
                </Text>
              </View>
              {active ? <Pill label="You" tone="success" /> : null}
            </View>
          );
        })}
      </Card>
    </AppScreen>
  );
}

