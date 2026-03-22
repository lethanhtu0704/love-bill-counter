// Firestore collection names
export const COLLECTIONS = {
  SETTINGS: "settings",
  BILLS: "bills",
  LOVE_COUNTER: "love_counter",
  MILESTONES: "milestones",
  MEAL_PLANNER: "meal_planner",
} as const;

// Firestore document IDs
export const DOCS = {
  RATES: "rates",
  LOVE_CONFIG: "config",
} as const;

// Default rates (used only for initial Firestore seeding)
export const DEFAULT_RATES = {
  electricPrice: 3500,
  waterPrice: 25000,
  baseRent: 2500000,
  wifiPrice: 50000,
  garbagePrice: 50000,
};

// Default love counter start date
export const DEFAULT_START_DATE = new Date("2024-09-01T00:00:00");

// Charm images (1..16)
export const CHARM_IMAGES = Array.from(
  { length: 16 },
  (_, i) => `/assets/charm${i + 1}.png`
);

// Time format options for love counter
export const TIME_FORMATS = [
  { value: "full", label: "Năm, Tháng, Ngày, Giờ" },
  { value: "days", label: "Theo số ngày" },
  { value: "months-days", label: "Theo tháng & ngày" },
] as const;

export type TimeFormat = (typeof TIME_FORMATS)[number]["value"];
