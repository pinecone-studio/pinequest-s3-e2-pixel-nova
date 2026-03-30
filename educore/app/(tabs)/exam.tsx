import { useFocusEffect } from '@react-navigation/native';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera as VisionCamera } from 'react-native-vision-camera';

import MobileProctorCamera from "@/components/student-app/MobileProctorCamera";
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
import { examStyles as styles } from '@/styles/screens/exam';

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
  const [appIsActive, setAppIsActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
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
      setAppIsActive(nextState === 'active');
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
      const permissionStatus = await VisionCamera.getCameraPermissionStatus();
      const resolvedStatus =
        permissionStatus === "granted"
          ? permissionStatus
          : permissionStatus === "not-determined"
            ? await VisionCamera.requestCameraPermission()
            : permissionStatus;

      if (resolvedStatus !== "granted") {
        setSyncError(
          "Камерын зөвшөөрөл шаардлагатай. Settings-ээс front camera access зөвшөөрөөд дахин оролдоно уу.",
        );
        return;
      }

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
        <MobileProctorCamera
          isEnabled={activeSession.status === "in_progress" && appIsActive}
          onViolation={logIntegrityEvent}
        />
      ) : null}

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

