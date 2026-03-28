import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  Card,
  Pill,
  PrimaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import { formatDateTime, getResultMessage } from '@/lib/student-app/utils';

export default function ResultScreen() {
  const router = useRouter();
  const { clearResult, profile, submittedResult, student } = useStudentApp();

  if (!student) {
    return <Redirect href="/" />;
  }

  if (!submittedResult) {
    return <Redirect href="/home" />;
  }

  const resolveAnswerText = (answer: (typeof submittedResult.answers)[number]) => {
    if (answer.selectedOptionId) {
      return (
        answer.options.find((option) => option.id === answer.selectedOptionId)?.text ??
        answer.selectedOptionId
      );
    }

    return answer.textAnswer ?? 'No answer';
  };

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title="Exam submitted"
          subtitle={getResultMessage(submittedResult.score)}
        />
        <View style={styles.pillRow}>
          <Pill label={`Submitted ${formatDateTime(submittedResult.submittedAt)}`} />
          {submittedResult.xpEarned ? (
            <Pill label={`+${submittedResult.xpEarned} XP`} tone="success" />
          ) : null}
        </View>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Score</Text>
            <Text style={uiStyles.statValue}>{submittedResult.score}%</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Points</Text>
            <Text style={uiStyles.statValue}>
              {submittedResult.earnedPoints}/{submittedResult.totalPoints}
            </Text>
          </View>
        </View>
        <Text style={styles.metaText}>
          Current XP: {profile?.xp ?? student?.xp ?? 0} · Level {profile?.level ?? student?.level ?? 1}
        </Text>
      </Card>

      <Card>
        <Text style={styles.answerTitle}>Answer review</Text>
        {submittedResult.answers.map((answer, index) => (
          <View key={`${answer.questionId}-${index}`} style={styles.answerRow}>
            <Text style={styles.answerQuestion}>
              {index + 1}. {answer.questionText}
            </Text>
            <Text style={styles.answerMeta}>Your answer: {resolveAnswerText(answer)}</Text>
            <Text style={styles.answerMeta}>
              Correct answer: {answer.correctAnswerText ?? 'Not provided'}
            </Text>
            <Text
              style={[
                styles.answerState,
                answer.isCorrect ? styles.answerCorrect : styles.answerWrong,
              ]}>
              {answer.isCorrect ? 'Correct' : 'Incorrect'}
            </Text>
          </View>
        ))}
        <PrimaryButton
          label="Back to home"
          onPress={() => {
            clearResult();
            router.replace('/home');
          }}
        />
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#5F665E',
  },
  answerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#203229',
  },
  answerRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFE5D4',
    paddingTop: 14,
    gap: 6,
  },
  answerQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#293B31',
  },
  answerMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F665E',
  },
  answerState: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '800',
  },
  answerCorrect: {
    backgroundColor: '#E7F2EA',
    color: '#24583F',
  },
  answerWrong: {
    backgroundColor: '#F7E8E8',
    color: '#A53838',
  },
});
