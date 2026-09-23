"use client";

import { useEffect } from "react";

interface BottomSheetProps {
  onClose: () => void;
  children: React.ReactNode;
}

// Lightweight sheet (CSS-only animation — no framer-motion in this feature).
// Slides up from the bottom on phones, centered card on larger screens.
export default function BottomSheet({ onClose, children }: BottomSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="animate-fade-in-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-[#f7f2ec] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[28px] dark:bg-[#241d1a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-love-brown/30" />
        {children}
      </div>
    </div>
  );
}
