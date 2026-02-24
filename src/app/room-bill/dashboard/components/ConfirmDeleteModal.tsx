"use client";

import { motion } from "framer-motion";

interface ConfirmDeleteModalProps {
  billLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  billLabel,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="bg-white p-6 rounded-2xl w-full max-w-[400px] shadow-2xl text-center border border-gray-100"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        </div>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">Xác nhận xóa</h2>
        <p className="text-gray-500 mb-6 leading-relaxed">
          Bạn có chắc chắn muốn xóa hóa đơn <br/>
          <span className="font-semibold text-gray-800 block mt-1 bg-gray-50 py-1 rounded-md">{billLabel}</span>
          <span className="text-sm mt-2 block text-red-500">Hành động này không thể hoàn tác.</span>
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer shadow-lg hover:shadow-red-200 active:scale-95"
          >
            Xóa vĩnh viễn
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
