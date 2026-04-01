"use client";

import { API_BASE_URL } from "@/api/client";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false },
);

type SchoolOption = {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  source?: "fallback" | "overpass";
};

type TeacherLocationPickerMapProps = {
  schools: readonly SchoolOption[];
  selectedLabel: string;
  selectedLatitude: string;
  selectedLongitude: string;
  selectedRadiusMeters: number;
  onSelectSchool: (school: SchoolOption) => void;
};

const UB_CENTER: [number, number] = [47.9185, 106.9177];
const LABEL_VISIBILITY_LIMIT = 18;

const dedupeSchools = (schools: SchoolOption[]) => {
  const seen = new Set<string>();
  return schools.filter((school) => {
    const key = `${school.label.toLowerCase()}-${school.latitude.toFixed(5)}-${school.longitude.toFixed(5)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function TeacherLocationPickerMap({
  schools,
  selectedLabel,
  selectedLatitude,
  selectedLongitude,
  selectedRadiusMeters,
  onSelectSchool,
}: TeacherLocationPickerMapProps) {
  const [query, setQuery] = useState("");
  const [remoteSchools, setRemoteSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSchools = async () => {
      setLoadingSchools(true);
      setLoadError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/api/schools/ub`, {
          method: "GET",
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          success: boolean;
          data?: SchoolOption[];
          message?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "fetch_failed");
        }

        if (!cancelled) {
          setRemoteSchools(payload.data ?? []);
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            "Улаанбаатарын сургуулиудын онлайн жагсаалт түр ачаалсангүй. Одоогоор бэлэн жагсаалтаар үргэлжлүүлж байна.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSchools(false);
        }
      }
    };

    void loadSchools();

    return () => {
      cancelled = true;
    };
  }, []);

  const allSchools = useMemo(() => {
    const merged = [
      ...remoteSchools,
      ...schools.map((item) => ({ ...item, source: "fallback" as const })),
    ];
    return dedupeSchools(merged).sort((a, b) =>
      a.label.localeCompare(b.label, "mn"),
    );
  }, [remoteSchools, schools]);

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return allSchools;
    return allSchools.filter((school) =>
      school.label.toLowerCase().includes(normalizedQuery),
    );
  }, [query, allSchools]);

  const selectedLat = Number(selectedLatitude);
  const selectedLng = Number(selectedLongitude);
  const hasSelection =
    Number.isFinite(selectedLat) && Number.isFinite(selectedLng);
  const center: [number, number] = hasSelection
    ? [selectedLat, selectedLng]
    : UB_CENTER;
  const visibleTooltipSchools = filteredSchools.slice(
    0,
    query.trim() ? LABEL_VISIBILITY_LIMIT : 8,
  );

  return (
    <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(290px,0.92fr)]">
      <section className="overflow-hidden rounded-[28px] border border-[#dbe5f2] bg-white shadow-[0_20px_50px_rgba(54,73,109,0.07)]">
        <div className="border-b border-[#edf2fb] px-5 py-4">
          <div className="text-[15px] font-semibold text-slate-900">
            Улаанбаатар хотын сургуулийг газрын зургаас сонгох
          </div>
          <div className="mt-1 text-[13px] leading-6 text-slate-500">
            Газрын зураг дээр marker дээр дарж эсвэл хайлтаар сургуулиа олж шууд
            сонгож болно.
          </div>
        </div>
        <div className="relative h-[420px] overflow-hidden bg-[#eaf2ff]">
          <MapContainer
            key={`${center[0]}-${center[1]}-${selectedRadiusMeters}-${filteredSchools.length}`}
            center={center}
            zoom={12}
            scrollWheelZoom={true}
            className="location-picker-map h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              subdomains="abcd"
              detectRetina
            />
            {filteredSchools.map((school) => {
              const selected = school.label === selectedLabel;
              const showTooltip =
                selected ||
                visibleTooltipSchools.some(
                  (item) => item.label === school.label,
                );

              return (
                <CircleMarker
                  key={`${school.label}-${school.latitude}-${school.longitude}`}
                  center={[school.latitude, school.longitude]}
                  radius={selected ? 10 : 7}
                  pathOptions={{
                    color: selected
                      ? "#2563eb"
                      : school.source === "overpass"
                        ? "#0f766e"
                        : "#64748b",
                    fillColor: selected
                      ? "#2563eb"
                      : school.source === "overpass"
                        ? "#14b8a6"
                        : "#cbd5e1",
                    fillOpacity: selected ? 0.95 : 0.8,
                    weight: selected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectSchool(school),
                  }}
                >
                  {showTooltip ? (
                    <Tooltip
                      direction="top"
                      offset={[0, -8]}
                      opacity={1}
                      permanent={selected || Boolean(query.trim())}
                      sticky={!selected}
                      className={
                        selected
                          ? "school-map-tooltip selected"
                          : "school-map-tooltip"
                      }
                    >
                      {school.label}
                    </Tooltip>
                  ) : null}
                  <Popup>
                    <div className="text-sm font-medium">{school.label}</div>
                  </Popup>
                </CircleMarker>
              );
            })}
            {hasSelection ? (
              <Circle
                center={center}
                radius={selectedRadiusMeters}
                pathOptions={{
                  color: "#2563eb",
                  fillColor: "#93c5fd",
                  fillOpacity: 0.14,
                  weight: 2,
                }}
              />
            ) : null}
          </MapContainer>
        </div>
      </section>

      <section className="flex h-full flex-col rounded-[28px] border border-[#dbe5f2] bg-white p-5 shadow-[0_20px_50px_rgba(54,73,109,0.07)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[15px] font-semibold text-slate-900">
              Сургуулийн хайлт
            </div>
            <div className="mt-1 text-[13px] leading-6 text-slate-500">
              Нэрээр нь хайж сонгоход өргөрөг, уртраг, радиус автоматаар
              бөглөгдөнө.
            </div>
          </div>
          <div className="rounded-full border border-[#dbe5f2] bg-[#f8fbff] px-3 py-1 text-xs font-semibold text-slate-500">
            {allSchools.length} сургууль
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-[#d5dfeb] bg-[#fbfcff] px-3.5 py-3.5">
          {loadingSchools ? (
            <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />
          ) : (
            <Search className="h-4 w-4 text-slate-400" />
          )}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Сургуулийн нэрээр хайх"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        {loadError ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {loadError}
          </div>
        ) : null}

        {!loadError && remoteSchools.length > 0 ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Улаанбаатарын сургуулиудын онлайн жагсаалт амжилттай ачааллаа.
          </div>
        ) : null}

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-soft min-h-[280px]">
          {filteredSchools.map((school) => {
            const selected = school.label === selectedLabel;
            return (
              <button
                key={`${school.label}-${school.latitude}-${school.longitude}`}
                type="button"
                onClick={() => onSelectSchool(school)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#bfdbfe] bg-[#eff6ff]"
                    : "border-[#e5ebf3] bg-[#fbfcff] hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin
                      className={`h-4 w-4 shrink-0 ${
                        selected
                          ? "text-[#2563eb]"
                          : school.source === "overpass"
                            ? "text-[#0f766e]"
                            : "text-slate-400"
                      }`}
                    />
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {school.label}
                    </div>
                  </div>
                  {school.source === "overpass" ? (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Live
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {school.latitude.toFixed(4)}, {school.longitude.toFixed(4)} ·{" "}
                  {school.radiusMeters >= 1000
                    ? `${school.radiusMeters / 1000} км`
                    : `${school.radiusMeters} м`}
                </div>
              </button>
            );
          })}

          {!loadingSchools && filteredSchools.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d5dfeb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-500">
              Илэрц олдсонгүй. Хайлтын үгээ өөрчлөөд үзээрэй.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
