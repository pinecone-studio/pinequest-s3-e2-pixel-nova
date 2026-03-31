export const examTypes = [
  { value: "progress", label: "Явцын шалгалт" },
  { value: "term", label: "Улирлын шалгалт" },
] as const;

export const classOptions = [
  "6А",
  "6Б",
  "6В",
  "7А",
  "7Б",
  "7В",
  "8А",
  "8Б",
  "8В",
  "8Б заавал судлах",
  "8В сонгон судлах",
  "9А",
  "9Б",
  "9В",
  "9А заавал судлах",
  "9Б сонгон судлах",
  "10А",
  "10Б",
  "10В",
  "10А заавал судлах",
  "10Б сонгон судлах",
  "11А",
  "11Б",
  "11В",
  "11А заавал судлах",
  "11Б сонгон судлах",
  "12А",
  "12Б",
  "12В",
  "12А заавал судлах",
  "12Б сонгон судлах",
];

export const subjectOptions = [
  "Англи хэл",
  "Математик",
  "Монгол хэл",
  "Физик",
  "Хими",
  "Түүх",
];

export const minuteOptions = ["15", "30", "45", "60", "90"];
export const secondOptions = ["00", "15", "30", "45"];
export const groupOptions = ["А", "Б", "В", "Г"];

export const ubSchoolOptions = [
  { label: "Pinecone сургууль", latitude: 47.918873, longitude: 106.917701, radiusMeters: 3000 },
  { label: "Шинэ Монгол сургууль", latitude: 47.9199, longitude: 106.9172, radiusMeters: 2000 },
  { label: "Орчлон сургууль", latitude: 47.9226, longitude: 106.8948, radiusMeters: 2000 },
  { label: "Сант сургууль", latitude: 47.9148, longitude: 106.9054, radiusMeters: 1500 },
  { label: "Хобби сургууль", latitude: 47.9127, longitude: 106.8838, radiusMeters: 1500 },
  { label: "Монгол Тэмүүлэл сургууль", latitude: 47.9282, longitude: 106.9694, radiusMeters: 2500 },
  { label: "Бритиш сургууль", latitude: 47.9144, longitude: 106.9348, radiusMeters: 1500 },
  { label: "Эрдмийн Ундраа цогцолбор сургууль", latitude: 47.9236, longitude: 106.8865, radiusMeters: 2000 },
  { label: "1-р сургууль", latitude: 47.9221, longitude: 106.9121, radiusMeters: 1500 },
  { label: "23-р сургууль", latitude: 47.9214, longitude: 106.9005, radiusMeters: 1500 },
] as const;
