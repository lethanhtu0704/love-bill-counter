"use client";

import { motion } from "framer-motion";

interface ModalOverlayProps {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function ModalOverlay({
  onClose,
  children,
  maxWidth = "max-w-[560px]",
}: ModalOverlayProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`bg-white p-6 rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100`}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
