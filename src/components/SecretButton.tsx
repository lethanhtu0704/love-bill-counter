"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface SecretButtonProps {
  targetRoute: string;
}

export default function SecretButton({ targetRoute }: SecretButtonProps) {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push(targetRoute)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-xl cursor-pointer"
      style={{
        background:
          targetRoute === "/room-bill/dashboard"
            ? "linear-gradient(135deg, #f472b6 0%, #ec4899 100%)"
            : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{ 
        boxShadow: [
          "0 4px 15px rgba(0,0,0,0.2)",
          "0 4px 25px rgba(0,0,0,0.3)",
          "0 4px 15px rgba(0,0,0,0.2)",
        ]
      }}
      transition={{ 
        boxShadow: { repeat: Infinity, duration: 2 },
      }}
      title={targetRoute === "/room-bill/dashboard" ? "Tính tiền phòng" : "Love Counter"}
    >
      {targetRoute === "/room-bill/dashboard" ? "🏠" : "❤"}
    </motion.button>
  );
}
