import { useCallback, useEffect, useState } from "react";
import { getJSON, getJSONForRole, setJSON, setJSONForRole } from "@/lib/examGuard";
import { getStudentProfile, updateStudentProfile, type StudentProfile } from "@/api";
import { cardClass } from "../styles";
import { Settings, User } from "lucide-react";
import { getLinkedTeacherRole, getStoredRole } from "@/lib/role-session";

type StudentSettingsTabProps = {
  userId: string;
  username: string;
};

const defaultProfile = (username: string): StudentProfile => ({
  fullName: username,
  email: "",
  phone: "",
  school: "",
  grade: "",
  bio: "",
});

export default function StudentSettingsTab({
  userId,
  username,
}: StudentSettingsTabProps) {
  const storageKey = `studentProfile:${userId}`;
  const [profile, setProfile] = useState<StudentProfile>(
    defaultProfile(username),
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getJSON<StudentProfile | null>(storageKey, null);
    if (stored) {
      setProfile({ ...defaultProfile(username), ...stored });
    } else {
      setProfile(defaultProfile(username));
    }
    setSaved(false);
  }, [storageKey, username]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const remoteProfile = await getStudentProfile();
        if (cancelled) return;

        const nextProfile = {
          ...defaultProfile(username),
          ...remoteProfile,
        };
        setProfile(nextProfile);
        setJSON(storageKey, nextProfile);
      } catch {
        if (cancelled) return;
        const stored = getJSON<StudentProfile | null>(storageKey, null);
        if (stored) {
          setProfile({ ...defaultProfile(username), ...stored });
        } else {
          setError("Failed to load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [storageKey, username]);

  const handleChange = (field: keyof StudentProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    setSaved(false);
    setError(null);
    const nextProfile: StudentProfile = {
      ...profile,
      fullName: profile.fullName || username,
      id: userId,
    };

    try {
      const savedProfile = await updateStudentProfile(nextProfile);
      const normalizedProfile = {
        ...nextProfile,
        ...savedProfile,
      };

      setProfile(normalizedProfile);
      setJSON(storageKey, normalizedProfile);

      const profiles = getJSON<Record<string, StudentProfile>>(
        "studentProfiles",
        {},
      );
      profiles[userId] = normalizedProfile;
      setJSON("studentProfiles", profiles);

      const linkedTeacherRole = getLinkedTeacherRole(getStoredRole());
      const teacherProfiles = getJSONForRole<Record<string, StudentProfile>>(
        "studentProfiles",
        {},
        linkedTeacherRole,
      );
      teacherProfiles[userId] = normalizedProfile;
      setJSONForRole("studentProfiles", teacherProfiles, linkedTeacherRole);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Failed to save profile.");
    }
  }, [profile, storageKey, userId, username]);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <User className="w-4 h-4" />
          Profile
        </h2>
        <div className="mt-4 grid gap-3 text-sm">
          {loading && (
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              Loading profile...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Full name
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.fullName ?? ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Email
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.email ?? ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="email@domain.mn"
              type="email"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Phone
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.phone ?? ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="9911 2233"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                School
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={profile.school ?? ""}
                onChange={(e) => handleChange("school", e.target.value)}
                placeholder="School name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Grade
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={profile.grade ?? ""}
                onChange={(e) => handleChange("grade", e.target.value)}
                placeholder="10A"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Bio
            </label>
            <textarea
              className="mt-1 min-h-[90px] w-full resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.bio ?? ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Short introduction..."
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Review your information before saving.
            </span>
            <button
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          {saved && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
              Profile saved successfully.
            </div>
          )}
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4" />
          Settings
        </h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>Autosave: Enabled</div>
          <div>Exam reminders: Enabled</div>
          <div>Focus mode: Active</div>
        </div>
      </div>
    </section>
  );
}
