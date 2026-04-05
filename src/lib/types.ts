// ===== Love Counter Types =====

export interface LoveConfig {
  startDate: number; // timestamp
}

export interface Milestone {
  id: string;
  title: string;
  content: string;
  date: number; // timestamp
  imageUrl: string; // ImageKit CDN URL (legacy: may be empty string)
  charmImage: string;
  order: number;
  createdAt: number; // timestamp
}

// ===== Room Bill Types =====

export interface Rates {
  electricPrice: number;
  waterPrice: number;
  baseRent: number;
  wifiPrice: number;
  garbagePrice: number;
}

export interface Bill {
  id: string;
  month: number; // 1-12
  year: number;
  billDate: number; // timestamp
  currentElectric: number;
  previousElectric: number;
  currentWater: number;
  previousWater: number;
  electricUsage: number;
  waterUsage: number;
  electricPrice: number; // snapshot at creation time
  waterPrice: number; // snapshot at creation time
  baseRent: number; // snapshot at creation time
  wifiPrice: number; // snapshot at creation time
  garbagePrice: number; // snapshot at creation time
  electricTotal: number;
  waterTotal: number;
  totalAmount: number;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

// ===== Form Types =====

export interface BillFormData {
  month: number;
  year: number;
  billDate: string;
  currentElectric: number;
  previousElectric: number;
  currentWater: number;
  previousWater: number;
}

export interface RatesFormData {
  electricPrice: number;
  waterPrice: number;
  baseRent: number;
  wifiPrice: number;
  garbagePrice: number;
}

// ===== Meal Planner Types =====

export interface DayMeals {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
}

export type WeekMeals = Record<string, DayMeals>;

export interface IngredientList {
  meats_seafood?: string[];
  vegetables?: string[];
  carbs?: string[];
  others?: string[];
}

export interface IngredientCache {
  data: IngredientList;
  mealsHash: string;
}

// ===== Music Player Types =====

export interface Song {
  id: string;
  title: string;
  artist: string;
  imageUrl: string;
  audioUrl: string;
  duration: number; // seconds
}
