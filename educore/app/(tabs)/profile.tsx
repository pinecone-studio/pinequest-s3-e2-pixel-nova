import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';

import {
  AppScreen,
  Card,
  ErrorText,
  InputField,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionTitle,
  uiStyles,
} from '@/components/student-app/ui';
import { useStudentApp } from '@/lib/student-app/context';
import type { StudentProfile } from '@/types/student-app';
import { normalizeApiError } from '@/lib/student-app/utils';
import { profileStyles as styles } from '@/styles/screens/profile';

const emptyProfile: StudentProfile = {
  fullName: '',
  email: '',
  avatarUrl: '',
  phone: '',
  school: '',
  grade: '',
  groupName: '',
  bio: '',
};

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'ST';

export default function ProfileScreen() {
  const {
    authMode,
    availableUsers,
    logout,
    profile,
    refreshProfile,
    saveProfile,
    signInWithCode,
    signingIn,
    student,
    switchUser,
  } = useStudentApp();
  const [form, setForm] = useState<StudentProfile>(profile ?? emptyProfile);
  const [codeInput, setCodeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    setForm(profile ?? emptyProfile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await saveProfile(form);
      setMessage('Profile updated.');
    } catch (error) {
      setMessage(normalizeApiError(error, 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  };

  const handleUserSwitch = async (userId: string) => {
    setMessage(null);
    try {
      await switchUser(userId);
      setSelectorOpen(false);
    } catch (error) {
      setMessage(normalizeApiError(error, 'Failed to switch user.'));
    }
  };

  const handleCodeLogin = async () => {
    setMessage(null);
    try {
      await signInWithCode(codeInput);
      setCodeInput('');
      setSelectorOpen(false);
    } catch (error) {
      setMessage(normalizeApiError(error, 'Failed to sign in with student code.'));
    }
  };

  const handleResetPilotMode = async () => {
    setMessage(null);
    try {
      await logout();
      setSelectorOpen(false);
    } catch (error) {
      setMessage(normalizeApiError(error, 'Failed to sign out.'));
    }
  };

  const displayName = form.fullName || student?.fullName || 'Student';
  const xp = profile?.xp ?? student?.xp ?? 0;
  const level = profile?.level ?? student?.level ?? 1;
  const initials = getInitials(displayName);

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <Card>
        <SectionTitle
          title="Profile"
          subtitle="Manage your student details and keep your classroom information up to date."
        />
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {form.avatarUrl ? (
              <Image source={{ uri: form.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileMeta}>
              {form.grade || 'Student'} · {form.school || 'School not set'}
            </Text>
            <View style={styles.pillRow}>
              <Pill label={`Level ${level}`} tone="success" />
              <Pill label={`${xp} XP`} />
              <Pill label={authMode === 'user_switcher' ? 'Student account' : 'Student code'} />
            </View>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Account status</Text>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Student code</Text>
            <Text style={uiStyles.statValue}>{profile?.code ?? student?.code ?? '--'}</Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Group</Text>
            <Text style={uiStyles.statValue}>{form.groupName || '--'}</Text>
          </View>
        </View>
        <View style={uiStyles.statRow}>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Auth mode</Text>
            <Text style={uiStyles.statValue}>
              {authMode === 'user_switcher' ? 'Student account' : 'Student code'}
            </Text>
          </View>
          <View style={uiStyles.statCard}>
            <Text style={uiStyles.statLabel}>Available users</Text>
            <Text style={uiStyles.statValue}>{availableUsers.length}</Text>
          </View>
        </View>
        <SecondaryButton
          label="Refresh profile"
          onPress={() => {
            void refreshProfile();
          }}
        />
      </Card>

      <Card>
        <View style={styles.switchHeader}>
          <Text style={styles.sectionTitle}>Student accounts</Text>
          <Pressable
            onPress={() => setSelectorOpen((open) => !open)}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#0D87B8" />
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          This list comes from the backend. If no student accounts are available yet, sign in with a student code first.
        </Text>
        {selectorOpen ? (
          <View style={styles.selectorCard}>
            {availableUsers.length === 0 ? (
              <Text style={styles.helperText}>No backend student accounts found.</Text>
            ) : null}
            {availableUsers.map((userOption) => {
              const selected = userOption.id === student?.id;
              return (
                <Pressable
                  key={userOption.id}
                  onPress={() => {
                    void handleUserSwitch(userOption.id);
                  }}
                  style={({ pressed }) => [
                    styles.selectorOption,
                    selected && styles.selectorOptionSelected,
                    pressed && styles.pressed,
                  ]}>
                  <View>
                    <Text style={styles.selectorOptionText}>{userOption.fullName}</Text>
                    <Text style={styles.selectorMeta}>
                      {userOption.code ?? userOption.id}
                    </Text>
                  </View>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={20} color="#10A2D8" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Student code login</Text>
        <Text style={styles.helperText}>
          Use a backend student code to sign in directly. This is now the only built-in fallback path when no student is already selected on the device.
        </Text>
        <InputField
          label="Student code"
          autoCapitalize="characters"
          value={codeInput}
          onChangeText={setCodeInput}
          placeholder="S-2001"
        />
        <PrimaryButton
          label="Sign in with code"
          loading={signingIn}
          disabled={!codeInput.trim()}
          onPress={() => {
            void handleCodeLogin();
          }}
        />
        <SecondaryButton
          label="Sign out"
          disabled={signingIn || !student}
          onPress={() => {
            void handleResetPilotMode();
          }}
        />
      </Card>

      <ErrorText message={message} />

      <Card>
        <Text style={styles.sectionTitle}>Profile editor</Text>
        <InputField
          label="Full name"
          value={form.fullName}
          onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
        />
        <InputField
          label="Avatar URL"
          autoCapitalize="none"
          value={form.avatarUrl ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))}
        />
        <InputField
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
        />
        <InputField
          label="Phone"
          keyboardType="phone-pad"
          value={form.phone ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
        />
        <InputField
          label="School"
          value={form.school ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, school: value }))}
        />
        <InputField
          label="Grade"
          value={form.grade ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, grade: value }))}
        />
        <InputField
          label="Group"
          value={form.groupName ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, groupName: value }))}
        />
        <InputField
          label="Bio"
          multiline
          value={form.bio ?? ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, bio: value }))}
        />
        <PrimaryButton
          label="Save profile"
          loading={saving || signingIn}
          onPress={() => {
            void handleSave();
          }}
        />
      </Card>
    </AppScreen>
  );
}

