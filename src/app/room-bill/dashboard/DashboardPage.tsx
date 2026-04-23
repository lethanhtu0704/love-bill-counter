"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { getBills, deleteBill, getRates } from "@/lib/services";
import { formatMonthYear } from "@/lib/utils";
import type { Bill, Rates } from "@/lib/types";
import BillTable from "./components/BillTable";
import BillCardList from "./components/BillCardList";

const BillDetailModal = dynamic(() => import("./components/BillDetailModal"));
const BillFormModal = dynamic(() => import("./components/BillFormModal"));
const EditBillModal = dynamic(() => import("./components/EditBillModal"));
const RatesModal = dynamic(() => import("./components/RatesModal"));
const ConfirmDeleteModal = dynamic(() => import("./components/ConfirmDeleteModal"));

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  const abs = Math.abs(change);
  if (abs >= 1_000_000) return `${sign}${(change / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(change / 1_000)}K`;
  return `${sign}${change}`;
}

export default function RoomBillDashboard() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rates, setRates] = useState<Rates | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [billsData, ratesData] = await Promise.all([getBills(), getRates()]);
      setBills(billsData);
      setRates(ratesData);
    } catch (err) {
      console.error("Error loading bills:", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Chart: last 8 bills sorted oldest-first, compute change vs previous
  const sortedAsc = [...bills].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
  const chartBills = sortedAsc.slice(-8);
  const chartData = chartBills.slice(1).map((bill, i) => ({
    bill,
    change: bill.totalAmount - chartBills[i].totalAmount,
    label: `T${bill.month}`,
  }));
  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.change)), 1);

  // Summary: latest bill vs previous
  const latestBill = bills[0] ?? null;
  const prevLatestBill = bills[1] ?? null;
  const summaryPct =
    latestBill && prevLatestBill
      ? ((latestBill.totalAmount - prevLatestBill.totalAmount) / prevLatestBill.totalAmount) * 100
      : null;
  const summaryAmt =
    latestBill && prevLatestBill
      ? latestBill.totalAmount - prevLatestBill.totalAmount
      : null;

  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  const handleEditBill = (bill: Bill) => {
    setSelectedBill(bill);
    setShowEditModal(true);
  };

  const handleDeleteClick = (bill: Bill) => {
    setBillToDelete(bill);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!billToDelete) return;
    try {
      await deleteBill(billToDelete.id);
      setBills((prev) => prev.filter((b) => b.id !== billToDelete.id));
    } catch (err) {
      console.error("Error deleting bill:", err);
    } finally {
      setShowDeleteConfirm(false);
      setBillToDelete(null);
    }
  };

  const handleBillCreated = () => {
    setShowAddModal(false);
    loadData();
  };

  const handleBillUpdated = () => {
    setShowEditModal(false);
    loadData();
  };

  const handleRatesUpdated = () => {
    setShowRatesModal(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bill-bg font-[family-name:var(--font-inter)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-3xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bill-bg font-[family-name:var(--font-inter)] text-bill-text-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-semibold text-bill-text-gray uppercase tracking-widest mb-1">
                Chi phí hàng tháng
              </p>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-bill-primary to-purple-600">
                Hoá đơn
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowRatesModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-bill-border bg-white text-gray-500 hover:bg-gray-50 transition-all shadow-xl active:scale-95"
                title="Cài đặt giá"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-bill-primary text-white hover:bg-bill-primary-hover shadow-xl transition-all active:scale-95"
                title="Hóa đơn mới"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Monthly change chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 mb-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Thay đổi mỗi tháng
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#fb7185" }} />
                    Tăng
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#4ade80" }} />
                    Giảm
                  </span>
                </div>
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1">
                {chartData.map((point, i) => {
                  const isPositive = point.change >= 0;
                  const barPx = Math.max(4, Math.round((Math.abs(point.change) / maxAbs) * 44));

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center min-w-[32px]">
                      {/* Top half: positive bars grow upward from baseline */}
                      <div
                        className="w-full flex flex-col items-center justify-end"
                        style={{ height: "60px" }}
                      >
                        {isPositive && (
                          <>
                            <span className="text-[9px] font-bold text-rose-500 mb-0.5 leading-none whitespace-nowrap">
                              {formatChange(point.change)}
                            </span>
                            <div
                              className="w-full rounded-t-sm"
                              style={{ height: `${barPx}px`, background: "#fb7185" }}
                            />
                          </>
                        )}
                      </div>

                      {/* Baseline */}
                      <div className="w-full h-px bg-gray-200" />

                      {/* Bottom half: negative bars grow downward from baseline */}
                      <div
                        className="w-full flex flex-col items-center justify-start"
                        style={{ height: "60px" }}
                      >
                        {!isPositive && (
                          <>
                            <div
                              className="w-full rounded-b-sm"
                              style={{ height: `${barPx}px`, background: "#4ade80" }}
                            />
                            <span className="text-[9px] font-bold text-emerald-600 mt-0.5 leading-none whitespace-nowrap">
                              {formatChange(point.change)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Month label */}
                      <span className="text-[9px] text-gray-400 mt-1 leading-none">
                        {point.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary: this month vs previous */}
          {summaryPct !== null && summaryAmt !== null && latestBill && prevLatestBill && (
            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 mb-6 border border-gray-100 shadow-md">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  summaryPct >= 0 ? "bg-rose-200 text-rose-700" : " text-emerald-700"
                }`}
              >
                {summaryPct >= 0 ? "▲" : "▼"}
              </div>
              <div>
                <p className="text-xs text-gray-500">
                  Tháng này so với tháng {prevLatestBill.month}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    summaryPct >= 0 ? "text-rose-500" : "text-emerald-600"
                  }`}
                >
                  {summaryPct >= 0 ? "Tăng" : "Giảm"}{" "}
                  {Math.abs(summaryPct).toFixed(1)}% ·{" "}
                  {new Intl.NumberFormat("vi-VN").format(Math.abs(summaryAmt))} VND
                </p>
              </div>
            </div>
          )}

          {/* Section header */}
          {bills.length > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-base font-semibold text-bill-text-dark">Chi tiết các tháng</span>
              <span className="text-sm text-bill-text-gray">{bills.length} tháng</span>
            </div>
          )}

          {/* Desktop Table */}
          <div className="max-md:hidden">
            <BillTable
              bills={bills}
              onView={handleViewBill}
              onEdit={handleEditBill}
              onDelete={handleDeleteClick}
            />
          </div>

          {/* Mobile Cards */}
          <div className="hidden max-md:block">
            <BillCardList
              bills={bills}
              onView={handleViewBill}
              onEdit={handleEditBill}
              onDelete={handleDeleteClick}
            />
          </div>

          {bills.length === 0 && (
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 shadow-md mt-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📄
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có hóa đơn nào</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Bắt đầu bằng cách tạo hóa đơn mới cho tháng này.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-bill-primary text-white hover:bg-bill-primary-hover shadow transition-all"
              >
                Tạo hóa đơn ngay
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showDetailModal && selectedBill && (
          <BillDetailModal
            bill={selectedBill}
            onClose={() => setShowDetailModal(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <BillFormModal
            bills={bills}
            onClose={() => setShowAddModal(false)}
            onCreated={handleBillCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && selectedBill && (
          <EditBillModal
            bill={selectedBill}
            onClose={() => setShowEditModal(false)}
            onUpdated={handleBillUpdated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRatesModal && rates && (
          <RatesModal
            rates={rates}
            onClose={() => setShowRatesModal(false)}
            onUpdated={handleRatesUpdated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && billToDelete && (
          <ConfirmDeleteModal
            billLabel={formatMonthYear(billToDelete.month, billToDelete.year)}
            onConfirm={handleConfirmDelete}
            onCancel={() => {
              setShowDeleteConfirm(false);
              setBillToDelete(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
