"use client";

import dynamic from "next/dynamic";

const CalendarPage = dynamic(() => import("./CalendarPage"), { ssr: false });

export default function Page() {
  return <CalendarPage />;
}
