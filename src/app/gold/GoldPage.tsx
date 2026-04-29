"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import GoldChart from "./GoldChart";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CoinIcon,
  RefreshIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "@/components/icons";
import { getGoldHistory } from "@/lib/services";
import { GOLD_PRODUCT_NAME, GOLD_UNIT_LABEL } from "@/lib/constants";
import type {
  GoldChartRange,
  GoldComparisonRange,
  GoldSnapshot,
} from "@/lib/types";

const DAY_MS = 24 * 60 * 60 * 1000;

const COMPARISON_OPTIONS: { value: GoldComparisonRange; label: string }[] = [
  { value: "month", label: "THÁNG NÀY" },
  { value: "7d", label: "7 NGÀY" },
  { value: "30d", label: "30 NGÀY" },
  { value: "90d", label: "90 NGÀY" },
];

const CHART_OPTIONS: { value: GoldChartRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
];

const numberFmt = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

function getRangeStart(range: GoldComparisonRange | GoldChartRange): number {
  const now = Date.now();
  if (range === "month") {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }
  if (range === "7d") return now - 7 * DAY_MS;
  if (range === "30d") return now - 30 * DAY_MS;
  return now - 90 * DAY_MS;
}

function comparisonTitle(range: GoldComparisonRange): string {
  switch (range) {
    case "month":
      return "So với giá bán thấp nhất tháng này";
    case "7d":
      return "So với giá bán thấp nhất 7 ngày qua";
    case "30d":
      return "So với giá bán thấp nhất 30 ngày qua";
    case "90d":
      return "So với giá bán thấp nhất 90 ngày qua";
  }
}

function nextComparisonRange(
  current: GoldComparisonRange
): GoldComparisonRange {
  const idx = COMPARISON_OPTIONS.findIndex((o) => o.value === current);
  return COMPARISON_OPTIONS[(idx + 1) % COMPARISON_OPTIONS.length].value;
}

