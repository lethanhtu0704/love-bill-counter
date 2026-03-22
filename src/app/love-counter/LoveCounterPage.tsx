"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  getLoveConfig,
  updateLoveConfig,
  getMilestones,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  uploadMilestoneImage,
} from "@/lib/services";
import { getRandomCharm, getRandomCharmPosition } from "@/lib/utils";
import { TIME_FORMATS, type TimeFormat } from "@/lib/constants";
import type { Milestone } from "@/lib/types";
import {
  attachFcmForegroundListener,
  ensureFcmToken,
  notifyMilestoneAddedLocal,
} from "@/lib/push";
import TimeCounter from "./components/TimeCounter";
import MilestoneCard from "./components/MilestoneCard";
import DatePickerPopover from "./components/DatePickerPopover";
import { validatePin } from "./actions";

export default function LoveCounterPage() {
  // ── Auth ──────────────────────────────────────────────────────────────
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("lc_auth") === "1";
  });
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // ── Data ──────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("full");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [milestonesLoading, setMilestonesLoading] = useState(true);

  const loadData = useCallback(async () => {
    // 1. Load config first — drops the main loading screen quickly
    try {
      const config = await getLoveConfig();
      setStartDate(new Date(config.startDate));
    } catch (err) {
      console.error("Error loading love config:", err);
      setStartDate(new Date("2024-09-01"));
    } finally {
      setLoading(false);
    }

    // 2. Load milestones in the background (they carry heavy base64 images)
    getMilestones()
      .then((ms) => setMilestones(ms))
      .catch((err) => console.error("Error loading milestones:", err))
      .finally(() => setMilestonesLoading(false));
  }, []);

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, loadData]);

  useEffect(() => {
    if (authenticated) attachFcmForegroundListener();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    // If the user already granted permission on this device, ensure token is registered
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "granted") {
      void ensureFcmToken();
    }
  }, [authenticated]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await validatePin(pin);
    if (ok) {
      sessionStorage.setItem("lc_auth", "1");
      setAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => pinInputRef.current?.focus(), 0);
    }
  };

  const handleDateChange = async (date: Date) => {
    setStartDate(date);
    setShowDatePicker(false);
    try {
      await updateLoveConfig(date);
    } catch (err) {
      console.error("Error updating start date:", err);
    }
  };

  const handleAddMilestone = async () => {
    // User gesture: kick off permission/token flow, but don't block UI
    void ensureFcmToken().catch(() => {
      // Ignore token failures
    });

    const charm = getRandomCharm();
    // unused: const charmPos = getRandomCharmPosition();
    try {
      const newMilestone: Omit<Milestone, "id" | "createdAt"> = {
        title: "",
        content: "",
        date: Date.now(),
        imageUrl: "",
        charmImage: charm,
        order: milestones.length,
      };
      const id = await addMilestone(newMilestone);
      setMilestones((prev) => [
        ...prev,
        { ...newMilestone, id, createdAt: Date.now() },
      ]);

      // Immediate feedback (foreground/local notification)
      void notifyMilestoneAddedLocal();

      // Fire-and-forget: send push to all subscribed devices
      fetch("/api/push/notify-milestone", { method: "POST" })
        .then((res) => {
          if (!res.ok) {
            console.error("Push notify failed:", res.status);
          }
        })
        .catch((err) => {
          console.error("Push notify error:", err);
        });
    } catch (err) {
      console.error("Error adding milestone:", err);
    }
  };

  const handleUpdateMilestone = async (
    id: string,
    data: Partial<Milestone>
  ) => {
    try {
      await updateMilestone(id, data);
      setMilestones((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data } : m))
      );
    } catch (err) {
      console.error("Error updating milestone:", err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await deleteMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting milestone:", err);
    }
  };

  const handleImageUpload = async (milestoneId: string, file: File) => {
    try {
      // Returns base64 string
      const url = await uploadMilestoneImage(file, milestoneId);
      await updateMilestone(milestoneId, { imageUrl: url });
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, imageUrl: url } : m))
      );
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  // ── Auth screen ───────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('/assets/desktop-background.png')] bg-cover bg-center bg-repeat-x bg-fixed bg-no-repeat max-md:bg-[url('/assets/iphone-background.png')]">
        <div className="pointer-events-none fixed inset-0 z-0 bg-black/20" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 bg-love-paper/90 backdrop-blur-sm rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-5 w-[320px]"
        >
          <div className="text-4xl">🔒</div>
          <h2 className="font-[family-name:var(--font-playfair)] text-love-brown text-xl font-semibold">
            Nhập mật khẩu để vào
          </h2>
          <form onSubmit={handlePinSubmit} className="w-full flex flex-col gap-3">
            {/* Dot display — tap anywhere to focus hidden input */}
            <div
              className="relative flex justify-center gap-4 py-5 cursor-text"
              onClick={() => pinInputRef.current?.focus()}
            >
              {/* Hidden real input captures keyboard */}
              <input
                ref={pinInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPin(val);
                  setPinError(false);
                  // Auto-submit once all 6 digits are filled
                  if (val.length === 6) {
                    validatePin(val).then((ok) => {
                      if (ok) {
                        sessionStorage.setItem("lc_auth", "1");
                        setAuthenticated(true);
                      } else {
                        setPinError(true);
                        setPin("");
                        setTimeout(() => pinInputRef.current?.focus(), 0);
                      }
                    });
                  }
                }}
                autoFocus
                autoComplete="off"
                className="absolute inset-0 opacity-0 w-full h-full cursor-text select-none"
              />
              {/* 6 visual dots */}
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    i < pin.length
                      ? pinError
                        ? "bg-red-400 border-red-400 scale-110"
                        : "bg-love-brown border-love-brown scale-110"
                      : pinError
                        ? "bg-transparent border-red-300"
                        : "bg-transparent border-love-brown/30"
                  }`}
                />
              ))}
            </div>
            {pinError && (
              <p className="text-red-400 text-sm text-center animate-shake">Mã không đúng, thử lại nha eiu ❤</p>
            )}
          </form>
        </motion.div>
      </div>
    );
  }

  // ── Config loading screen (resolves fast) ─────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[url('/assets/desktop-background.png')] bg-cover bg-center bg-repeat-x bg-fixed bg-no-repeat max-md:bg-[url('/assets/iphone-background.png')]">
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-5xl"
        >
          ❤
        </motion.div>
      </div>
    );
  }

  return (
    <div className="love-page font-[family-name:var(--font-playfair)] text-love-brown bg-[url('/assets/desktop-background.png')] bg-repeat-x bg-cover bg-center bg-fixed bg-no-repeat max-md:bg-[url('/assets/iphone-background.png')]">
      {/* Dark overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/10" />

      <div className="relative z-[1] mx-auto max-w-[1000px] px-5 py-10">
        {/* Header */}
        <header className="mb-15 text-center relative">
          <p className="mt-3 text-lg italic text-love-pink">
            Ngày kể từ buổi hẹn đầu tiên <span className="text-love-pink">❤</span>
          </p>
          <TimeCounter
            startDate={startDate!}
            format={timeFormat}
          />

          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <select
              value={timeFormat}
              onChange={(e) => setTimeFormat(e.target.value as TimeFormat)}
              className="rounded-full bg-white/60 backdrop-blur-sm px-4 py-2 text-sm border border-love-brown/20 text-love-brown outline-none cursor-pointer"
            >
              {TIME_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowDatePicker(true)}
              className="rounded-full bg-white/60 backdrop-blur-sm px-4 py-2 text-sm border border-love-brown/20 text-love-brown hover:bg-white/80 transition-colors cursor-pointer"
            >
              📅 Đổi ngày bắt đầu
            </button>
          </div>

          {showDatePicker && (
            <DatePickerPopover
              currentDate={startDate!}
              onSelect={handleDateChange}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </header>

        {/* Timeline */}
        <div className="relative py-5">
          {/* Central dashed line */}

          {milestonesLoading ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="text-love-brown/50 text-sm italic"
              >
                Đang tải kỷ niệm...
              </motion.div>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-full max-w-[560px] h-28 rounded-2xl bg-love-paper/60 animate-pulse"
                />
              ))}
            </div>
          ) : (
            milestones.map((m, i) => (
              <MilestoneCard
                key={m.id}
                milestone={m}
                index={i}
                onUpdate={handleUpdateMilestone}
                onDelete={handleDeleteMilestone}
                onImageUpload={handleImageUpload}
              />
            ))
          )}

          {/* Add milestone button */}
          <motion.div
            className="flex justify-center mt-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={handleAddMilestone}
              className="rounded-full bg-love-paper px-8 py-3 text-love-brown font-semibold shadow-md border border-love-brown/20 hover:shadow-lg transition-shadow cursor-pointer"
            >
              + Thêm kỷ niệm mới
            </button>
          </motion.div>

          {/* Footer banner */}
          <div className="relative flex justify-center mt-25 mb-12">
            <img
              src="/assets/charm5.png"
              alt="charm"
              className="absolute bottom-2.5 left-[10%] h-20 drop-shadow-md"
            />
            <img
              src="/assets/charm2.png"
              alt="charm"
              className="absolute -bottom-5 right-[10%] h-[90px] -rotate-[20deg] drop-shadow-md"
            />
            <div className="bg-love-paper px-15 py-5 shadow-md rounded-sm text-center -rotate-1 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%274%27%20height=%274%27%20viewBox=%270%200%204%204%27%3E%3Cpath%20fill=%27%238b5e52%27%20fill-opacity=%270.05%27%20d=%27M1%203h1v1H1V3zm2-2h1v1H3V1z%27%3E%3C/path%3E%3C/svg%3E')]">
              <h3 className="text-[1.8rem] font-bold text-love-brown/90 font-[family-name:var(--font-playfair)]">
                Những Kỷ Niệm
              </h3>
              <p className="text-lg italic">Một Chương Mới ❤</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
