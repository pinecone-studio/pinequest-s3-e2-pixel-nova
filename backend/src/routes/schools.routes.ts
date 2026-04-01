import { Hono } from "hono";

const router = new Hono();

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type SchoolOption = {
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  source: "overpass";
};

const UB_BOUNDS = {
  south: 47.75,
  west: 106.65,
  north: 48.08,
  east: 107.2,
};

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const buildOverpassQuery = () => `
[out:json][timeout:35];
(
  node["amenity"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
  way["amenity"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
  relation["amenity"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
  node["building"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
  way["building"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
  relation["building"="school"]["name"](${UB_BOUNDS.south},${UB_BOUNDS.west},${UB_BOUNDS.north},${UB_BOUNDS.east});
);
out center;
`;

const normalizeSchool = (element: OverpassElement): SchoolOption | null => {
  const rawLatitude = element.lat ?? element.center?.lat;
  const rawLongitude = element.lon ?? element.center?.lon;

  if (typeof rawLatitude !== "number" || typeof rawLongitude !== "number") {
    return null;
  }

  const label = element.tags?.name?.trim();

  if (!label || !Number.isFinite(rawLatitude) || !Number.isFinite(rawLongitude)) {
    return null;
  }

  return {
    label,
    latitude: rawLatitude,
    longitude: rawLongitude,
    radiusMeters: 1500,
    source: "overpass",
  };
};

const dedupeSchools = (schools: SchoolOption[]) => {
  const seen = new Set<string>();

  return schools.filter((school) => {
    const key = `${school.label.toLowerCase()}-${school.latitude.toFixed(4)}-${school.longitude.toFixed(4)}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const fetchFromOverpass = async (endpoint: string) => {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "application/json",
    },
    body: buildOverpassQuery(),
  });

  if (!response.ok) {
    throw new Error(`overpass_${response.status}`);
  }

  const payload = (await response.json()) as { elements?: OverpassElement[] };
  const schools = dedupeSchools(
    (payload.elements ?? [])
      .map(normalizeSchool)
      .filter((school): school is SchoolOption => school !== null),
  ).sort((a, b) => a.label.localeCompare(b.label, "mn"));

  if (schools.length === 0) {
    throw new Error("overpass_empty");
  }

  return schools;
};

router.get("/ub", async (c) => {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const schools = await fetchFromOverpass(endpoint);
      return c.json({
        success: true,
        data: schools,
        source: endpoint,
      });
    } catch {
      // Try the next mirror quietly so the client can keep a clean UX.
    }
  }

  return c.json(
    {
      success: false,
      message:
        "Улаанбаатарын сургуулиудын онлайн жагсаалтыг түр татаж чадсангүй.",
      data: [],
    },
    503,
  );
});

export default router;
