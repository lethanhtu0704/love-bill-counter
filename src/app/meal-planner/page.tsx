"use client";

import dynamic from "next/dynamic";

const MealPlannerPage = dynamic(() => import("./MealPlannerPage"), {
  ssr: false,
});

export default function Page() {
  return <MealPlannerPage />;
}
