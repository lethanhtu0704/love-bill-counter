export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " VND";
}

export function formatMonthYear(month: number, year: number): string {
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];
  return `${monthNames[month - 1]} ${year}`;
}

export function getRandomCharm(): string {
  const idx = Math.floor(Math.random() * 16) + 1;
  return `/assets/charm${idx}.png`;
}

export function getRandomCharmPosition(): {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  rotation: number;
} {
  const positions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ] as const;
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const rot = Math.floor(Math.random() * 40) - 20; // -20 to 20 degrees
  return { position: pos, rotation: rot };
}
