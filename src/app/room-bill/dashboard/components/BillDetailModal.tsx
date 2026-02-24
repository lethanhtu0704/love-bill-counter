"use client";

import { motion } from "framer-motion";
import type { Bill } from "@/lib/types";
import { formatMonthYear } from "@/lib/utils";
import Receipt from "@/components/Receipt";

interface BillDetailModalProps {
  bill: Bill;
  onClose: () => void;
}

export default function BillDetailModal({ bill, onClose }: BillDetailModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-100 p-6 rounded-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Chi tiết hóa đơn
            </h2>
            <p className="text-sm text-gray-500">{formatMonthYear(bill.month, bill.year)}</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
                className="p-2 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all shadow-sm active:scale-95"
                title="In hóa đơn"
             >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
             </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-lg shadow-sm p-1 overflow-hidden">
          <Receipt bill={bill} />
        </div>

        {/* Mobile footer */}
        <div className="mt-6 flex justify-end">
          <button className="w-full py-3 rounded-xl font-bold bg-bill-primary text-white hover:bg-bill-primary-hover shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Lưu PDF / In
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