export default function GoldPage() {
  const [history, setHistory] = useState<GoldSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comparisonRange, setComparisonRange] =
    useState<GoldComparisonRange>("month");
  const [chartRange, setChartRange] = useState<GoldChartRange>("30d");

  const loadHistory = useCallback(async () => {
    try {
      const data = await getGoldHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load gold history:", err);
      setError("Không tải được lịch sử giá vàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/gold/refresh", { method: "POST" });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Refresh failed");
      }
      await loadHistory();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Không cập nhật được giá vàng"
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadHistory]);

  // Auto-refresh on first load if no history yet
  useEffect(() => {
    if (!loading && history.length === 0 && !refreshing) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const latest = history[history.length - 1] ?? null;

  const comparison = useMemo(() => {
    if (!latest) return null;
    const start = getRangeStart(comparisonRange);
    const window = history.filter((s) => s.savedAt >= start);
    if (window.length === 0) return null;
    const lowestSell = Math.min(...window.map((s) => s.sell));
    const diff = latest.sell - lowestSell;
    const pct = lowestSell > 0 ? (diff / lowestSell) * 100 : 0;
    return { lowestSell, diff, pct };
  }, [history, latest, comparisonRange]);

  const chartData = useMemo(() => {
    const start = getRangeStart(chartRange);
    return history.filter((s) => s.savedAt >= start);
  }, [history, chartRange]);

  const headerTime = latest
    ? format(new Date(latest.sourceUpdatedAt), "HH:mm")
    : "--:--";
  const today = format(new Date(), "dd/MM/yyyy");

  const isUp = comparison ? comparison.diff >= 0 : true;

  return (
    <main className="min-h-screen bg-love-paper px-4 pt-6 pb-28 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <header className="mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-love-brown font-[family-name:var(--font-playfair)]">
              Giá vàng hôm nay
            </h1>
            <CoinIcon className="h-6 w-6 text-amber-400 drop-shadow-sm" />
          </div>
          <p className="mt-1 text-sm text-love-brown/80">{today}</p>
          <p className="text-xs text-love-brown/60">
            Cập nhật lúc: {headerTime}
          </p>
        </header>

        {/* Update button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#a23d69] px-4 py-3 text-sm font-semibold text-white shadow-md transition active:scale-[0.99] disabled:opacity-60"
        >
          <RefreshIcon
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang cập nhật..." : "Cập nhật giá"}
        </button>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Current price card */}
        <section className="mb-4 rounded-2xl border border-love-brown/15 bg-white p-4 shadow-sm">
          {loading && !latest ? (
            <div className="flex h-24 items-center justify-center text-sm text-love-dot">
              Đang tải...
            </div>
          ) : latest ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src="/assets/pnj-icon.png"
                  alt="PNJ"
                  width={20}
                  height={20}
                  className="rounded object-contain"
                />
                <h2 className="text-base font-semibold text-love-brown">
                  {GOLD_PRODUCT_NAME}
                </h2>
              </div>

              <div className="flex items-baseline py-1.5 gap-6">
                <span className="text-base text-love-dot">MUA : </span>
                <span className="text-lg font-semibold text-love-brown">
                  {numberFmt.format(latest.buy)} <span className="mt-3 text-center text-[11px] tracking-wide text-love-dot/70"> ({GOLD_UNIT_LABEL}) </span>
                </span>
              </div>
              <div className="flex items-baseline  py-1.5 gap-6">
                <span className="text-base text-love-dot">BÁN :  </span>
                <span className="text-lg font-bold text-[#a23d69]">
                  {numberFmt.format(latest.sell)} <span className="mt-3 text-center text-[11px] tracking-wide text-love-dot/70">({GOLD_UNIT_LABEL}) </span>
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-24 items-center justify-center text-sm text-love-dot">
              Chưa có dữ liệu giá vàng
            </div>
          )}
        </section>

        {/* Comparison summary card */}
        <section className="mb-4 rounded-2xl border border-love-brown/15 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <h3 className="flex-1 text-sm font-semibold leading-snug text-love-brown">
              {comparisonTitle(comparisonRange)}
            </h3>
            <button
              type="button"
              onClick={() =>
                setComparisonRange(nextComparisonRange(comparisonRange))
              }
              className="flex-shrink-0 rounded-full bg-[#a23d69] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition active:scale-95"
              title="Đổi khoảng so sánh"
            >
              {
                COMPARISON_OPTIONS.find((o) => o.value === comparisonRange)
                  ?.label
              }
            </button>
          </div>

          {comparison && latest ? (
            <>
              <div className="mt-4 flex items-start gap-3">
                <div
                  className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl ${isUp ? "bg-[#a23d69]/10" : "bg-emerald-100"
                    }`}
                >
                  {isUp ? (
                    <TrendingUpIcon className="h-6 w-6 text-[#a23d69]" />
                  ) : (
                    <TrendingDownIcon className="h-6 w-6 text-emerald-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-love-dot">
                    Giá bán hiện tại {isUp ? "tăng" : "giảm"}
                  </p>
                  <p
                    className={`flex items-center gap-1 text-2xl font-bold leading-tight ${isUp ? "text-[#a23d69]" : "text-emerald-600"
                      }`}
                  >
                    <span>
                      {isUp ? "+" : "−"}
                      {Math.abs(comparison.pct).toFixed(2)}%
                    </span>
                    <ArrowUpRightIcon
                      className={`h-4 w-4 ${isUp ? "" : "rotate-90"}`}
                    />
                  </p>
                  <p className="mt-0.5 text-xs text-love-dot">
                    {isUp ? "Tăng" : "Giảm"}{" "}
                    <span
                      className={`font-semibold ${isUp ? "text-[#a23d69]" : "text-emerald-600"
                        }`}
                    >
                      {numberFmt.format(Math.abs(comparison.diff))}
                    </span>{" "}
                    ({GOLD_UNIT_LABEL})
                  </p>
                </div>
              </div>

              <div className="my-4 h-px bg-love-brown/10" />

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-love-dot">Thấp nhất</p>
                  <p className="text-lg font-bold text-love-brown">
                    {numberFmt.format(comparison.lowestSell)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-love-dot/60">
                    ĐVT: {GOLD_UNIT_LABEL}
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 flex-shrink-0 text-[#a23d69]" />
                <div className="flex-1 text-right">
                  <p className="text-xs text-love-dot">Hiện tại</p>
                  <p className="text-lg font-bold text-love-brown">
                    {numberFmt.format(latest.sell)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-love-dot/60">
                    ĐVT: {GOLD_UNIT_LABEL}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-xs text-love-dot">
              Chưa đủ dữ liệu để so sánh trong khoảng này.
            </p>
          )}
        </section>

        {/* Chart section */}
        <section className="rounded-2xl border border-love-brown/15 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-love-brown">
              Xu hướng giá
            </h3>
            <div className="flex gap-1 rounded-full bg-love-paper/70 p-0.5">
              {CHART_OPTIONS.map((opt) => {
                const active = opt.value === chartRange;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChartRange(opt.value)}
                    className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${active
                        ? "bg-[#a23d69] text-white shadow-sm"
                        : "text-love-dot"
                      }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <GoldChart data={chartData} />

          <p className="mt-2 text-center text-[11px] uppercase tracking-wide text-love-dot/70">
            ĐVT: {GOLD_UNIT_LABEL}
          </p>
        </section>
      </div>
    </main>
  );
}
