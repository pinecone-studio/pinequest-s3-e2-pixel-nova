import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import {
  AppScreen,
  Card,
  ErrorText,
  InputField,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import {
  formatDateTime,
  getEntryStatusLabel,
  normalizeApiError,
} from '@/lib/student-app/utils';

export default function JoinExamScreen() {
  const router = useRouter();
  const { activeSession, joinExam, student } = useStudentApp();
  const [roomCode, setRoomCode] = useState(activeSession?.roomCode ?? '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!student) {
    return <Redirect href="/" />;
  }

  const handleJoin = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      await joinExam(roomCode);
    } catch (error) {
      setErrorMessage(
        normalizeApiError(error, 'Could not join the exam with this room code.'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen scroll>
      <Card>
        <SectionTitle
          title="Join with room code"
          subtitle="Enter the code shared by your teacher. The app will load the exam details before you start."
        />
        <InputField
          label="Room code"
          autoCapitalize="characters"
          autoCorrect={false}
          value={roomCode}
          onChangeText={setRoomCode}
          placeholder="Example: ABC123"
        />
        <Text>
          Keep your connection stable. This release is online-first and saves answers directly to the backend.
        </Text>
        <ErrorText message={errorMessage} />
        <PrimaryButton
          label="Load exam"
          loading={loading}
          disabled={!roomCode.trim()}
          onPress={() => {
            void handleJoin();
          }}
        />
      </Card>

      {activeSession ? (
        <Card>
          <SectionTitle
            title={activeSession.exam.title}
            subtitle="The exam is ready on this device."
          />
          <Pill
            label={getEntryStatusLabel(activeSession.entryStatus)}
            tone={activeSession.entryStatus === 'late' ? 'warning' : 'success'}
          />
          <Text>{activeSession.exam.durationMin} minutes</Text>
          <Text>{activeSession.questions.length} questions</Text>
          <Text>
            Scheduled: {formatDateTime(activeSession.exam.scheduledAt ?? activeSession.startedAt)}
          </Text>
          {activeSession.entryStatus === 'late' ? (
            <Text>
              You entered after the session began. Start immediately so your remaining time is preserved.
            </Text>
          ) : null}
          <PrimaryButton
            label="Go to exam"
            onPress={() => {
              router.push('/exam');
            }}
          />
          <SecondaryButton
            label="Back to home"
            onPress={() => {
              router.replace('/home');
            }}
          />
        </Card>
      ) : null}
    </AppScreen>
  );
}
