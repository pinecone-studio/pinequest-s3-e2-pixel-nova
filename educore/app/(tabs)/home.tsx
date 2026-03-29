import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import {
  AppScreen,
  Card,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import {
  formatDateTime,
  getEntryStatusLabel,
  getSessionStateLabel,
} from '@/lib/student-app/utils';
import { homeStyles as styles } from '@/styles/screens/home';

export default function HomeScreen() {
  const router = useRouter();
  const {
    activeSession,
    authMode,
    dashboardError,
    dashboardLoading,
    history,
    profile,
    progressSummary,
    refreshDashboard,
    student,
    submittedResult,
  } = useStudentApp();

  const latestHistory = history[0] ?? null;
  const xp = profile?.xp ?? student?.xp ?? 0;
  const level = profile?.level ?? student?.level ?? 1;

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title={`Welcome, ${student?.fullName ?? 'Student'}`}
          subtitle="Stay ready for your next exam, keep an eye on your XP, and resume active sessions quickly."
        />
        <View style={styles.pillRow}>
          <Pill label={authMode === 'user_switcher' ? 'Student account' : 'Student code'} />
          {activeSession ? (
            <Pill
              label={getSessionStateLabel(activeSession.status)}
              tone={activeSession.entryStatus === 'late' ? 'warning' : 'success'}
            />
          ) : null}
        </View>

        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>XP</Text>
            <Text style={uiStyles.statValue}>{xp}</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Level</Text>
            <Text style={uiStyles.statValue}>{level}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Exam flow</Text>
        <Text style={styles.bodyText}>
          {activeSession
            ? `${activeSession.exam.title} is ${getSessionStateLabel(activeSession.status).toLowerCase()}.`
            : 'No active exam yet. Join with a room code when your teacher opens the session.'}
        </Text>
        {activeSession ? (
          <>
            <Text style={styles.metaText}>
              {getEntryStatusLabel(activeSession.entryStatus)} · {activeSession.questions.length}{' '}
              questions · {activeSession.exam.durationMin} min
            </Text>
            {activeSession.syncMessage ? (
              <Text style={styles.warningText}>{activeSession.syncMessage}</Text>
            ) : null}
          </>
        ) : null}
        <PrimaryButton
          label={activeSession ? 'Continue exam' : 'Join exam'}
          onPress={() => {
            router.push(activeSession ? '/exam' : '/join');
          }}
        />
        <SecondaryButton
          label="Refresh dashboard"
          disabled={dashboardLoading}
          onPress={() => {
            void refreshDashboard();
          }}
        />
        {dashboardError ? <Text style={styles.warningText}>{dashboardError}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Latest result</Text>
        {submittedResult || latestHistory ? (
          <>
            <Text style={styles.resultValue}>
              {submittedResult?.score ?? latestHistory?.score ?? 0}%
            </Text>
            <Text style={styles.metaText}>
              Completed {formatDateTime(submittedResult?.submittedAt ?? latestHistory?.submittedAt)}
            </Text>
            <Text style={styles.bodyText}>
              {submittedResult
                ? `${submittedResult.earnedPoints}/${submittedResult.totalPoints} points earned in your latest submission.`
                : `${latestHistory?.title ?? 'Recent exam'} is your latest graded session.`}
            </Text>
          </>
        ) : (
          <Text style={styles.bodyText}>
            No graded exam yet. Once you submit an exam and results are released, the summary will appear here.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionLabel}>Progress snapshot</Text>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Sessions</Text>
            <Text style={uiStyles.statValue}>{progressSummary.totalSessions}</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Average</Text>
            <Text style={uiStyles.statValue}>
              {progressSummary.averageScore ?? '--'}
              {progressSummary.averageScore !== null ? '%' : ''}
            </Text>
          </View>
        </View>
      </Card>
    </AppScreen>
  );
}

