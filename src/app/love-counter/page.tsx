"use client";

import dynamic from "next/dynamic";

const LoveCounterPage = dynamic(
  () => import("./LoveCounterPage"),
  { ssr: false }
);

export default function Page() {
  return <LoveCounterPage />;
}
