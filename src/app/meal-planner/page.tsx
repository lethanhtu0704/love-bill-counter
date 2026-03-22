"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { useSearchParams } from "next/navigation";

type DayMeals = {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
};

type WeekMeals = Record<string, DayMeals>;
type MealStorage = Record<string, WeekMeals>;

type DraftMeals = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

const STORAGE_KEY = "meal-planner-v1";

const fallbackMenus = [
  {
    breakfast: ["Không có dữ liệu"],
    lunch: ["Chicken Wrap", "Caesar Salad"],
    dinner: ["Tomato Pasta", "Garlic Bread"],   
  },
  {
    breakfast: ["Oatmeal & Banana", "Boiled Egg"],
    lunch: ["Rice Bowl", "Sauteed Vegetables"],
    dinner: ["Salmon Steak", "Mashed Potatoes"],
  },
  {
    breakfast: ["Granola with Milk", "Apple Slices"],
    lunch: ["Pho Bo", "Fresh Herbs"],
    dinner: ["Chicken Curry", "Steamed Rice"],
  },
  {
    breakfast: ["Pancakes", "Honey & Almonds"],
    lunch: ["Banh Mi", "Fruit Cup"],
    dinner: ["Beef Stir Fry", "Broccoli"],
  },
  {
    breakfast: ["Avocado Toast", "Orange Juice"],
    lunch: ["Soba Noodles", "Edamame"],
    dinner: ["Shrimp Fried Rice", "Kimchi"],
  },
  {
    breakfast: ["Croissant", "Cheese Omelet"],
    lunch: ["Bun Cha", "Pickled Veggies"],
    dinner: ["Mushroom Soup", "Grilled Chicken"],
  },
  {
    breakfast: ["Chia Pudding", "Mixed Nuts"],
    lunch: ["Quinoa Bowl", "Roasted Pumpkin"],
    dinner: ["BBQ Pork", "Green Salad"],
  },
] satisfies DayMeals[];

