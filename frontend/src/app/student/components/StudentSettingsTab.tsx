import { useCallback, useEffect, useMemo, useState } from "react";
import { getJSON, setJSON } from "@/lib/examGuard";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  StudentProfile,
  getStudentProfile,
  updateStudentProfile,
} from "@/lib/backend-auth";
import { cardClass } from "../styles";
import { Settings, User } from "lucide-react";

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
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const storageKey = `studentProfile:${userId}`;
  const [profile, setProfile] = useState<StudentProfile>(
    defaultProfile(username),
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clerkDefaults = useMemo(() => {
    if (!user) return {};
    return {
      fullName: user.fullName || username,
      email: user.primaryEmailAddress?.emailAddress || "",
      avatarUrl: user.imageUrl || "",
      phone: (user.publicMetadata?.phone as string) || "",
      school: (user.publicMetadata?.school as string) || "",
      grade: (user.publicMetadata?.grade as string) || "",
      bio: (user.publicMetadata?.bio as string) || "",
    } satisfies Partial<StudentProfile>;
  }, [user, username]);

  useEffect(() => {
    const stored = getJSON<StudentProfile | null>(storageKey, null);
    if (stored) {
      setProfile({ ...defaultProfile(username), ...clerkDefaults, ...stored });
    } else {
      setProfile({ ...defaultProfile(username), ...clerkDefaults });
    }
    setSaved(false);
  }, [storageKey, username, clerkDefaults]);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token) return;
        const remote = await getStudentProfile(token);
        setProfile((prev) => ({ ...prev, ...remote }));
        setJSON(storageKey, { ...defaultProfile(username), ...remote });
      } catch {
        setError("Профайл ачаалах үед алдаа гарлаа.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [getToken, isSignedIn, storageKey, username]);

  const handleChange = (field: keyof StudentProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = useCallback(async () => {
    setSaved(false);
    setError(null);
    setJSON(storageKey, profile);
    if (!isSignedIn) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    try {
      const token = await getToken();
      if (!token) throw new Error("Нэвтрэх токен олдсонгүй");
      const payload: StudentProfile = {
        fullName: profile.fullName,
        email: profile.email ?? "",
        avatarUrl: profile.avatarUrl ?? "",
        phone: profile.phone ?? "",
        school: profile.school ?? "",
        grade: profile.grade ?? "",
        bio: profile.bio ?? "",
      };
      await updateStudentProfile(token, payload);
      if (user) {
        const nameParts = profile.fullName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        await user.update({
          firstName,
          lastName,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Профайл хадгалах үед алдаа гарлаа.");
    }
  }, [getToken, isSignedIn, profile, storageKey, user]);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <User className="w-4 h-4" />
          Профайл
        </h2>
        <div className="mt-4 grid gap-3 text-sm">
          {loading && (
            <div className="rounded-xl border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              Профайл ачаалж байна...
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Бүтэн нэр
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.fullName ?? ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="Нэрээ оруулна уу"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">
              Имэйл
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
              Утас
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
                Сургууль
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
                value={profile.school ?? ""}
                onChange={(e) => handleChange("school", e.target.value)}
                placeholder="Сургуулийн нэр"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">
                Анги
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
              Танилцуулга
            </label>
            <textarea
              className="mt-1 min-h-[90px] w-full resize-none rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none transition focus:border-primary"
              value={profile.bio ?? ""}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Өөрийн товч танилцуулга..."
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Мэдээлэл зөв эсэхийг шалгаад хадгална уу.
            </span>
            <button
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
              onClick={handleSave}
            >
              Хадгалах
            </button>
          </div>
          {saved && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
              Профайл амжилттай хадгалагдлаа.
            </div>
          )}
        </div>
      </div>
      <div className={cardClass}>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Settings className="w-4 h-4" />
          Тохиргоо
        </h2>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <div>Авто хадгалалт: Асаалттай</div>
          <div>Шалгалтын сануулга: Асаалттай</div>
          <div>Төвлөрөх горим: Идэвхтэй</div>
        </div>
      </div>
    </section>
  );
}
