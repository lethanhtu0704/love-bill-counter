export default function Toggle({ on, color }: { on: boolean; color: "pink" | "green" }) {
  const onBg = color === "green" ? "bg-[#86bd77]" : "bg-[#b8476f]";
  return (
    <span
      aria-hidden
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on ? onBg : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}
