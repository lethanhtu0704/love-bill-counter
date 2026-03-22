"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ReactElement, SVGProps } from "react";

// --- Icons ---
const HomeIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const PlusCircleIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const UtensilsIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 3v7a2 2 0 0 0 2 2h1v9" />
    <path d="M8 3v7" />
    <path d="M12 3v7" />
    <path d="M17 3v18" />
    <path d="M17 3c2 2 3 4.5 3 7h-3" />
  </svg>
);

const BellIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

type NavItem = {
  id: string;
  href: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  isActive: (pathname: string, quickAddMode: boolean) => boolean;
};

export default function BottomNavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const quickAddMode = searchParams.get("quickAdd") === "1";

  // Configuration for the 5 tabs
  const navItems: NavItem[] = [
    {
      id: "quick-add",
      href: "/meal-planner?quickAdd=1",
      icon: PlusCircleIcon,
      isActive: (currentPathname, isQuickAddMode) =>
        currentPathname === "/meal-planner" && isQuickAddMode,
    },
    {
      id: "room-bill",
      href: "/room-bill/dashboard",
      icon: HomeIcon,
      isActive: (currentPathname) =>
        currentPathname === "/room-bill/dashboard" ||
        currentPathname.startsWith("/room-bill/dashboard/"),
    },
    {
      id: "love-counter",
      href: "/love-counter",
      icon: HeartIcon,
      isActive: (currentPathname) =>
        currentPathname === "/love-counter" ||
        currentPathname.startsWith("/love-counter/"),
    },
    {
      id: "meal-planner",
      href: "/meal-planner",
      icon: UtensilsIcon,
      isActive: (currentPathname, isQuickAddMode) =>
        currentPathname === "/meal-planner" && !isQuickAddMode,
    },
    {
      id: "notifications",
      href: "/notifications",
      icon: BellIcon,
      isActive: (currentPathname) =>
        currentPathname === "/notifications" ||
        currentPathname.startsWith("/notifications/"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md h-16 bg-[#1a1a1a] rounded-3xl flex items-center justify-around px-2 shadow-2xl">
      {navItems.map((item) => {
        const isActive = item.isActive(pathname, quickAddMode);
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer outline-none tap-highlight-transparent group"
          >
            {/* Active Indicator & Spotlight */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  layoutId="spotlight"
                  className="absolute inset-0 flex flex-col items-center pointer-events-none overflow-hidden rounded-3xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Top Pink Bar */}
                  <div className="absolute top-0 w-8 h-1 bg-pink-500 rounded-b-xl" />
                  
                  {/* Subtle Pink Spotlight Gradient underneath */}
                  <div 
                    className="absolute top-0 w-12 h-full"
                    style={{
                      background: "linear-gradient(to bottom, rgba(224, 70, 147, 0.4) 0%, transparent 100%)"
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Icon */}
            <motion.div
              className={`relative z-10 p-2 rounded-full transition-colors duration-300 ${
                isActive ? "text-pink-300" : "text-gray-400 group-hover:text-gray-200"
              }`}
              animate={{ 
                scale: isActive ? 1.1 : 1,
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          </button>
        );
      })}
    </div>
  );
}