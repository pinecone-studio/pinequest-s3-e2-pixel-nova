import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { InputField } from "@/components/student-app/ui";
import { useStudentApp } from "@/lib/student-app/context";
import { normalizeApiError } from "@/lib/student-app/utils";
import { profileStyles as styles } from "@/styles/screens/profile";
import type { StudentProfile } from "@/types/student-app";

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

const defaultAvatarImage = require("@/assets/images/zolbayar-profile.jpg");

const editableFields: {
  label: string;
  key:
    | "fullName"
    | "email"
    | "phone"
    | "school"
    | "grade"
    | "groupName"
    | "avatarUrl";
}[] = [
  { label: "Бүтэн нэр", key: "fullName" },
  { label: "Имэйл", key: "email" },
  { label: "Утас", key: "phone" },
  { label: "Сургууль", key: "school" },
  { label: "Анги", key: "grade" },
  { label: "Бүлэг", key: "groupName" },
  { label: "Avatar URL", key: "avatarUrl" },
];


function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconWrap}>
        <Ionicons name={icon} size={18} color="#2563EB" />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureSubtitle}>{subtitle}</Text>
    </View>
  );
}

function AchievementCard({
  icon,
  title,
  subtitle,
  bgColor,
  iconColor,
}: {
  icon: string;
  title: string;
  subtitle: string;
  bgColor: string;
  iconColor?: string;
}) {
  return (
    <View style={styles.achievementCard}>
      <View style={[styles.achievementIconWrap, { backgroundColor: bgColor }]}>
        <Text style={[styles.achievementIcon, iconColor ? { color: iconColor } : undefined]}>
          {icon}
        </Text>
      </View>
      <Text style={styles.achievementTitle}>{title}</Text>
      <Text style={styles.achievementSubtitle}>{subtitle}</Text>
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

  const handleSignOut = async () => {
    setMessage(null);
    try {
      await logout();
      setSelectorOpen(false);
    } catch (error) {
      setMessage(normalizeApiError(error, "Failed to sign out."));
    }
  };

  const displayName = form.fullName || student?.fullName || "Оюутан";
  const xp = profile?.xp ?? student?.xp ?? 2300;
  const avatarUri = (form.avatarUrl ?? "").trim();
  const avatarSource = avatarUri ? { uri: avatarUri } : defaultAvatarImage;
  const averageScore =
    history.length > 0
      ? Math.round(
          history.reduce((sum, item) => sum + (item.score ?? 0), 0) /
            Math.max(
              1,
              history.filter((item) => typeof item.score === "number").length,
            ),
        )
      : 83;
  const xpMax = Math.max(3000, Math.ceil(xp / 500) * 500);
  const xpProgress = Math.min(1, xp / xpMax);
  const level = Math.max(1, Math.floor(xp / 200) + 1);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar first (behind), card second (in front) — natural DOM order */}
        <View style={styles.heroWrapper}>
          {/* Avatar — rendered first, sits behind card */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarShell}>
              <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" resizeMethod="scale" />
            </View>
          </View>

          <BlurView intensity={10} tint="light" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>{displayName}</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditorOpen((current) => !current)}
              >
                <Ionicons name="create-outline" size={18} color="#2563EB" />
              </TouchableOpacity>
            </View>
            <View style={styles.xpSection}>
              <View style={styles.xpRow}>
                <Text style={styles.xpLabel}>Lvl {level}</Text>
                <Text style={styles.xpValue}>{xp}xp</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${xpProgress * 100}%` }]} />
              </View>
            </View>
          </BlurView>
        </View>

        <View style={styles.featureRow}>
          <FeatureCard icon="star-outline" title="English" subtitle="Гоц хичээл" />
          <FeatureCard
            icon="star-outline"
            title={`${averageScore}%`}
            subtitle="Дундаж оноо"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Амжилтууд</Text>
          <Text style={styles.sectionMeta}>2 нээгдсэн</Text>
        </View>

        <View style={styles.achievementRow}>
          <AchievementCard
            icon="🏆"
            title="Том тархи"
            subtitle="100% авах"
            bgColor="rgba(245,158,11,0.3)"
          />
          <AchievementCard
            icon="⚡"
            title="Түргэн бодогч"
            subtitle="Хурдан дуусгах"
            bgColor="#2563EB"
            iconColor="#FFFFFF"
          />
        </View>

      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => void refreshProfile()}
        >
          <View style={styles.menuIconWrap}>
            <Ionicons name="bar-chart-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuLabel}>Миний статистик</Text>
            <Text style={styles.menuSub}>Шалгалтуудын дэлгэрэнгүйг харах</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.menuDivider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => void handleSignOut()}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="log-out-outline" size={24} color="#E62B34" />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuLabelDanger}>Гарах</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Hidden panels for account switcher & code login */}
      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setSelectorOpen((c) => !c)}
      >
        <View style={styles.menuItem}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="swap-horizontal-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuLabel}>Student accounts</Text>
            <Text style={styles.menuSub}>
              {authMode === "user_switcher" ? "Student account" : "Student code"} ·{" "}
              {availableUsers.length} хэрэглэгч
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuCard}
        onPress={() => setCodeLoginOpen((c) => !c)}
      >
        <View style={styles.menuItem}>
          <View style={styles.menuIconWrap}>
            <Ionicons name="key-outline" size={24} color="#2563EB" />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuLabel}>Student code login</Text>
            <Text style={styles.menuSub}>Кодоор нэвтрэх</Text>
          </View>
        </View>
      </TouchableOpacity>

      {selectorOpen && (
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Хэрэглэгч сонгох</Text>
          {availableUsers.length === 0 ? (
            <Text style={styles.panelText}>Бэлэн хэрэглэгч байхгүй байна.</Text>
          ) : null}
          {availableUsers.map((userItem) => {
            const selected = userItem.id === student?.id;
            return (
              <Pressable
                key={userItem.id}
                onPress={() => void handleUserSwitch(userItem.id)}
                style={[
                  styles.selectorOption,
                  selected && styles.selectorOptionSelected,
                ]}
              >
                <View>
                  <Text style={styles.selectorName}>{userItem.fullName}</Text>
                  <Text style={styles.selectorCode}>{userItem.code ?? userItem.id}</Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color="#2563EB" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {codeLoginOpen && (
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Student code login</Text>
          <Text style={styles.panelText}>
            Багшаасаа авсан student code-оор нэвтэрнэ үү. Жишээ: S-2001
          </Text>
          <InputField
            label="Student code"
            autoCapitalize="characters"
            value={codeInput}
            onChangeText={setCodeInput}
            placeholder="S-2001"
          />
          {message ? (
            <Text
              style={[
                styles.feedbackText,
                { color: message.includes("хадгал") ? "#22C55E" : "#EF4444" },
              ]}
            >
              {message}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.actionButton, (!codeInput.trim() || signingIn) && styles.buttonDisabled]}
            disabled={!codeInput.trim() || signingIn}
            onPress={() => void handleCodeLogin()}
          >
            <Text style={styles.actionButtonText}>
              {signingIn ? "Нэвтэрч байна..." : "Нэвтрэх"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {editorOpen && (
        <View style={styles.panelCard}>
          <Text style={styles.panelTitle}>Профайл засах</Text>
          {editableFields.map(({ label, key }) => (
            <InputField
              key={key}
              label={label}
              value={form[key] ?? ""}
              onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
            />
          ))}
          <InputField
            label="Bio"
            multiline
            value={form.bio ?? ""}
            onChangeText={(value) => setForm((prev) => ({ ...prev, bio: value }))}
          />
          {message ? (
            <Text
              style={[
                styles.feedbackText,
                { color: message.includes("хадгал") ? "#22C55E" : "#EF4444" },
              ]}
            >
              {message}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[styles.actionButton, (saving || signingIn) && styles.buttonDisabled]}
            disabled={saving || signingIn}
            onPress={() => void handleSave()}
          >
            <Text style={styles.actionButtonText}>
              {saving ? "Хадгалж байна..." : "Хадгалах"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}
