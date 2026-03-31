"use client";

import dynamic from "next/dynamic";

const MusicPlayerPage = dynamic(() => import("./MusicPlayerPage"), {
  ssr: false,
});

export default function Page() {
  return <MusicPlayerPage />;
}
