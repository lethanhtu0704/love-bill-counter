"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement, SVGProps } from "react";
import { HomeIcon, HeartIcon, MusicIcon, UtensilsIcon, BellIcon } from "./icons";

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
      id: "music",
      href: "/music",
      icon: MusicIcon,
      isActive: (currentPathname) =>
        currentPathname === "/music" || currentPathname.startsWith("/music/"),
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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md h-16 bg-[#1a1a1a] rounded-3xl flex items-center justify-around px-2 shadow-2xl">
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
            {isActive ? (
              <div className="absolute inset-0 flex flex-col items-center pointer-events-none overflow-hidden rounded-3xl transition-opacity duration-300">
                {/* Top Pink Bar */}
                <div className="absolute top-0 w-8 h-1 bg-pink-500 rounded-b-xl" />
                
                {/* Subtle Pink Spotlight Gradient underneath */}
                <div 
                  className="absolute top-0 w-12 h-full"
                  style={{
                    background: "linear-gradient(to bottom, rgba(224, 70, 147, 0.4) 0%, transparent 100%)"
                  }}
                />
              </div>
            ) : null}

            {/* Icon */}
            <div
              className={`relative z-10 p-2 rounded-full transition-all duration-300 ${
                isActive ? "text-pink-300 scale-110" : "text-gray-400 group-hover:text-gray-200"
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>
          </button>
        );
      })}
    </div>
  );
}