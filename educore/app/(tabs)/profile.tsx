import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppScreen,
  Card,
  ErrorText,
  InputField,
  PrimaryButton,
  SecondaryButton,
} from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import type { StudentProfile } from "@/lib/student-app/types";
import { normalizeApiError } from "@/lib/student-app/utils";

const emptyProfile: StudentProfile = {
  fullName: "",
  email: "",
  avatarUrl: "",
  phone: "",
  school: "",
  grade: "",
  bio: "",
};

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ST";

const getLevelProgress = (xp: number, level: number) => {
  const safeLevel = Math.max(level, 1);
  const floor = (safeLevel - 1) * 1000;
  const ceiling = safeLevel * 1000;
  const span = Math.max(ceiling - floor, 1);
  const current = Math.min(Math.max(xp - floor, 0), span);

  return {
    current,
    total: span,
    percent: Math.round((current / span) * 100),
  };
};

function ProfileStat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={16} color="#0D87B8" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AchievementCard({
  icon,
  title,
  subtitle,
  tone = "gold",
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tone?: "gold" | "blue";
}) {
  return (
    <View style={styles.achievementCard}>
      <View
        style={[
          styles.achievementIcon,
          tone === "blue" ? styles.achievementIconBlue : styles.achievementIconGold,
        ]}
      >
        <Ionicons
          name={icon}
          size={16}
          color={tone === "blue" ? "#149FD4" : "#F0B329"}
        />
      </View>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const {
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
      setMessage("Profile updated.");
    } catch (error) {
      setMessage(normalizeApiError(error, "Failed to save profile."));
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
      setMessage(normalizeApiError(error, "Failed to switch user."));
    }
  };

  const displayName = form.fullName || student?.fullName || "Student";
  const xp = profile?.xp ?? student?.xp ?? 0;
  const level = profile?.level ?? student?.level ?? 1;
  const progress = useMemo(() => getLevelProgress(xp, level), [level, xp]);
  const completionCount = [
    form.fullName,
    form.email,
    form.phone,
    form.school,
    form.grade,
    form.bio,
  ].filter((value) => Boolean(value && String(value).trim())).length;
  const completionPercent = Math.round((completionCount / 6) * 100);
  const initials = getInitials(displayName);

  return (
    <AppScreen scroll contentContainerStyle={styles.screenContent}>
      <View style={styles.shell}>
        <Text style={styles.screenLabel}>Profile</Text>

        <View style={styles.heroWrap}>
          <View style={styles.avatarWrap}>
            {form.avatarUrl ? (
              <Image source={{ uri: form.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>

          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileRole}>{form.grade || "Student"}</Text>
              </View>
              <Pressable
                onPress={() => setSelectorOpen((open) => !open)}
                style={({ pressed }) => [
                  styles.editButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="create-outline" size={18} color="#0D87B8" />
              </Pressable>
            </View>

            <View style={styles.expRow}>
              <Text style={styles.expLabel}>Exp</Text>
              <Text style={styles.expValue}>{xp}</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[styles.progressBarFill, { width: `${progress.percent}%` }]}
              />
            </View>
          </Card>
        </View>

        <View style={styles.twoCol}>
          <ProfileStat
            icon="school-outline"
            value={form.school || "English"}
            label="Gol hicheel"
          />
          <ProfileStat
            icon="star-outline"
            value={`${completionPercent}%`}
            label="Dundaj onoo"
          />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Amjiltuud</Text>
          <Text style={styles.sectionMeta}>{Math.max(completionCount - 1, 0)} nemev</Text>
        </View>

        <View style={styles.twoCol}>
          <AchievementCard
            icon="trophy-outline"
            title={`Level ${level}`}
            subtitle={`${progress.current}/${progress.total} avah`}
          />
          <AchievementCard
            icon="flash-outline"
            title={`${xp} XP`}
            subtitle="Hurdan ahits"
            tone="blue"
          />
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsIcon}>
            <Ionicons name="stats-chart-outline" size={18} color="#149FD4" />
          </View>
          <View style={styles.analyticsBody}>
            <Text style={styles.analyticsTitle}>Minii statistik</Text>
            <Text style={styles.analyticsSubtitle}>
              Shalgalt, tuvshin, profile-iin yavts
            </Text>
          </View>
        </View>

        {selectorOpen ? (
          <Card style={styles.selectorCard}>
            <Text style={styles.selectorCardTitle}>Current user</Text>
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
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.selectorOptionText,
                        selected && styles.selectorOptionTextSelected,
                      ]}
                    >
                      {userOption.fullName}
                    </Text>
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
          </Card>
        ) : null}

        <ErrorText message={message} />

        <Card style={styles.editorCard}>
          <Text style={styles.editorTitle}>Profile editor</Text>
          <InputField
            label="Full name"
            value={form.fullName}
            onChangeText={(value) => setForm((prev) => ({ ...prev, fullName: value }))}
          />
          <InputField
            label="Avatar URL"
            autoCapitalize="none"
            value={form.avatarUrl ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, avatarUrl: value }))}
          />
          <InputField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
          />
          <InputField
            label="Phone"
            keyboardType="phone-pad"
            value={form.phone ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          />
          <InputField
            label="School"
            value={form.school ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, school: value }))}
          />
          <InputField
            label="Grade"
            value={form.grade ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, grade: value }))}
          />
          <InputField
            label="Bio"
            multiline
            value={form.bio ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, bio: value }))}
          />
          <PrimaryButton
            label="Save profile"
            loading={saving}
            onPress={() => {
              void handleSave();
            }}
          />
          <SecondaryButton
            label={signingIn ? "Switching user..." : "Refresh profile"}
            onPress={() => {
              void refreshProfile();
            }}
          />
        </Card>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingBottom: 32,
  },
  shell: {
    gap: 14,
  },
  screenLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5F5A51",
    marginBottom: 2,
  },
  heroWrap: {
    paddingTop: 52,
  },
  avatarWrap: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    zIndex: 2,
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: "#5BD7FF",
    backgroundColor: "#29BFEF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B6F99",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D7F1FF",
    borderRadius: 26,
    paddingTop: 54,
    shadowColor: "#55BEE7",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0C82B1",
  },
  profileRole: {
    marginTop: 4,
    fontSize: 14,
    color: "#6D7680",
  },
  editButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#8EE1FF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4FCFF",
  },
  expRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  expLabel: {
    fontSize: 12,
    color: "#7C8794",
  },
  expValue: {
    fontSize: 12,
    color: "#7C8794",
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E9F8FF",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#29C8F6",
  },
  twoCol: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C6EEFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#6ACBEE",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#98E2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#0A7EAD",
    textAlign: "center",
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: "#8A919B",
    textAlign: "center",
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#26333A",
  },
  sectionMeta: {
    fontSize: 12,
    color: "#9AA1A9",
  },
  achievementCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C6EEFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: "#6ACBEE",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  achievementIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementIconGold: {
    backgroundColor: "#FFF7D6",
  },
  achievementIconBlue: {
    backgroundColor: "#E8F9FF",
  },
  achievementTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#0B7EAD",
  },
  achievementSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#8A919B",
  },
  analyticsCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C6EEFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#6ACBEE",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  analyticsIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EEF9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  analyticsBody: {
    flex: 1,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B7EAD",
  },
  analyticsSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#8A919B",
  },
  selectorCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D7F1FF",
  },
  selectorCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#28373D",
  },
  selectorOption: {
    borderWidth: 1,
    borderColor: "#D9F0FB",
    borderRadius: 18,
    backgroundColor: "#F7FDFF",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorOptionSelected: {
    borderColor: "#71D7FB",
    backgroundColor: "#EEFAFF",
  },
  selectorOptionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#24373C",
  },
  selectorOptionTextSelected: {
    color: "#0B7EAD",
  },
  selectorMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#7E8A95",
  },
  editorCard: {
    backgroundColor: "#FFFCF5",
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#24392F",
  },
  pressed: {
    opacity: 0.86,
  },
});
