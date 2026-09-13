import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/Navbar';
import { POSView } from './components/POSView';
import { CustomerOrderView } from './components/CustomerOrderView';
import { ReportsView } from './components/ReportsView';
import { InventoryView } from './components/InventoryView';
import { ReceiptScannerView } from './components/ReceiptScannerView';
import { AdminUsersView } from './components/AdminUsersView';
import { KitchenView } from './components/KitchenView';
import { GoogleSheetsView } from './components/GoogleSheetsView';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const POSAppContent: React.FC = () => {
  const { activeTab, isGuestMode, toastMessage } = usePOS();

  const renderContent = () => {
    if (isGuestMode) {
      return <CustomerOrderView />;
    }

    switch (activeTab) {
      case 'pos':
        return <POSView />;
      case 'customer':
        return <CustomerOrderView />;
      case 'reports':
        return <ReportsView />;
      case 'inventory':
        return <InventoryView />;
      case 'receipts':
        return <ReceiptScannerView />;
      case 'users':
        return <AdminUsersView />;
      case 'kitchen':
      case 'orders':
        return <KitchenView />;
      case 'sheets':
        return (
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <GoogleSheetsView />
          </div>
        );
      default:
        return <POSView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navigation & Role Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full">{renderContent()}</main>

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <POSProvider>
      <POSAppContent />
    </POSProvider>
  );
}
