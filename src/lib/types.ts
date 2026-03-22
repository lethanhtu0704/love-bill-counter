// ===== Love Counter Types =====

export interface LoveConfig {
  startDate: number; // timestamp
}

export interface Milestone {
  id: string;
  title: string;
  content: string;
  date: number; // timestamp
  imageUrl: string; // Base64 or URL
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
