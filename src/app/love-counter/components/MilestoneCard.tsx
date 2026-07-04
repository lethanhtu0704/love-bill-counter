"use client";

import { useState, useRef, useMemo, memo } from "react";
import { format } from "date-fns";
import "./css/MilestoneCard.css";
import type { Milestone } from "@/lib/types";

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  onUpdate: (id: string, data: Partial<Milestone>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onImageUpload: (milestoneId: string, file: File) => Promise<void>;
  isPlaceholder?: boolean;
}

const CHARM_POSITIONS = [
  { className: "-top-3 -left-10", rotate: "rotate-[15deg]" },
  { className: "top-2 -right-8", rotate: "-rotate-[10deg]" },
  { className: "bottom-0 -left-12", rotate: "rotate-[40deg]" },
  { className: "top-1/2 -right-5 -translate-y-1/2", rotate: "" },
];

export default memo(function MilestoneCard({
  milestone,
  index,
  onUpdate,
  onDelete,
  onImageUpload,
  isPlaceholder = false,
}: MilestoneCardProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [title, setTitle] = useState(milestone.title);
  const [content, setContent] = useState(milestone.content);

  // We rely on parent to handle actual upload logic, but we can track loading state here if needed
  // However, `onImageUpload` is async, so we can await it.
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tapeClass = useMemo(() => Math.random() < 0.5 ? "top-tape" : "tape-section", []);

  const isLeft = index % 2 === 0;
  const milestoneDate = milestone.date ? new Date(milestone.date) : new Date();

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onImageUpload(milestone.id, file);
    } finally {
      setUploading(false);
    }
  };

  const handleTitleSave = () => {
    setEditingTitle(false);
    if (title !== milestone.title) {
      onUpdate(milestone.id, { title });
    }
  };

  const handleContentSave = () => {
    setEditingContent(false);
    if (content !== milestone.content) {
      onUpdate(milestone.id, { content });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Value from input type="date" is YYYY-MM-DD
    const val = e.target.value;
    if (!val) return;
    const newDate = new Date(val);
    setEditingDate(false);
    onUpdate(milestone.id, { date: newDate.getTime() });
  };

  const autoExpandTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

  return (
    <div
      className={`animate-fade-in-up flex items-center justify-center mb-20 relative z-[1] max-md:flex-col max-md:items-start max-md:ml-12 ${isLeft ? "" : "flex-row-reverse"
        }`}
      style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
    >
      {/* Date Marker */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10 max-md:-left-6">
        <div className="w-4 h-4 rounded-full bg-love-pink border-4 border-white dark:border-love-paper shadow-sm" />
        <div
          className="mt-2 bg-white/95 dark:bg-love-paper/95 px-3 py-1 rounded-full text-xs font-bold text-love-brown shadow-sm cursor-pointer hover:bg-white dark:hover:bg-love-paper transition-colors"
          onClick={() => !isPlaceholder && setEditingDate(true)}
        >
          {editingDate ? (
            <input
              type="date"
              className="bg-transparent outline-none"
              defaultValue={format(milestoneDate, "yyyy-MM-dd")}
              onChange={handleDateChange}
              onBlur={() => setEditingDate(false)}
              autoFocus
            />
          ) : (
            format(milestoneDate, "dd/MM/yyyy")
          )}
        </div>
      </div>

      {/* Content Card */}
      <div className={`relative w-[45%] max-md:w-full ${isLeft ? "pr-12 max-md:pr-0 max-md:pl-4" : "pl-12 max-md:pl-4"}`}>
        <div
          className={`relative paper white p-5 rounded-sm shadow-md border border-love-brown/10 transition-transform duration-300 hover:rotate-0 hover:scale-[1.02] ${isLeft ? "-rotate-[2deg]" : "rotate-[2deg]"
            }`}
        >
          <div className={tapeClass}></div>

          {/* Image Area */}
          <div
            className="relative aspect-[4/3] w-full bg-love-beige/20 flex items-center justify-center overflow-hidden rounded-sm cursor-pointer group mb-4 border border-love-brown/10"
            onClick={handleImageClick}
          >
            {milestone.imageUrl ? (
              <img
                src={milestone.imageUrl}
                alt={milestone.title}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="text-love-brown/40 text-sm flex flex-col items-center gap-2">
                <span className="text-2xl">+</span>
                <span>Thêm ảnh</span>
              </div>
            )}

            {uploading && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Title */}
          {editingTitle ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
              className="w-full text-xl font-bold text-love-brown mb-2 bg-transparent border-b border-love-pink outline-none font-[family-name:var(--font-playfair)]"
              autoFocus
              placeholder="Tiêu đề..."
            />
          ) : (
            <h3
              className="text-xl font-bold text-love-brown mb-2 font-[family-name:var(--font-playfair)] wrap-break-word cursor-text hover:text-love-pink transition-colors"
              onClick={() => !isPlaceholder && setEditingTitle(true)}
            >
              {milestone.title || "Tiêu đề kỷ niệm"}
            </h3>
          )}

          {/* Content */}
          {editingContent ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                autoExpandTextarea();
              }}
              onBlur={handleContentSave}
              className="w-full text-sm text-love-brown/80 bg-transparent outline-none resize-none overflow-hidden min-h-[60px]"
              autoFocus
              placeholder="Viết gì đó..."
            />
          ) : (
            <p
              className="text-sm text-love-brown/80 wrap-break-word leading-relaxed whitespace-pre-wrap cursor-text hover:text-love-brown transition-colors min-h-[20px]"
              onClick={() => !isPlaceholder && setEditingContent(true)}
            >
              {milestone.content || "Nội dung kỷ niệm..."}
            </p>
          )}

          {/* Delete Button (visible on hover) */}
          {!isPlaceholder && (
            <button
              onClick={() => onDelete(milestone.id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-400 text-white rounded-full flex items-center justify-center opacity-0 transition-opacity shadow-sm hover:bg-red-500"
              title="Xóa kỷ niệm"
            >
              ×
            </button>
          )}

          {/* Charm Decoration */}
          {milestone.charmImage && (
            <img
              src={milestone.charmImage}
              alt="charm"
              loading="lazy"
              decoding="async"
              className={`absolute w-15  drop-shadow-sm z-100 pointer-events-none -bottom-4 -right-3 rotate-12`}
            />
          )}

        </div>
      </div>

      {/* Spacer for the other side */}
      <div className="w-[45%] max-md:hidden" />

    </div>
  );
})
