import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  Card,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';

export default function HomeScreen() {
  const router = useRouter();
  const { activeSession, profile, student } = useStudentApp();

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title={`Welcome, ${student?.fullName ?? 'Student'}`}
          subtitle="Join an exam from home and switch the active user from the profile tab."
        />

        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>XP</Text>
            <Text style={uiStyles.statValue}>{profile?.xp ?? student?.xp ?? 0}</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Level</Text>
            <Text style={uiStyles.statValue}>{profile?.level ?? student?.level ?? 1}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Quick actions</Text>
        <PrimaryButton
          label={activeSession ? 'Continue exam' : 'Join exam'}
          onPress={() => {
            router.push(activeSession ? '/exam' : '/join');
          }}
        />
        <SecondaryButton
          label="Profile"
          onPress={() => {
            router.push('/profile');
          }}
        />
        <SecondaryButton
          label="Switch user"
          onPress={() => {
            router.push('/profile');
          }}
        />
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Current status</Text>
        <Text style={styles.bodyText}>
          {activeSession
            ? `Active exam: ${activeSession.exam.title}`
            : 'No active exam yet. Enter a room code to start one.'}
        </Text>
        <Text style={styles.metaText}>
          The active student can be changed from the profile screen at any time.
        </Text>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#24392F',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4F584F',
  },
  metaText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6E6A62',
  },
});
