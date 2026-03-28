import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  AppScreen,
  Card,
  ErrorText,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import {
  computeRemainingSeconds,
  formatCountdown,
  getEntryStatusLabel,
  normalizeApiError,
} from '@/lib/student-app/utils';

export default function ExamScreen() {
  const router = useRouter();
  const {
    activeSession,
    answerQuestion,
    hydrated,
    integrity,
    logIntegrityEvent,
    recoverActiveSession,
    setCurrentQuestionIndex,
    setIntegrityWarning,
    startExam,
    student,
    submitCurrentExam,
  } = useStudentApp();
  const [remainingSeconds, setRemainingSeconds] = useState(
    computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const submitRequestedRef = useRef(false);

  const currentQuestion =
    activeSession?.questions[activeSession.currentQuestionIndex] ?? null;
  const currentAnswer = currentQuestion
    ? activeSession?.answers[currentQuestion.id] ?? {}
    : {};
  const isJoined =
    activeSession?.status === 'joined' || activeSession?.status === 'late';
  const isSyncBlocked = activeSession?.syncStatus === 'syncing' || submitting;

  const persistTextAnswer = useCallback(async () => {
    if (!currentQuestion || !activeSession) return;
    if (
      currentQuestion.type !== 'short_answer' &&
      currentQuestion.type !== 'essay' &&
      currentQuestion.type !== 'text'
    ) {
      return;
    }

    const currentValue = currentAnswer.textAnswer ?? '';
    if (textDraft === currentValue) return;

    setSyncError(null);
    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: null,
        textAnswer: textDraft,
      });
    } catch (error) {
      setSyncError(
        normalizeApiError(error, 'Could not save your typed answer.'),
      );
    }
  }, [activeSession, answerQuestion, currentAnswer.textAnswer, currentQuestion, textDraft]);

  const handleSubmit = useCallback(
    async (forced = false) => {
      if (!forced) {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Submit exam',
            'After submission, answers can no longer be edited on this device.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Submit', style: 'default', onPress: () => resolve(true) },
            ],
          );
        });

        if (!confirmed) return;
      }

      await persistTextAnswer();

      setSubmitting(true);
      setSyncError(null);

      try {
        await submitCurrentExam();
        router.replace('/result');
      } catch (error) {
        submitRequestedRef.current = false;
        setSyncError(
          normalizeApiError(error, 'Could not submit the exam.'),
        );
      } finally {
        setSubmitting(false);
      }
    },
    [persistTextAnswer, router, submitCurrentExam],
  );

  const moveQuestion = async (direction: -1 | 1) => {
    await persistTextAnswer();
    if (!activeSession) return;
    setCurrentQuestionIndex(activeSession.currentQuestionIndex + direction);
  };

  useEffect(() => {
    setRemainingSeconds(
      computeRemainingSeconds(activeSession?.timerEndsAt ?? null),
    );
  }, [activeSession?.timerEndsAt]);

  useEffect(() => {
    setTextDraft(currentAnswer.textAnswer ?? '');
  }, [currentAnswer.textAnswer, currentQuestion?.id]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'in_progress') return;

    const interval = setInterval(() => {
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.status !== 'in_progress') return;
    if (remainingSeconds > 0 || submitRequestedRef.current) return;

    submitRequestedRef.current = true;
    void handleSubmit(true);
  }, [activeSession, handleSubmit, remainingSeconds]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && activeSession?.status === 'in_progress') {
        setIntegrityWarning(
          'The app moved out of the foreground during an active exam.',
        );
        void logIntegrityEvent('tab_hidden', `app-state:${nextState}`);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [activeSession?.status, logIntegrityEvent, setIntegrityWarning]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (
          activeSession &&
          activeSession.status === 'in_progress' &&
          !submitRequestedRef.current
        ) {
          setIntegrityWarning(
            'You left the exam screen. Stay inside the exam until you submit.',
          );
          void logIntegrityEvent('window_blur', 'screen-blur');
        }
      };
    }, [activeSession, logIntegrityEvent, setIntegrityWarning]),
  );

  const progressLabel = useMemo(() => {
    if (!activeSession || activeSession.questions.length === 0) {
      return '0/0';
    }

    return `${activeSession.currentQuestionIndex + 1}/${activeSession.questions.length}`;
  }, [activeSession]);

  if (!student) {
    return <Redirect href="/" />;
  }

  if (!hydrated) {
    return (
      <AppScreen scroll>
        <Card>
          <SectionTitle
            title="Loading active exam"
            subtitle="Restoring the latest exam state for this device."
          />
        </Card>
      </AppScreen>
    );
  }

  if (!activeSession) {
    return (
      <AppScreen scroll>
        <Card>
          <SectionTitle
            title="No active exam"
            subtitle="Join an exam from the Join screen to start or recover a session."
          />
          <PrimaryButton
            label="Join exam"
            onPress={() => {
              router.push('/join');
            }}
          />
          <SecondaryButton
            label="Back to home"
            onPress={() => {
              router.push('/home');
            }}
          />
        </Card>
      </AppScreen>
    );
  }

  const handleStart = async () => {
    try {
      await startExam();
      setRemainingSeconds(computeRemainingSeconds(activeSession.timerEndsAt));
    } catch (error) {
      setSyncError(
        normalizeApiError(error, 'Could not start the exam.'),
      );
    }
  };

  const saveMcqAnswer = async (optionId: string) => {
    if (!currentQuestion) return;

    setSyncError(null);

    try {
      await answerQuestion(currentQuestion.id, {
        selectedOptionId: optionId,
        textAnswer: null,
      });
    } catch (error) {
      setSyncError(
        normalizeApiError(error, 'Could not save your answer.'),
      );
    }
  };

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title={activeSession.exam.title}
          subtitle={
            isJoined
              ? 'Review the exam details and start when you are ready.'
              : 'Stay inside the app, keep your connection stable, and submit before the timer ends.'
          }
        />
        <View style={styles.pillRow}>
          <Pill
            label={getEntryStatusLabel(activeSession.entryStatus)}
            tone={activeSession.entryStatus === 'late' ? 'warning' : 'success'}
          />
          <Pill label={activeSession.syncStatus} />
        </View>
        <View style={styles.topMeta}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Time left</Text>
            <Text style={styles.metaChipValue}>
              {formatCountdown(remainingSeconds)}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Progress</Text>
            <Text style={styles.metaChipValue}>{progressLabel}</Text>
          </View>
        </View>
        {activeSession.syncMessage ? (
          <Text style={styles.helperText}>{activeSession.syncMessage}</Text>
        ) : null}
        {integrity.warningMessage ? (
          <Text style={styles.warningText}>{integrity.warningMessage}</Text>
        ) : null}
        <Text style={styles.helperText}>
          Screenshot blocking is not fully available in this build. Backgrounding and suspicious activity are still logged during active exams.
        </Text>
        <ErrorText message={syncError} />

        {isJoined ? (
          <>
            <PrimaryButton
              label="Start exam"
              onPress={() => void handleStart()}
            />
            <SecondaryButton
              label="Refresh session"
              onPress={() => {
                void recoverActiveSession();
              }}
            />
          </>
        ) : null}
      </Card>

      {!isJoined && currentQuestion ? (
        <Card>
          <Text style={styles.questionCounter}>
            Question {activeSession.currentQuestionIndex + 1}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
          {currentQuestion.imageUrl ? (
            <Image
              source={{ uri: currentQuestion.imageUrl }}
              style={styles.questionImage}
            />
          ) : null}

          {(currentQuestion.type === 'multiple_choice' ||
            currentQuestion.type === 'true_false') &&
          currentQuestion.options.length > 0 ? (
            <View style={styles.optionList}>
              {currentQuestion.options.map((option) => {
                const selected = currentAnswer.selectedOptionId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      void saveMcqAnswer(option.id);
                    }}
                    style={[
                      styles.optionButton,
                      selected && styles.optionButtonSelected,
                    ]}>
                    <Text
                      style={[
                        styles.optionLabel,
                        selected && styles.optionLabelSelected,
                      ]}>
                      {option.label}. {option.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput
              key={currentQuestion.id}
              multiline
              contextMenuHidden={integrity.capabilities.copyPasteRestricted}
              placeholder="Type your answer here"
              placeholderTextColor="#7A7A72"
              style={styles.answerInput}
              value={textDraft}
              onChangeText={setTextDraft}
              onBlur={() => {
                void persistTextAnswer();
              }}
            />
          )}
        </Card>
      ) : null}

      {!isJoined ? (
        <View style={styles.footerActions}>
          <SecondaryButton
            label="Previous"
            disabled={activeSession.currentQuestionIndex === 0 || isSyncBlocked}
            onPress={() => {
              void moveQuestion(-1);
            }}
          />
          <SecondaryButton
            label="Next"
            disabled={
              activeSession.currentQuestionIndex >= activeSession.questions.length - 1 ||
              isSyncBlocked
            }
            onPress={() => {
              void moveQuestion(1);
            }}
          />
          <PrimaryButton
            label="Submit exam"
            loading={submitting}
            disabled={isSyncBlocked}
            onPress={() => {
              void handleSubmit(false);
            }}
          />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    borderRadius: 18,
    padding: 14,
    backgroundColor: '#FFF7E7',
  },
  metaChipLabel: {
    fontSize: 12,
    color: '#6A6A63',
    marginBottom: 6,
  },
  metaChipValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#23412F',
  },
  questionCounter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5D6B57',
  },
  questionText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#19271E',
    fontWeight: '700',
  },
  questionImage: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#F0E9DC',
  },
  optionList: {
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#D9CCB4',
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFF8ED',
  },
  optionButtonSelected: {
    borderColor: '#2D6A4F',
    backgroundColor: '#E7F2EA',
  },
  optionLabel: {
    fontSize: 16,
    lineHeight: 24,
    color: '#314135',
  },
  optionLabelSelected: {
    color: '#1D4F38',
    fontWeight: '700',
  },
  answerInput: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#DCCFB6',
    borderRadius: 20,
    backgroundColor: '#FFF9ED',
    padding: 16,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#1F2A1F',
  },
  footerActions: {
    gap: 12,
    paddingBottom: 24,
  },
  helperText: {
    color: '#5D6B57',
    fontSize: 13,
    lineHeight: 20,
  },
  warningText: {
    color: '#8B5A22',
    fontSize: 13,
    lineHeight: 20,
  },
});
