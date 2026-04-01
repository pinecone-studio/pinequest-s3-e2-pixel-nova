"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";

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

type SchoolOption = {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
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

export default function TeacherLocationPickerMap({
  schools,
  selectedLabel,
  selectedLatitude,
  selectedLongitude,
  selectedRadiusMeters,
  onSelectSchool,
}: TeacherLocationPickerMapProps) {
  const [query, setQuery] = useState("");

  const filteredSchools = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return schools;
    return schools.filter((school) =>
      school.label.toLowerCase().includes(normalizedQuery),
    );
  }, [query, schools]);

  const selectedLat = Number(selectedLatitude);
  const selectedLng = Number(selectedLongitude);
  const hasSelection =
    Number.isFinite(selectedLat) && Number.isFinite(selectedLng);
  const center: [number, number] = hasSelection
    ? [selectedLat, selectedLng]
    : UB_CENTER;

  return (
    <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1.28fr)_minmax(340px,0.92fr)]">
      <section className="overflow-hidden rounded-[28px] border border-[#dbe5f2] bg-white shadow-[0_20px_50px_rgba(54,73,109,0.07)]">
        <div className="border-b border-[#edf2fb] px-5 py-4">
          <div className="text-[15px] font-semibold text-slate-900">
            Улаанбаатар дотор сургуулиа газрын зургаас сонгох
          </div>
          <div className="mt-1 text-[13px] leading-6 text-slate-500">
            Автоматаар байршил авч чадахгүй үед хамгийн ойр сургуулиа хайж
            сонгоод байршлын мэдээллээ шууд бөглөж болно.
          </div>
        </div>
        <div className="h-[420px]">
          <MapContainer
            key={`${center[0]}-${center[1]}-${selectedRadiusMeters}`}
            center={center}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {schools.map((school) => {
              const selected = school.label === selectedLabel;
              return (
                <CircleMarker
                  key={school.label}
                  center={[school.latitude, school.longitude]}
                  radius={selected ? 10 : 7}
                  pathOptions={{
                    color: selected ? "#2563eb" : "#64748b",
                    fillColor: selected ? "#2563eb" : "#cbd5e1",
                    fillOpacity: selected ? 0.9 : 0.75,
                    weight: selected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => onSelectSchool(school),
                  }}
                >
                  <Popup>{school.label}</Popup>
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
        <div className="text-[15px] font-semibold text-slate-900">
          Сургуулийн хайлт
        </div>
        <div className="mt-1 text-[13px] leading-6 text-slate-500">
          Сургуулийн нэрээр хайгаад сонгоход өргөрөг, уртраг, радиус нь бэлэн
          орж ирнэ.
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-[18px] border border-[#d5dfeb] bg-[#fbfcff] px-3.5 py-3.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Сургуулийн нэрээр хайх"
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-soft min-h-[280px]">
          {filteredSchools.map((school) => {
            const selected = school.label === selectedLabel;
            return (
              <button
                key={school.label}
                type="button"
                onClick={() => onSelectSchool(school)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-[#bfdbfe] bg-[#eff6ff]"
                    : "border-[#e5ebf3] bg-[#fbfcff] hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin
                    className={`h-4 w-4 ${
                      selected ? "text-[#2563eb]" : "text-slate-400"
                    }`}
                  />
                  <div className="text-sm font-semibold text-slate-900">
                    {school.label}
                  </div>
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

          {filteredSchools.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d5dfeb] bg-[#fbfcff] px-4 py-5 text-sm text-slate-500">
              Илэрц олдсонгүй. Хайлтын үгээ өөрчлөөд үзээрэй.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
