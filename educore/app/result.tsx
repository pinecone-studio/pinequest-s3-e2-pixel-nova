import { Redirect, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import MongolianText from '@/components/MongolianText';
import {
  AppScreen,
  Card,
  Pill,
  PrimaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { hasTraditionalMongolian } from '@/lib/mongolian-script';
import { useStudentApp } from '@/lib/student-app/context';
import { formatDateTime, getResultMessage } from '@/lib/student-app/utils';
import { resultStyles as styles } from '@/styles/screens/result';

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
            {hasTraditionalMongolian(answer.questionText) ? (
              <View>
                <Text style={styles.answerQuestion}>{index + 1}.</Text>
                <MongolianText
                  text={answer.questionText}
                  style={styles.answerQuestion}
                />
              </View>
            ) : (
              <Text style={styles.answerQuestion}>
                {index + 1}. {answer.questionText}
              </Text>
            )}
            <Text style={styles.answerMeta}>Your answer: {resolveAnswerText(answer)}</Text>
            {answer.correctAnswerText &&
            hasTraditionalMongolian(answer.correctAnswerText) ? (
              <View>
                <Text style={styles.answerMeta}>Correct answer:</Text>
                <MongolianText
                  text={answer.correctAnswerText}
                  style={styles.answerMeta}
                />
              </View>
            ) : (
              <Text style={styles.answerMeta}>
                Correct answer: {answer.correctAnswerText ?? 'Not provided'}
              </Text>
            )}
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

