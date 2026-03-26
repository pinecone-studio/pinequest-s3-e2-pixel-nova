import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';

import {
  AppScreen,
  Card,
  ErrorText,
  InputField,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import { normalizeApiError } from '@/lib/student-app/utils';

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
        normalizeApiError(error, 'Өрөөний кодоор нэгдэх үед алдаа гарлаа.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <Card>
        <SectionTitle
          title="Өрөөний код"
          subtitle="Багшаасаа авсан кодоо оруулаад шалгалтын мэдээллээ татна."
        />
        <InputField
          label="Код"
          autoCapitalize="characters"
          autoCorrect={false}
          value={roomCode}
          onChangeText={setRoomCode}
          placeholder="Жишээ нь ABC123"
        />
        <ErrorText message={errorMessage} />
        <PrimaryButton
          label="Шалгалтыг шалгах"
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
            subtitle="Шалгалтын мэдээлэл бэлэн боллоо."
          />
          <InputField
            label="Хугацаа"
            editable={false}
            value={`${activeSession.exam.durationMin} минут`}
          />
          <InputField
            label="Асуултын тоо"
            editable={false}
            value={`${activeSession.questions.length}`}
          />
          <PrimaryButton
            label="Шалгалтыг эхлүүлэх"
            onPress={() => {
              router.push('/exam');
            }}
          />
          <SecondaryButton
            label="Нүүр хуудас руу буцах"
            onPress={() => {
              router.replace('/home');
            }}
          />
        </Card>
      ) : null}
    </AppScreen>
  );
}
