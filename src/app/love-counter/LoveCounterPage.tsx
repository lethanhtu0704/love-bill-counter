"use client";

import { useState, useEffect, useCallback } from "react";
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
import { attachFcmForegroundListener, ensureFcmToken } from "@/lib/push";
import TimeCounter from "./components/TimeCounter";
import MilestoneCard from "./components/MilestoneCard";
import DatePickerPopover from "./components/DatePickerPopover";
import SecretButton from "@/components/SecretButton";

export default function LoveCounterPage() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("full");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [config, ms] = await Promise.all([getLoveConfig(), getMilestones()]);
      setStartDate(new Date(config.startDate));
      setMilestones(ms);
    } catch (err) {
      console.error("Error loading love counter data:", err);
      // Fallback: allow app to work without Firebase
      setStartDate(new Date("2024-09-01"));
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    attachFcmForegroundListener();
  }, []);

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
    // User gesture: request permission + register token here (iOS PWA requires gesture)
    try {
      await ensureFcmToken();
    } catch {
      // Ignore token failures
    }

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

      // Fire-and-forget: send push to all subscribed devices
      fetch("/api/push/notify-milestone", { method: "POST" }).catch(() => {
        // Ignore notify failures
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

          {milestones.map((m, i) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              index={i}
              onUpdate={handleUpdateMilestone}
              onDelete={handleDeleteMilestone}
              onImageUpload={handleImageUpload}
            />
          ))}

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

      {/* Secret button */}
      <SecretButton targetRoute="/room-bill/dashboard" />
    </div>
  );
}
