"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { getMealsForWeek, upsertDayMeals } from "@/lib/services";
import type { DayMeals, WeekMeals } from "@/lib/types";

type DraftMeals = {
  breakfast: string;
  lunch: string;
  dinner: string;
};

type GeneratedWeek = Record<string, DayMeals>;

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const DEFAULT_AI_PROMPT = `Bạn là nhà dinh dưỡng học. Thiết kế một thực đơn giảm cân cho nam giới ở Việt Nam, cân nặng 78kg cao 1m67, không ăn rau mùi. Nguyên liệu nên đảm bảo các tiêu chí sau : rẻ, dễ kiếm ở các khu chợ, không dùng các loại rau quá hăng như ngò, quế, ngò gai)`;

const fallbackMenus = [
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],   
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
  },
  {
    breakfast: [""],
    lunch: [""],
    dinner: [""],
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string>("");
  const [weekMeals, setWeekMeals] = useState<WeekMeals>({});
  const [loadingWeek, setLoadingWeek] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [shouldQuickAdd, setShouldQuickAdd] = useState(false);
  const [draft, setDraft] = useState<DraftMeals>({
    breakfast: "",
    lunch: "",
    dinner: "",
  });

  // AI generation state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_AI_PROMPT);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);
  const weekRangeText = `${format(weekDays[0], "MMM d")} - ${format(
    weekDays[6],
    "MMM d"
  )}`;
  const selectedWeekKey = format(weekDays[0], "yyyy-MM-dd");

  useEffect(() => {
    let isMounted = true;

    async function loadWeekMeals() {
      setLoadingWeek(true);
      setErrorMessage("");
      try {
        const data = await getMealsForWeek(selectedWeekKey);
        if (isMounted) {
          setWeekMeals(data);
        }
      } catch (error) {
        console.error("Error loading meals:", error);
        if (isMounted) {
          setWeekMeals({});
          setErrorMessage("Khong the tai thuc don tu Firebase.");
        }
      } finally {
        if (isMounted) {
          setLoadingWeek(false);
        }
      }
    }

    loadWeekMeals();

    return () => {
      isMounted = false;
    };
  }, [selectedWeekKey]);

  useEffect(() => {
    const activeDateKey = format(selectedDate, "yyyy-MM-dd");
    setSelectedDayKey(activeDateKey);
  }, [selectedDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const quickAdd = new URLSearchParams(window.location.search).get("quickAdd") === "1";
    setShouldQuickAdd(quickAdd);
  }, []);

  const selectedDayDate =
    weekDays.find((day) => format(day, "yyyy-MM-dd") === selectedDayKey) ||
    weekDays[0];

  const selectedMeals: DayMeals =
    weekMeals[selectedDayKey] ||
    getDefaultMealsByDate(selectedDayDate);

  const blurActiveInput = useCallback(() => {
    if (typeof document === "undefined") return;
    const active = document.activeElement as HTMLElement | null;
    if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
      active.blur();
    }
  }, []);

  const openEditorWithCurrentMeals = useCallback(() => {
    setDraft({
      breakfast: toTextarea(selectedMeals.breakfast),
      lunch: toTextarea(selectedMeals.lunch),
      dinner: toTextarea(selectedMeals.dinner),
    });
    setIsEditing(true);
  }, [selectedMeals]);

  const handleOpenEditor = async () => {
    blurActiveInput();

    if (isEditing) {
      const updatedMeals: DayMeals = {
        breakfast: normalizeList(draft.breakfast),
        lunch: normalizeList(draft.lunch),
        dinner: normalizeList(draft.dinner),
      };

      setIsSaving(true);
      setErrorMessage("");
      try {
        await upsertDayMeals(selectedWeekKey, selectedDayKey, updatedMeals);
        setWeekMeals((prev) => ({
          ...prev,
          [selectedDayKey]: updatedMeals,
        }));
      } catch (error) {
        console.error("Error saving meals:", error);
        setErrorMessage("Khong the luu thuc don len Firebase.");
        return;
      } finally {
        setIsSaving(false);
      }

      setIsEditing(false);
      return;
    }

    openEditorWithCurrentMeals();
  };

  useEffect(() => {
    if (!shouldQuickAdd || isEditing || loadingWeek) return;
    openEditorWithCurrentMeals();
    setShouldQuickAdd(false);
  }, [shouldQuickAdd, isEditing, loadingWeek, openEditorWithCurrentMeals]);

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch("/api/meal-planner/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAiError(json.error || "Không thể tạo thực đơn từ AI.");
        return;
      }
      const generated: GeneratedWeek = json.data;

      // Map generated days to weekDays date keys and save to Firebase
      const updatedWeekMeals: WeekMeals = { ...weekMeals };
      for (let i = 0; i < DAY_ORDER.length; i++) {
        const dayName = DAY_ORDER[i];
        const dayDate = weekDays[i];
        const dayKey = format(dayDate, "yyyy-MM-dd");
        const meals = generated[dayName];
        if (meals) {
          const safeMeals: DayMeals = {
            breakfast: (meals.breakfast || []).slice(0, 3),
            lunch: (meals.lunch || []).slice(0, 3),
            dinner: (meals.dinner || []).slice(0, 3),
          };
          await upsertDayMeals(selectedWeekKey, dayKey, safeMeals);
          updatedWeekMeals[dayKey] = safeMeals;
        }
      }
      setWeekMeals(updatedWeekMeals);
      setShowAiModal(false);
      setIsEditing(false);
    } catch (err) {
      console.error("AI generation error:", err);
      setAiError("Đã xảy ra lỗi khi gọi AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDateChange = (value: string) => {
    if (!value) return;
    blurActiveInput();
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

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-love-brown/20 bg-white px-3 py-2 text-sm font-medium text-love-brown shadow-sm">
                <input
                  type="date"
                  className="sr-only md:not-sr-only"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(event) => handleDateChange(event.target.value)}
                />
                <span>Chọn tuần</span>
              </label>

              <button
                type="button"
                onClick={handleOpenEditor}
                disabled={isSaving || loadingWeek}
                className="flex-1 sm:flex-none rounded-xl bg-love-pink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {isSaving ? "Đang lưu..." : isEditing ? "Lưu thực đơn" : "Cập nhật thực đơn 🛎️"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              disabled={loadingWeek}
              className="w-full sm:w-auto rounded-xl border border-love-brown/20 bg-white px-4 py-2 text-sm font-semibold text-love-brown shadow-sm transition hover:bg-love-paper disabled:opacity-60"
            >
              Tạo thực đơn bằng AI ✨
            </button>
          </div>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

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
                        blurActiveInput();
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

            {loadingWeek && (
              <p className="mb-3 text-sm text-love-dot">Đang tải dữ liệu...</p>
            )}

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
                        : ["Chưa có món ăn"]).map((food, index) => (
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
                      className="w-full resize-none rounded-lg border border-love-brown/20 bg-white px-3 py-2 text-base text-love-dot outline-none focus:border-love-pink"
                      placeholder="Một dòng là một món ăn. Tối đa 3 món."
                    />
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-love-brown/15 bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-bold text-love-brown font-[family-name:var(--font-playfair)]">
              Tạo thực đơn bằng AI ✨
            </h2>
            <p className="mb-3 text-sm text-love-dot/90">
              Nhập yêu cầu để AI tạo thực đơn cho cả tuần <br /> <strong>({weekRangeText})</strong>.
            </p>
            <textarea
              rows={12}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              maxLength={2000}
              className="w-full resize-none rounded-xl border border-love-brown/20 bg-love-paper/30 px-3 py-2 text-sm text-love-dot outline-none focus:border-love-pink min-h-[150px] sm:min-h-0 sm:rows-5"
              placeholder="Ví dụ: Thiết kế thực đơn giảm cân cho nam giới..."
            />
            {aiError && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {aiError}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowAiModal(false); setAiError(""); }}
                disabled={aiLoading}
                className="rounded-xl border border-love-brown/20 bg-white px-4 py-2 text-sm font-semibold text-love-brown transition hover:bg-love-paper disabled:opacity-60"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={aiLoading || !aiPrompt.trim()}
                className="rounded-xl bg-love-pink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
              >
                {aiLoading ? "Đang tạo..." : "Tạo thực đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
