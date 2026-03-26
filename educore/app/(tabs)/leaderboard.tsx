import { StyleSheet, Text, View } from 'react-native';

import { AppScreen, Card, SectionTitle } from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';

export default function LeaderboardScreen() {
  const { availableUsers, student } = useStudentApp();
  const rankedUsers = [...availableUsers].sort((left, right) => {
    return (right.xp ?? 0) - (left.xp ?? 0);
  });

  return (
    <AppScreen>
      <Card>
        <SectionTitle
          title="Leaderboard"
          subtitle="Local ranking based on the selectable student list."
        />
        {rankedUsers.map((entry, index) => {
          const active = entry.id === student?.id;
          return (
            <View
              key={entry.id}
              style={[styles.row, active && styles.activeRow]}>
              <Text style={styles.rank}>{index + 1}</Text>
              <View style={styles.body}>
                <Text style={styles.name}>{entry.fullName}</Text>
                <Text style={styles.meta}>
                  {entry.xp ?? 0} XP • Level {entry.level ?? 1}
                </Text>
              </View>
            </View>
          );
        })}
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
  },
  activeRow: {
    backgroundColor: '#F7FBF5',
    borderRadius: 18,
    paddingHorizontal: 12,
  },
  rank: {
    width: 28,
    fontSize: 18,
    fontWeight: '800',
    color: '#24583F',
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#24392F',
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: '#6E6A62',
  },
});
