"use client";

import { useMemo } from "react";
import type { GoldSnapshot } from "@/lib/types";

type Props = {
  data: GoldSnapshot[];
};

const WIDTH = 320;
const HEIGHT = 160;
const PADDING_X = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 24;

function buildPath(values: { x: number; y: number }[]): string {
  if (values.length === 0) return "";
  return values
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
}

export default function GoldChart({ data }: Props) {
  const view = useMemo(() => {
    if (data.length === 0) return null;

    const sells = data.map((d) => d.sell);
    const buys = data.map((d) => d.buy);
    const allValues = [...sells, ...buys];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = Math.max(1, maxVal - minVal);

    const innerW = WIDTH - PADDING_X * 2;
    const innerH = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const xFor = (i: number) => {
      if (data.length === 1) return WIDTH / 2;
      return PADDING_X + (i / (data.length - 1)) * innerW;
    };
    const yFor = (v: number) =>
      PADDING_TOP + innerH - ((v - minVal) / range) * innerH;

    const sellPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.sell) }));
    const buyPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.buy) }));

    // Build labels at start, middle, end
    const dateLabels: { x: number; label: string }[] = [];
    const indices = data.length === 1
      ? [0]
      : data.length === 2
        ? [0, data.length - 1]
        : [0, Math.floor((data.length - 1) / 2), data.length - 1];

    for (const i of indices) {
      const d = new Date(data[i].savedAt);
      dateLabels.push({
        x: xFor(i),
        label: `${d.getDate()}/${d.getMonth() + 1}`,
      });
    }

    return {
      sellPath: buildPath(sellPoints),
      buyPath: buildPath(buyPoints),
      sellPoints,
      buyPoints,
      dateLabels,
      minVal,
      maxVal,
    };
  }, [data]);

  if (!view) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-love-brown/20 text-sm text-love-dot">
        Chưa có dữ liệu vàng trong khoảng này
      </div>
    );
  }

  return (
    <>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Sell line */}
        <path
          d={view.sellPath}
          fill="none"
          stroke="#a23d69"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Buy line */}
        <path
          d={view.buyPath}
          fill="none"
          stroke="#CB7D7C"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* End-of-line dots */}
        {view.sellPoints.length > 0 && (
          <circle
            cx={view.sellPoints[view.sellPoints.length - 1].x}
            cy={view.sellPoints[view.sellPoints.length - 1].y}
            r="3"
            fill="#a23d69"
          />
        )}
        {view.buyPoints.length > 0 && (
          <circle
            cx={view.buyPoints[view.buyPoints.length - 1].x}
            cy={view.buyPoints[view.buyPoints.length - 1].y}
            r="3"
            fill="#CB7D7C"
          />
        )}

        {/* X-axis date labels */}
        {view.dateLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={HEIGHT - 6}
            textAnchor="middle"
            fontSize="9"
            fill="#966F60"
          >
            {label.label}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-between text-[11px] text-love-dot">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[2px] w-4 rounded-full"
            style={{ background: "#a23d69" }}
          />
          Giá bán
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-[2px] w-4 rounded-full border-t-2 border-dashed"
            style={{ borderColor: "#CB7D7C" }}
          />
          Giá mua
        </span>
      </div>
    </>
  );
}
