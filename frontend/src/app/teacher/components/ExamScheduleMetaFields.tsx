import { useState } from "react";
import { figmaTextareaClass } from "../styles";
import {
  classOptions,
  subjectOptions,
} from "./exam-schedule-constants";
import TeacherSelect from "./TeacherSelect";

type ExamScheduleMetaFieldsProps = {
  scheduleClassName: string;
  setScheduleClassName: (value: string) => void;
  scheduleSubjectName: string;
  setScheduleSubjectName: (value: string) => void;
  scheduleDescription: string;
  setScheduleDescription: (value: string) => void;
  scheduleLocationPolicy: "anywhere" | "school_only";
  setScheduleLocationPolicy: (value: "anywhere" | "school_only") => void;
  scheduleLocationLabel: string;
  setScheduleLocationLabel: (value: string) => void;
  scheduleLocationLatitude: string;
  setScheduleLocationLatitude: (value: string) => void;
  scheduleLocationLongitude: string;
  setScheduleLocationLongitude: (value: string) => void;
  scheduleAllowedRadiusMeters: number;
  setScheduleAllowedRadiusMeters: (value: number) => void;
};

export default function ExamScheduleMetaFields({
  scheduleClassName,
  setScheduleClassName,
  scheduleSubjectName,
  setScheduleSubjectName,
  scheduleDescription,
  setScheduleDescription,
  scheduleLocationPolicy,
  setScheduleLocationPolicy,
  scheduleLocationLabel,
  setScheduleLocationLabel,
  scheduleLocationLatitude,
  setScheduleLocationLatitude,
  scheduleLocationLongitude,
  setScheduleLocationLongitude,
  scheduleAllowedRadiusMeters,
  setScheduleAllowedRadiusMeters,
}: ExamScheduleMetaFieldsProps) {
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [showLocationPermissionModal, setShowLocationPermissionModal] =
    useState(false);
  const [locationStatus, setLocationStatus] = useState<{
    tone: "idle" | "success" | "error";
    message: string;
  }>({
    tone: "idle",
    message: "",
  });
  const selectedClasses = scheduleClassName
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const availableClasses = classOptions.filter(
    (item) => !selectedClasses.includes(item),
  );

  const addClass = (value: string) => {
    if (!value || selectedClasses.includes(value)) return;
    setScheduleClassName([...selectedClasses, value].join(", "));
  };

  const removeClass = (value: string) => {
    setScheduleClassName(
      selectedClasses.filter((item) => item !== value).join(", "),
    );
  };

  const captureCurrentLocation = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (!window.isSecureContext && !isLocalhost) {
      setLocationStatus({
        tone: "error",
        message:
          "Байршил авахын тулд сайт HTTPS дээр эсвэл localhost орчинд нээгдсэн байх хэрэгтэй.",
      });
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus({
        tone: "error",
        message: "Таны браузер байршил авах боломжийг дэмжихгүй байна.",
      });
      return;
    }

    const readPosition = (options?: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    setCapturingLocation(true);
    setLocationStatus({ tone: "idle", message: "" });

    try {
      const permissionState =
        "permissions" in navigator
          ? await navigator.permissions
              .query({ name: "geolocation" as PermissionName })
              .then((result) => result.state)
              .catch(() => null)
          : null;

      if (permissionState === "denied") {
        setLocationStatus({
          tone: "error",
          message:
            "Байршлын зөвшөөрөл хаалттай байна. Browser-ийн permission-оо зөвшөөрөөд дахин оролдоно уу.",
        });
        return;
      }

      let position: GeolocationPosition;

      try {
        position = await readPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      } catch {
        position = await readPosition({
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000,
        });
      }

      setScheduleLocationLatitude(position.coords.latitude.toFixed(6));
      setScheduleLocationLongitude(position.coords.longitude.toFixed(6));

      if (!scheduleLocationLabel.trim()) {
        setScheduleLocationLabel("Сургууль");
      }

      const accuracy = Math.round(position.coords.accuracy || 0);
      setLocationStatus({
        tone: "success",
        message:
          accuracy > 0
            ? `Байршил амжилттай авлаа. Нарийвчлал ойролцоогоор ${accuracy}м байна.`
            : "Байршил амжилттай авлаа.",
      });
    } catch (error) {
      const geoError = error as GeolocationPositionError | undefined;
      const message =
        geoError?.code === 1
          ? "Байршлын зөвшөөрөл өгөөгүй байна. Зөвшөөрөөд дахин оролдоно уу."
          : geoError?.code === 2
            ? "Байршлыг тодорхойлж чадсангүй. Wi‑Fi/GPS-ээ шалгаад дахин оролдоно уу."
            : geoError?.code === 3
              ? "Байршил авах хугацаа дууслаа. Сүлжээ эсвэл байршлын үйлчилгээний тохиргоогоо шалгана уу."
              : "Байршил авах үед алдаа гарлаа. Дахин оролдоно уу.";

      setLocationStatus({
        tone: "error",
        message,
      });
    } finally {
      setCapturingLocation(false);
    }
  };

  return (
    <>
      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Анги</span>
        <div className="grid gap-2">
          <div className="text-[12px] text-[#8a8f98]">
            Жишээ: 9А, 8Б заавал судлах
          </div>
          {selectedClasses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedClasses.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => removeClass(item)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d9dee8] bg-[#f3f5f9] px-3 py-1 text-[12px] font-medium text-[#515761] transition hover:bg-[#e9edf4]"
                >
                  <span>{item}</span>
                  <span className="text-[13px] leading-none text-[#7c8493]">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}
          <TeacherSelect
            options={[
              { value: "", label: "Анги сонгоно уу." },
              ...availableClasses.map((item) => ({ value: item, label: item })),
            ]}
            value=""
            onChange={(event) => addClass(event.target.value)}
          />
        </div>
      </label>

      <TeacherSelect
        label="Хичээл"
        options={[
          { value: "", label: "Хичээл сонгоно уу." },
          ...subjectOptions.map((item) => ({ value: item, label: item })),
        ]}
          value={scheduleSubjectName}
          onChange={(event) => setScheduleSubjectName(event.target.value)}
      />

      <label className="grid gap-3">
        <span className="text-[16px] font-semibold text-black">Тайлбар</span>
        <textarea
          className={figmaTextareaClass}
          placeholder="Хичээлтэй холбоотой тайлбар болон шалгалтын чиглэлийг энд бичнэ үү."
          value={scheduleDescription}
          onChange={(event) => setScheduleDescription(event.target.value)}
        />
      </label>

      <div className="grid gap-3 rounded-[22px] border border-[#e5ebf3] bg-[#fbfcff] p-4">
        <TeacherSelect
          label="Байршлын нөхцөл"
          helperText="Сургуулийн дотор өгөх шалгалт бол байршлын шалгалтыг идэвхжүүлнэ."
          options={[
            { value: "anywhere", label: "Хаанаас ч өгч болно" },
            { value: "school_only", label: "Зөвхөн сургуулийн бүсээс өгнө" },
          ]}
          value={scheduleLocationPolicy}
          onChange={(event) => {
            const nextPolicy =
              event.target.value === "school_only" ? "school_only" : "anywhere";
            setScheduleLocationPolicy(nextPolicy);

            if (
              nextPolicy === "school_only" &&
              !scheduleLocationLatitude.trim() &&
              !scheduleLocationLongitude.trim()
            ) {
              setLocationStatus({
                tone: "idle",
                message:
                  "Байршлын зөвшөөрлийг өгвөл сургуулийн байршлыг автоматаар бөглөнө.",
              });
              setShowLocationPermissionModal(true);
            }
          }}
        />

        {scheduleLocationPolicy === "school_only" && (
          <div className="grid gap-3">
            <label className="grid gap-2">
              <span className="text-[14px] font-medium text-slate-900">
                Байршлын нэр
              </span>
              <input
                value={scheduleLocationLabel}
                onChange={(event) => setScheduleLocationLabel(event.target.value)}
                className="min-h-[48px] rounded-2xl border border-[#d5dfeb] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                placeholder="Жишээ: PineQuest сургууль"
              />
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[14px] font-medium text-slate-900">
                  Өргөрөг
                </span>
                <input
                  value={scheduleLocationLatitude}
                  onChange={(event) => setScheduleLocationLatitude(event.target.value)}
                  className="min-h-[48px] rounded-2xl border border-[#d5dfeb] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="47.918873"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[14px] font-medium text-slate-900">
                  Уртраг
                </span>
                <input
                  value={scheduleLocationLongitude}
                  onChange={(event) => setScheduleLocationLongitude(event.target.value)}
                  className="min-h-[48px] rounded-2xl border border-[#d5dfeb] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                  placeholder="106.917701"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <label className="grid gap-2">
                <span className="text-[14px] font-medium text-slate-900">
                  Зөвшөөрөх радиус
                </span>
                <input
                  type="number"
                  min={100}
                  max={10000}
                  step={100}
                  value={scheduleAllowedRadiusMeters}
                  onChange={(event) =>
                    setScheduleAllowedRadiusMeters(
                      Math.max(100, Number(event.target.value) || 3000),
                    )
                  }
                  className="min-h-[48px] rounded-2xl border border-[#d5dfeb] bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
                />
              </label>
              <button
                type="button"
                onClick={captureCurrentLocation}
                disabled={capturingLocation}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-[#d5dfeb] bg-white px-4 text-sm font-medium text-[#2563eb] transition hover:bg-[#f8fbff] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {capturingLocation ? "Байршил авч байна..." : "Одоогийн байршлыг авах"}
              </button>
            </div>

            {locationStatus.message ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-[13px] leading-6 ${
                  locationStatus.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : locationStatus.tone === "error"
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-[#e5ebf3] bg-white text-slate-500"
                }`}
              >
                {locationStatus.message}
              </div>
            ) : null}

            <p className="text-[12px] leading-5 text-slate-500">
              Сурагч энэ байршлаас {Math.round(scheduleAllowedRadiusMeters / 1000)} км дотор байвал шалгалтад нэвтэрнэ.
            </p>
          </div>
        )}
      </div>

      {showLocationPermissionModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/28 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-[#dbe5f2] bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <span className="text-[20px] font-semibold text-slate-950">
                  Байршлын зөвшөөрөл хэрэгтэй
                </span>
                <p className="text-[14px] leading-6 text-slate-600">
                  Энэ шалгалтыг зөвхөн сургуулийн бүсээс өгөхөөр тохируулж байна.
                  Үргэлжлүүлэхэд browser таны байршлын зөвшөөрлийг асууна.
                </p>
              </div>

              <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-[13px] leading-6 text-[#315ea8]">
                Зөвшөөрсний дараа өргөрөг, уртраг автоматаар бөглөгдөнө.
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowLocationPermissionModal(false)}
                  className="rounded-2xl border border-[#d5dfeb] bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Дараа нь
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowLocationPermissionModal(false);
                    await captureCurrentLocation();
                  }}
                  className="rounded-2xl bg-[#2563eb] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d4ed8]"
                >
                  Үргэлжлүүлэх
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
