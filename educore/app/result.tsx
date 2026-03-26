import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppScreen,
  Card,
  PrimaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import { getResultMessage } from '@/lib/student-app/utils';

export default function ResultScreen() {
  const router = useRouter();
  const { clearResult, submittedResult, student } = useStudentApp();

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

    return answer.textAnswer ?? 'Хоосон';
  };

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title="Шалгалт амжилттай илгээгдлээ"
          subtitle={getResultMessage(submittedResult.score)}
        />
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Оноо</Text>
            <Text style={uiStyles.statValue}>{submittedResult.score}%</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Авсан оноо</Text>
            <Text style={uiStyles.statValue}>
              {submittedResult.earnedPoints}/{submittedResult.totalPoints}
            </Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.answerTitle}>Асуултын тойм</Text>
        {submittedResult.answers.map((answer, index) => (
          <View key={`${answer.questionId}-${index}`} style={styles.answerRow}>
            <Text style={styles.answerQuestion}>
              {index + 1}. {answer.questionText}
            </Text>
            <Text style={styles.answerMeta}>
              Таны хариулт: {resolveAnswerText(answer)}
            </Text>
            <Text style={styles.answerMeta}>
              Зөв хариулт: {answer.correctAnswerText ?? 'Тайлбаргүй'}
            </Text>
            <Text
              style={[
                styles.answerState,
                answer.isCorrect ? styles.answerCorrect : styles.answerWrong,
              ]}>
              {answer.isCorrect ? 'Зөв' : 'Буруу'}
            </Text>
          </View>
        ))}
        <PrimaryButton
          label="Нүүр хуудас руу буцах"
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
