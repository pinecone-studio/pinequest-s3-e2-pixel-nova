import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { InputField } from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import type { StudentProfile } from "@/types/student-app";
import { normalizeApiError } from "@/lib/student-app/utils";
import { profileStyles as styles, achStyles } from "@/styles/screens/profile";

const emptyProfile: StudentProfile = {
  fullName: "",
  email: "",
  avatarUrl: "",
  phone: "",
  school: "",
  grade: "",
  groupName: "",
  bio: "",
};

const getInitials = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "ST";

function AchievementCard({
  icon,
  label,
  desc,
  bg,
}: {
  icon: string;
  label: string;
  desc: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={[achStyles.card, { flex: 1 }]}>
      <View style={[achStyles.iconWrap, { backgroundColor: bg }]}>
        <Text style={achStyles.iconText}>{icon}</Text>
      </View>
      <Text style={achStyles.label}>{label}</Text>
      <Text style={achStyles.desc}>{desc}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    authMode,
    availableUsers,
    history,
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
  const [codeInput, setCodeInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [codeLoginOpen, setCodeLoginOpen] = useState(false);

  useEffect(() => {
    setForm(profile ?? emptyProfile);
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await saveProfile(form);
      setMessage("Профайл хадгалагдлаа.");
      setEditorOpen(false);
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

  const handleCodeLogin = async () => {
    setMessage(null);
    try {
      await signInWithCode(codeInput);
      setCodeInput("");
      setCodeLoginOpen(false);
    } catch (error) {
      setMessage(
        normalizeApiError(error, "Failed to sign in with student code."),
      );
    }
  };

  const handleResetPilotMode = async () => {
    setMessage(null);
    try {
      await logout();
      setSelectorOpen(false);
    } catch (error) {
      setMessage(normalizeApiError(error, "Failed to sign out."));
    }
  };

  const displayName = form.fullName || student?.fullName || "Оюутан";
  const xp = profile?.xp ?? student?.xp ?? 0;
  const level = profile?.level ?? student?.level ?? 1;
  const initials = getInitials(displayName);
  const totalExams = history?.length ?? 0;

  const shortName = (() => {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
    return displayName;
  })();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Профайл</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setEditorOpen(!editorOpen)}
        >
          <Ionicons name="settings-outline" size={22} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Profile card */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarWrap}>
            {form.avatarUrl ? (
              <Image
                source={{ uri: form.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>⭐</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{shortName}</Text>
              <View style={styles.levelBadge}>
                <Ionicons name="shield-outline" size={12} color="#6C5CE7" />
                <Text style={styles.levelText}>Lv{level}</Text>
              </View>
            </View>
            <Text style={styles.profileEmail}>
              {form.email || student?.email || "zoloo@school.edu.mn"}
            </Text>
          </View>
        </View>
      </View>

      {/* XP + Exams stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconWrap}>
            <Text style={styles.statIcon}>⚡</Text>
          </View>
          <Text style={styles.statBigValue}>{xp.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Нийт XP</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconWrap, { backgroundColor: "#EEF2FF" }]}>
            <Text style={styles.statIcon}>📖</Text>
          </View>
          <Text style={styles.statBigValue}>{totalExams}</Text>
          <Text style={styles.statLabel}>Өгсөн шалгалт</Text>
        </View>
      </View>

      {/* Амжилтууд */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Амжилтууд</Text>
        <Text style={styles.sectionMeta}>2 нээгдсэн</Text>
      </View>
      <View style={styles.achRow}>
        <AchievementCard
          icon="🏆"
          label="Том тархи"
          desc="100% оноо шалгалтан дээр авах"
          color="#F5A623"
          bg="#FEF3C7"
        />
        <AchievementCard
          icon="⚡"
          label="Түргэн бодогч"
          desc="20мин дотор шалгалтаа дуусгах"
          color="#fff"
          bg="#06B6D4"
        />
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        {/* Статистик */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => void refreshProfile()}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#EEF2FF" }]}>
            <Ionicons name="bar-chart-outline" size={20} color="#5B67F8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Миний статистик</Text>
            <Text style={styles.menuSub}>Шалгалтуудын дэлгэрэнгүйг харах</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Student accounts — Doc 14-ийн switcher */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setSelectorOpen(!selectorOpen)}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons
              name="swap-horizontal-outline"
              size={20}
              color="#F59E0B"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Student accounts</Text>
            <Text style={styles.menuSub}>
              {authMode === "user_switcher"
                ? "Student account"
                : "Student code"}{" "}
              · {availableUsers.length} хэрэглэгч
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Student code login */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setCodeLoginOpen(!codeLoginOpen)}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#DCFCE7" }]}>
            <Ionicons name="key-outline" size={20} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuLabel}>Student code login</Text>
            <Text style={styles.menuSub}>Кодоор нэвтрэх</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        {/* Гарах */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => void handleResetPilotMode()}
        >
          <View style={[styles.menuIcon, { backgroundColor: "#FEE2E2" }]}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: "#EF4444" }]}>Гарах</Text>
            <Text style={styles.menuSub}>Дараа дахин уулзья</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Student accounts dropdown */}
      {selectorOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Хэрэглэгч сонгох</Text>
          {availableUsers.length === 0 ? (
            <Text style={styles.menuSub}>Бэлэн хэрэглэгч байхгүй байна.</Text>
          ) : null}
          {availableUsers.map((u) => {
            const selected = u.id === student?.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => void handleUserSwitch(u.id)}
                style={[
                  styles.selectorOption,
                  selected && styles.selectorOptionSelected,
                ]}
              >
                <View>
                  <Text style={styles.selectorName}>{u.fullName}</Text>
                  <Text style={styles.selectorCode}>{u.code ?? u.id}</Text>
                </View>
                {selected && (
                  <Ionicons name="checkmark-circle" size={20} color="#5B67F8" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Student code login dropdown */}
      {codeLoginOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Student code login</Text>
          <Text style={styles.menuSub}>
            Багшаас авсан student code-ээр нэвтрэнэ үү. Жишээ: S-2001
          </Text>
          <InputField
            label="Student code"
            autoCapitalize="characters"
            value={codeInput}
            onChangeText={setCodeInput}
            placeholder="S-2001"
          />
          {message && (
            <Text
              style={[
                styles.menuSub,
                {
                  color: message.includes("хадгал") ? "#22C55E" : "#EF4444",
                  textAlign: "center",
                },
              ]}
            >
              {message}
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!codeInput.trim() || signingIn) && { opacity: 0.4 },
            ]}
            disabled={!codeInput.trim() || signingIn}
            onPress={() => void handleCodeLogin()}
          >
            <Text style={styles.saveBtnText}>
              {signingIn ? "Нэвтэрж байна..." : "Нэвтрэх"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Profile editor */}
      {editorOpen && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Профайл засах</Text>
          {[
            { label: "Бүтэн нэр", key: "fullName" },
            { label: "Имэйл", key: "email" },
            { label: "Утас", key: "phone" },
            { label: "Сургууль", key: "school" },
            { label: "Анги", key: "grade" },
            { label: "Бүлэг", key: "groupName" },
            { label: "Avatar URL", key: "avatarUrl" },
          ].map(({ label, key }) => (
            <InputField
              key={key}
              label={label}
              value={(form as any)[key] ?? ""}
              onChangeText={(v) => setForm((p) => ({ ...p, [key]: v }))}
            />
          ))}
          <InputField
            label="Bio"
            multiline
            value={form.bio ?? ""}
            onChangeText={(v) => setForm((p) => ({ ...p, bio: v }))}
          />
          {message && (
            <Text
              style={[
                styles.menuSub,
                {
                  color: message.includes("хадгал") ? "#22C55E" : "#EF4444",
                  textAlign: "center",
                },
              ]}
            >
              {message}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.saveBtn, (saving || signingIn) && { opacity: 0.5 }]}
            disabled={saving || signingIn}
            onPress={() => void handleSave()}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
