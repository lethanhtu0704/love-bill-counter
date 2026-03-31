import {
  ref,
  get,
  child,
  push,
  update,
  remove,
  set,
} from "firebase/database";
import { db } from "./firebase";
import { COLLECTIONS, DOCS, DEFAULT_RATES, DEFAULT_START_DATE } from "./constants";
import type {
  LoveConfig,
  Milestone,
  Rates,
  Bill,
  BillFormData,
  RatesFormData,
  DayMeals,
  WeekMeals,
  IngredientList,
  IngredientCache,
  Song,
} from "./types";

// Helper to convert File to Base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// ===== Love Counter Services =====

export async function getLoveConfig(): Promise<LoveConfig> {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `${COLLECTIONS.LOVE_COUNTER}/${DOCS.LOVE_CONFIG}`));

  if (snapshot.exists()) {
    return snapshot.val() as LoveConfig;
  }

  // Create default config
  const defaultConfig: LoveConfig = {
    startDate: DEFAULT_START_DATE.getTime(),
  };
  await set(child(dbRef, `${COLLECTIONS.LOVE_COUNTER}/${DOCS.LOVE_CONFIG}`), defaultConfig);
  return defaultConfig;
}

export async function updateLoveConfig(startDate: Date): Promise<void> {
  const updates: Record<string, number> = {
    [`/${COLLECTIONS.LOVE_COUNTER}/${DOCS.LOVE_CONFIG}/startDate`]: startDate.getTime(),
  };
  await update(ref(db), updates);
}

// ===== Milestone Services =====

export async function getMilestones(): Promise<Milestone[]> {
  const dbRef = ref(db, COLLECTIONS.MILESTONES);
  const snapshot = await get(dbRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const milestones: Milestone[] = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
    return milestones.sort((a, b) => a.order - b.order);
  }
  return [];
}

export async function addMilestone(
  data: Omit<Milestone, "id" | "createdAt">
): Promise<string> {
  const newItemRef = push(child(ref(db), COLLECTIONS.MILESTONES));
  const newMilestone = {
    ...data,
    createdAt: Date.now(),
  };
  await set(newItemRef, newMilestone);
  return newItemRef.key as string;
}

export async function updateMilestone(
  id: string,
  data: Partial<Milestone>
): Promise<void> {
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    updates[`/${COLLECTIONS.MILESTONES}/${id}/${key}`] = value;
  }
  await update(ref(db), updates);
}

export async function deleteMilestone(id: string): Promise<void> {
  await remove(ref(db, `${COLLECTIONS.MILESTONES}/${id}`));
}

export async function uploadMilestoneImage(
  file: File,
  milestoneId: string
): Promise<string> {
  // Convert explicitly to Base64 string for storage in RTDB per user request
  return await fileToBase64(file);
}

// ===== Rates Services =====

export async function getRates(): Promise<Rates> {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `${COLLECTIONS.SETTINGS}/${DOCS.RATES}`));

  if (snapshot.exists()) {
    return snapshot.val() as Rates;
  }

  // Seed default rates
  await set(child(dbRef, `${COLLECTIONS.SETTINGS}/${DOCS.RATES}`), DEFAULT_RATES);
  return DEFAULT_RATES;
}

export async function updateRates(data: RatesFormData): Promise<void> {
  const updates: Record<string, RatesFormData> = {
    [`/${COLLECTIONS.SETTINGS}/${DOCS.RATES}`]: data,
  };
  await update(ref(db), updates);
}

// ===== Bills Services =====

export async function getBills(): Promise<Bill[]> {
  const dbRef = ref(db, COLLECTIONS.BILLS);
  const snapshot = await get(dbRef);
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const bills: Bill[] = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
    // Sort descending by year then month
    return bills.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });
  }
  return [];
}

export async function getBillById(id: string): Promise<Bill | null> {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `${COLLECTIONS.BILLS}/${id}`));
  if (snapshot.exists()) {
    return { id: snapshot.key, ...snapshot.val() } as Bill;
  }
  return null;
}

export async function getLatestBill(): Promise<Bill | null> {
  const bills = await getBills(); // Reuse getBills which sorts by newest
  return bills.length > 0 ? bills[0] : null;
}

