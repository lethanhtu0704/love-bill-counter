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
      const [billsData, ratesData] = await Promise.all([
        getBills(),
        getRates(),
      ]);
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
        {/* Main Content */}
        <main>
          {/* Content Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-bill-primary to-purple-600">
                Lịch Sử Hóa Đơn
              </h1>
              <p className="text-bill-text-gray mt-1">Quản lý và theo dõi chi phí hàng tháng</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowRatesModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm border border-bill-border bg-white text-bill-text-dark hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Cài đặt giá
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-bill-primary text-white hover:bg-bill-primary-hover shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Hóa đơn mới
              </button>
            </div>
          </div>

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
            <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm mt-6">
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
