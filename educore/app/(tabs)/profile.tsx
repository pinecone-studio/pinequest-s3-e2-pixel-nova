import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
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
import type { StudentProfile } from '@/lib/student-app/types';
import { normalizeApiError } from '@/lib/student-app/utils';

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
    profile,
    refreshProfile,
    saveProfile,
    signingIn,
    student,
    switchUser,
  } = useStudentApp();
  const [form, setForm] = useState<StudentProfile>(profile ?? emptyProfile);
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
              <Pill label={authMode === 'dev_switcher' ? 'Pilot mode' : 'Student login'} />
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
        <SecondaryButton
          label="Refresh profile"
          onPress={() => {
            void refreshProfile();
          }}
        />
      </Card>

      <Card>
        <View style={styles.switchHeader}>
          <Text style={styles.sectionTitle}>Student switcher</Text>
          <Pressable
            onPress={() => setSelectorOpen((open) => !open)}
            style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Ionicons name="swap-horizontal-outline" size={18} color="#0D87B8" />
          </Pressable>
        </View>
        <Text style={styles.helperText}>
          This stays available for internal testing and pilot usage. Production student code login can replace it later without changing the screen flow.
        </Text>
        {selectorOpen ? (
          <View style={styles.selectorCard}>
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

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 28,
  },
  hero: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCEBE4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#2D6A4F',
  },
  heroBody: {
    flex: 1,
    gap: 6,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#203229',
  },
  profileMeta: {
    fontSize: 14,
    color: '#5F665E',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#203229',
  },
  switchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5F665E',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF5FB',
  },
  selectorCard: {
    gap: 10,
  },
  selectorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7DDCB',
    backgroundColor: '#FFF8EA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorOptionSelected: {
    borderColor: '#9BD0E3',
    backgroundColor: '#F2FBFF',
  },
  selectorOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#203229',
  },
  selectorMeta: {
    fontSize: 12,
    color: '#6E6A62',
  },
  pressed: {
    opacity: 0.86,
  },
});
