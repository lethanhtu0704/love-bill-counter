"use client";

import dynamic from "next/dynamic";

const GoldPage = dynamic(() => import("./GoldPage"), { ssr: false });

export default function Page() {
  return <GoldPage />;
}