function normalizeList(text: string): string[] {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function toTextarea(items: string[]): string {
  return items.join("\n");
}

function getDefaultMealsByDate(date: Date): DayMeals {
  return fallbackMenus[date.getDay() === 0 ? 6 : date.getDay() - 1];
}

function getWeekDays(date: Date): Date[] {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export default function MealPlannerPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string>("");
  const [storage, setStorage] = useState<MealStorage>({});
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<DraftMeals>({
    breakfast: "",
    lunch: "",
    dinner: "",
  });

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekRangeText = `${format(weekDays[0], "MMM d")} - ${format(
    weekDays[6],
    "MMM d"
  )}`;
  const selectedWeekKey = format(weekDays[0], "yyyy-MM-dd");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as MealStorage;
      setStorage(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }, [storage]);

  useEffect(() => {
    const activeDateKey = format(selectedDate, "yyyy-MM-dd");
    setSelectedDayKey(activeDateKey);
  }, [selectedDate]);

  const selectedDayDate =
    weekDays.find((day) => format(day, "yyyy-MM-dd") === selectedDayKey) ||
    weekDays[0];

  const selectedMeals: DayMeals =
    storage[selectedWeekKey]?.[selectedDayKey] ||
    getDefaultMealsByDate(selectedDayDate);

  const openEditorWithCurrentMeals = useCallback(() => {
    setDraft({
      breakfast: toTextarea(selectedMeals.breakfast),
      lunch: toTextarea(selectedMeals.lunch),
      dinner: toTextarea(selectedMeals.dinner),
    });
    setIsEditing(true);
  }, [selectedMeals]);

  const handleOpenEditor = () => {
    if (isEditing) {
      const updatedMeals: DayMeals = {
        breakfast: normalizeList(draft.breakfast),
        lunch: normalizeList(draft.lunch),
        dinner: normalizeList(draft.dinner),
      };

      setStorage((prev) => ({
        ...prev,
        [selectedWeekKey]: {
          ...(prev[selectedWeekKey] || {}),
          [selectedDayKey]: updatedMeals,
        },
      }));

      setIsEditing(false);
      return;
    }

    openEditorWithCurrentMeals();
  };

  useEffect(() => {
    const quickAdd = searchParams.get("quickAdd") === "1";
    if (!quickAdd || isEditing) return;
    openEditorWithCurrentMeals();
  }, [searchParams, isEditing, openEditorWithCurrentMeals]);

  const handleDateChange = (value: string) => {
    if (!value) return;
    const next = new Date(`${value}T00:00:00`);
    setSelectedDate(next);
  };

  const mealBlocks: Array<{
    key: keyof DayMeals;
    title: string;
    emoji: string;
  }> = [
    { key: "breakfast", title: "Breakfast", emoji: "🍳" },
    { key: "lunch", title: "Lunch", emoji: "🥗" },
    { key: "dinner", title: "Dinner", emoji: "🍜" },
  ];

  return (
    <main className="min-h-screen bg-love-paper pb-28 px-4 pt-6 sm:px-6">
      
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-love-brown font-[family-name:var(--font-playfair)]">
              Thực đơn giảm cân 🥗
            </h1>
            <p className="text-sm mt-2 text-love-dot/90">{weekRangeText}</p>
          </div>

          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-love-brown/20 bg-white px-3 py-2 text-sm font-medium text-love-brown shadow-sm">
              <input
                type="date"
                className="sr-only"
                value={format(selectedDate, "yyyy-MM-dd")}
                onChange={(event) => handleDateChange(event.target.value)}
              />
              <span>Chọn tuần</span>
            </label>

            <button
              type="button"
              onClick={handleOpenEditor}
              className="rounded-xl bg-love-pink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {isEditing ? "Lưu thực đơn" : "Cập nhật thực đơn"}
            </button>
          </div>
        </div>

        <div className="grid gap-4 grid-cols-[50px_1fr] sm:grid-cols-[170px_1fr]">
          <aside className="sm:p-2">
            <ul className="space-y-1">
              {weekDays.map((day) => {
                const dayKey = format(day, "yyyy-MM-dd");
                const isActive = dayKey === selectedDayKey;
                return (
                  <li key={dayKey}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDayKey(dayKey);
                        setIsEditing(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? "bg-love-pink shadow-sm text-white"
                          : "text-love-dot hover:bg-love-paper"
                      }`}
                    >
                    <span className="sm:hidden">
    {format(day, "EEE")}
  </span>

  {/* Hiển thị trên Desktop (Từ 640px trở lên) - Ví dụ: Monday */}
  <span className="hidden sm:block">
    {format(day, "EEEE")}
  </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="rounded-2xl border border-love-brown/15 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-bold text-love-pink">
              {format(selectedDayDate, "EEEE, MMM d")}
            </h2>

            {!isEditing && (
              <div className="space-y-3">
                {mealBlocks.map((block) => (
                  <article
                    key={block.key}
                    className="rounded-xl border border-love-brown/10 bg-love-paper/40 p-3"
                  >
                    <h3 className="mb-2 text-base font-semibold text-love-brown">
                      {block.emoji} {block.title}
                    </h3>
                    <ul className="space-y-1 text-sm text-love-dot">
                      {(selectedMeals[block.key].length
                        ? selectedMeals[block.key]
                        : ["No food yet"]).map((food, index) => (
                        <li key={`${food}-${index}`} className="flex items-start gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-love-pink/70" />
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            )}

            {isEditing && (
              <div className="space-y-3">
                {mealBlocks.map((block) => (
                  <article
                    key={block.key}
                    className="rounded-xl border border-love-brown/10 bg-love-paper/40 p-3"
                  >
                    <h3 className="mb-2 text-base font-semibold text-love-brown">
                      {block.emoji} {block.title}
                    </h3>
                    <textarea
                      rows={3}
                      value={draft[block.key]}
                      onChange={(event) =>
                        setDraft((prev) => ({
                          ...prev,
                          [block.key]: event.target.value,
                        }))
                      }
                      className="w-full resize-none rounded-lg border border-love-brown/20 bg-white px-3 py-2 text-sm text-love-dot outline-none focus:border-love-pink"
                      placeholder="One line = one food. Max 3 foods."
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      
    </main>
  );
}