export async function createBill(formData: BillFormData): Promise<string> {
  const rates = await getRates();

  const electricUsage = formData.currentElectric - formData.previousElectric;
  const waterUsage = formData.currentWater - formData.previousWater;
  const electricTotal = electricUsage * rates.electricPrice;
  const waterTotal = waterUsage * rates.waterPrice;
  const totalAmount =
    rates.baseRent + electricTotal + waterTotal + rates.wifiPrice + rates.garbagePrice;

  const bill: Omit<Bill, "id"> = {
    month: formData.month,
    year: formData.year,
    billDate: new Date(formData.billDate).getTime(),
    currentElectric: formData.currentElectric,
    previousElectric: formData.previousElectric,
    currentWater: formData.currentWater,
    previousWater: formData.previousWater,
    electricUsage,
    waterUsage,
    electricPrice: rates.electricPrice,
    waterPrice: rates.waterPrice,
    baseRent: rates.baseRent,
    wifiPrice: rates.wifiPrice,
    garbagePrice: rates.garbagePrice,
    electricTotal,
    waterTotal,
    totalAmount,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const newItemRef = push(child(ref(db), COLLECTIONS.BILLS));
  await set(newItemRef, bill);
  return newItemRef.key as string;
}

export async function updateBill(
  id: string,
  formData: BillFormData
): Promise<void> {
  // Re-fetch the bill to get stored rates
  const existingBill = await getBillById(id);
  if (!existingBill) throw new Error("Bill not found");

  const electricUsage = formData.currentElectric - formData.previousElectric;
  const waterUsage = formData.currentWater - formData.previousWater;
  
  // Use STORED rates from the existing bill, avoiding recalculation with current rates
  const electricTotal = electricUsage * existingBill.electricPrice;
  const waterTotal = waterUsage * existingBill.waterPrice;
  
  const totalAmount =
    existingBill.baseRent +
    electricTotal +
    waterTotal +
    existingBill.wifiPrice +
    existingBill.garbagePrice;

  const updatedData: Record<string, unknown> = {
    month: formData.month,
    year: formData.year,
    billDate: new Date(formData.billDate).getTime(),
    currentElectric: formData.currentElectric,
    previousElectric: formData.previousElectric,
    currentWater: formData.currentWater,
    previousWater: formData.previousWater,
    electricUsage,
    waterUsage,
    electricTotal,
    waterTotal,
    totalAmount,
    updatedAt: Date.now(),
  };

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updatedData)) {
    updates[`/${COLLECTIONS.BILLS}/${id}/${key}`] = value;
  }

  await update(ref(db), updates);
}

export async function deleteBill(id: string): Promise<void> {
  await remove(ref(db, `${COLLECTIONS.BILLS}/${id}`));
}

// ===== Meal Planner Services =====

export async function getMealsForWeek(weekKey: string): Promise<WeekMeals> {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `${COLLECTIONS.MEAL_PLANNER}/${weekKey}`));

  if (snapshot.exists()) {
    return snapshot.val() as WeekMeals;
  }

  return {};
}

export async function upsertDayMeals(
  weekKey: string,
  dayKey: string,
  meals: DayMeals
): Promise<void> {
  await set(ref(db, `${COLLECTIONS.MEAL_PLANNER}/${weekKey}/${dayKey}`), meals);
}

export async function getIngredientsCache(weekKey: string): Promise<IngredientCache | null> {
  const snapshot = await get(child(ref(db), `${COLLECTIONS.MEAL_PLANNER_INGREDIENTS}/${weekKey}`));
  if (snapshot.exists()) {
    return snapshot.val() as IngredientCache;
  }
  return null;
}

export async function saveIngredientsCache(
  weekKey: string,
  data: IngredientList,
  mealsHash: string
): Promise<void> {
  await set(ref(db, `${COLLECTIONS.MEAL_PLANNER_INGREDIENTS}/${weekKey}`), { data, mealsHash });
}

// ===== Music Player Services =====

export async function getSongs(): Promise<Song[]> {
  const snapshot = await get(child(ref(db), COLLECTIONS.MUSIC));
  if (!snapshot.exists()) return [];
  const raw = snapshot.val();
  // Firebase may return an array (numeric keys) or object
  if (Array.isArray(raw)) {
    return raw
      .map((song, i) => song ? { id: String(i), ...song } as Song : null)
      .filter((s): s is Song => s !== null);
  }
  const data = raw as Record<string, Omit<Song, "id">>;
  return Object.entries(data).map(([id, song]) => ({ id, ...song }));
}
