import React from 'react';
import { GoogleSheetsView } from './GoogleSheetsView';
import { X, FileSpreadsheet } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-5xl max-h-[92vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="font-black text-slate-900 text-base sm:text-lg">
              ตั้งค่าฐานข้อมูล Google Sheets & Google Apps Script
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-300">
          <GoogleSheetsView />
        </div>
      </div>
    </div>
  );
};
