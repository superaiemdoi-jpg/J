import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import {
  UtensilsCrossed,
  ChefHat,
  Package,
  ScanLine,
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Sparkles,
  QrCode,
  LogOut,
  FileSpreadsheet,
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/pos';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    restaurantName,
    currentUser,
    users,
    switchUser,
    loginWithPin,
    switchToGuestMode,
    lowStockItems,
    googleScriptStatus,
    showToast,
  } = usePOS();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showSwitchModal, setShowSwitchModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateStr = now.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    const success = loginWithPin(pinInput);
    if (success) {
      setPinInput('');
      setPinError('');
      setShowSwitchModal(false);
    } else {
      setPinError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'แอดมิน / เจ้าของร้าน', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'CASHIER':
        return { label: 'แคชเชียร์', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'KITCHEN':
        return { label: 'เชฟ / ครัว', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'INVENTORY_MGR':
        return { label: 'จัดการสต็อก', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'CUSTOMER_GUEST':
        return { label: 'ลูกค้าทั่วไป (Guest)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: 'ผู้ใช้ทั่วไป', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const isGuestMode = currentUser.role === 'CUSTOMER_GUEST';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        {/* Top bar info */}
        <div className="flex items-center justify-between px-4 py-2.5 max-w-7xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isGuestMode) {
                  setActiveTab('customer-self');
                } else {
                  setActiveTab('pos');
                }
              }}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 tracking-tight text-base sm:text-lg">
                    {restaurantName}
                  </span>
                  <span className="hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                    POS Pro
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal">ระบบจัดการร้านอาหารและออเดอร์ครบวงจร</p>
              </div>
            </button>
          </div>

          {/* Center / Time Display */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{currentTime}</span>
          </div>

          {/* Right Action & User Profile Switcher */}
          <div className="flex items-center gap-2">
            {/* Quick Toggle Customer Mode Button */}
            {!isGuestMode ? (
              <button
                id="btn-switch-to-customer-guest"
                onClick={switchToGuestMode}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors shadow-2xs"
                title="สลับเป็นหน้าสั่งอาหารสำหรับลูกค้า (ไม่ต้องล็อกอิน)"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>โหมดลูกค้าสั่งเอง</span>
              </button>
            ) : (
              <button
                id="btn-return-to-staff"
                onClick={() => setShowSwitchModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-2xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>เข้าสู่ระบบเจ้าหน้าที่ (Staff Login)</span>
              </button>
            )}

            {/* Quick Google Sheets Cloud Database Status & Config Button */}
            {!isGuestMode && (
              <button
                id="btn-quick-sheets"
                onClick={() => setActiveTab('sheets')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  googleScriptStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="ตั้งค่าฐานข้อมูล Google Sheets & Google Apps Script"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Sheets</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    googleScriptStatus === 'connected'
                      ? 'bg-emerald-500'
                      : googleScriptStatus === 'syncing'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-slate-400'
                  }`}
                />
              </button>
            )}

            {/* Current user badge & Switch trigger */}
            <button
              id="btn-open-user-switch"
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[130px]">
                  {currentUser.name}
                </p>
                <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Only for staff roles, or customer view in guest mode) */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {!isGuestMode ? (
              <>
                {currentUser.permissions.canTakeOrders && (
                  <button
                    id="tab-pos"
                    onClick={() => setActiveTab('pos')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'pos'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>ขายหน้าร้าน (POS)</span>
                  </button>
                )}

                {currentUser.permissions.canAccessKitchen && (
                  <button
                    id="tab-kitchen"
                    onClick={() => setActiveTab('kitchen')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'kitchen'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>หน้าจอครัว (KDS)</span>
                  </button>
                )}

                {currentUser.permissions.canManageInventory && (
                  <button
                    id="tab-inventory"
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap relative ${
                      activeTab === 'inventory'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>คลังวัตถุดิบ</span>
                    {lowStockItems.length > 0 && (
                      <span className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {lowStockItems.length}
                      </span>
                    )}
                  </button>
                )}

                {currentUser.permissions.canScanReceipts && (
                  <button
                    id="tab-receipts"
                    onClick={() => setActiveTab('receipts')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'receipts'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>สแกนใบเสร็จ AI</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-100 text-sky-700 font-bold">
                      Gemini
                    </span>
                  </button>
                )}

                {currentUser.permissions.canViewReports && (
                  <button
                    id="tab-reports"
                    onClick={() => setActiveTab('reports')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'reports'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>สรุปยอดขาย & กำไรขาดทุน (P&L)</span>
                  </button>
                )}

                <button
                  id="tab-orders"
                  onClick={() => setActiveTab('orders')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'orders'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>ประวัติออเดอร์</span>
                </button>

                {currentUser.permissions.canManageUsers && (
                  <button
                    id="tab-users"
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === 'users'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>จัดการสิทธิ์ผู้ใช้งาน</span>
                  </button>
                )}

                <button
                  id="tab-sheets"
                  onClick={() => setActiveTab('sheets')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'sheets'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Google Sheets Database</span>
                </button>
              </>
            ) : (
              <div className="py-1 flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-800">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>โหมดสั่งอาหารด้วยตัวเองสำหรับลูกค้า (ไม่ต้องลงทะเบียน/ล็อกอิน)</span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  เลือกเมนู กำหนดระดับความเผ็ด และสแกน QR Code ชำระเงินได้ทันที
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Global Low Stock Alert Strip if any ingredient is critical */}
        {!isGuestMode && lowStockItems.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
              <div className="truncate">
                <span className="font-semibold text-amber-950">แจ้งเตือนวัตถุดิบใกล้หมด ({lowStockItems.length} รายการ): </span>
                <span className="text-amber-800">
                  {lowStockItems.map((i) => `${i.name} (เหลือ ${i.currentStock} ${i.unit})`).join(', ')}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="ml-auto shrink-0 font-bold underline hover:text-amber-950 text-xs"
              >
                ดูสต็อกและเติมสินค้า →
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Switch User / PIN Login Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">สลับตำแหน่งงาน / ผู้ใช้งาน</h3>
                  <p className="text-xs text-slate-500">เลือกโปรไฟล์หรือกรอกรหัส PIN เพื่อเข้าสู่ระบบ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSwitchModal(false);
                  setPinError('');
                  setPinInput('');
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Quick Select Buttons for demo ease */}
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">
                  เลือกผู้ใช้งานด่วน (คลิกเพื่อสลับทันที):
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {users.map((u) => {
                    const b = getRoleBadge(u.role);
                    const isCurrent = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u);
                          setShowSwitchModal(false);
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isCurrent
                            ? 'border-amber-500 bg-amber-50/60 ring-1 ring-amber-500'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={u.name}
                            className="w-8 h-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">{u.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${b.color}`}>
                              {b.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {u.pin ? `PIN: ${u.pin}` : 'ไม่ต้องใช้ PIN'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">หรือกรอกรหัส PIN เจ้าหน้าที่</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* PIN input form */}
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    รหัส PIN 4 หลัก (เช่น 1234 สำหรับแอดมิน)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError('');
                    }}
                    placeholder="••••"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                    autoFocus
                  />
                  {pinError && <p className="text-xs text-rose-500 mt-1 font-medium">{pinError}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={switchToGuestMode}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    โหมดลูกค้าทั่วไป (No PIN)
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors shadow-xs"
                  >
                    เข้าสู่ระบบด้วย PIN
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
