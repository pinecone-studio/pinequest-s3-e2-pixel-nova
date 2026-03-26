import { useCallback, useEffect, useState } from "react";
import { getSessionUser } from "@/lib/examGuard";
import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfile,
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
  const [profile, setProfile] = useState<StudentProfile>(
    defaultProfile(username),
  );
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const remote = await getStudentProfile(getSessionUser());
        if (!active) return;
        setProfile({
          ...defaultProfile(username),
          ...remote,
          fullName: remote.fullName || username,
        });
      } catch {
        if (!active) return;
        setProfile(defaultProfile(username));
        setError("Профайл ачаалах үед алдаа гарлаа.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadProfile();
    setSaved(false);
    return () => {
      active = false;
    };
  }, [userId, username]);

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
      setLoading(true);
      const savedProfile = await updateStudentProfile(
        nextProfile,
        getSessionUser(),
      );
      setProfile({ ...defaultProfile(username), ...savedProfile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Профайл хадгалах үед алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  }, [profile, userId, username]);

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
