import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Order, OrderStatus } from '../types/pos';
import {
  ChefHat,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Flame,
  Utensils,
  Search,
  Filter,
  RotateCcw,
  Ban,
  Undo2,
  ShoppingBag,
  Info,
  Calendar,
} from 'lucide-react';

type TabStatus = 'pending' | 'completed' | 'cancelled' | 'all';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus, cancelOrder } = usePOS();

  // Tab filter: 'pending' (ต้องดำเนินการ), 'completed' (ทำเสร็จแล้ว), 'cancelled' (ยกเลิกแล้ว), 'all' (ทั้งหมด)
  const [selectedTab, setSelectedTab] = useState<TabStatus>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'dine-in' | 'takeaway'>('all');
  
  // State for cancellation confirmation modal
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Helper categorization
  const isOrderPending = (status: OrderStatus) => status === 'pending' || status === 'cooking';
  const isOrderCompleted = (status: OrderStatus) => status === 'ready' || status === 'served' || status === 'completed';
  const isOrderCancelled = (status: OrderStatus) => status === 'cancelled';

  // Total counts across all orders
  const pendingOrdersAll = useMemo(() => orders.filter((o) => isOrderPending(o.status)), [orders]);
  const completedOrdersAll = useMemo(() => orders.filter((o) => isOrderCompleted(o.status)), [orders]);
  const cancelledOrdersAll = useMemo(() => orders.filter((o) => isOrderCancelled(o.status)), [orders]);

  // Filter orders by search & order type
  const filterBySearchAndType = (list: Order[]) => {
    return list.filter((ord) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        ord.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ord.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        orderTypeFilter === 'all' || ord.orderType === orderTypeFilter;

      return matchesSearch && matchesType;
    });
  };

  const filteredPending = useMemo(() => filterBySearchAndType(pendingOrdersAll), [pendingOrdersAll, searchQuery, orderTypeFilter]);
  const filteredCompleted = useMemo(() => filterBySearchAndType(completedOrdersAll), [completedOrdersAll, searchQuery, orderTypeFilter]);
  const filteredCancelled = useMemo(() => filterBySearchAndType(cancelledOrdersAll), [cancelledOrdersAll, searchQuery, orderTypeFilter]);

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      cancelOrder(orderToCancel.id);
      setOrderToCancel(null);
    }
  };

  // Render individual Order Card
  const renderOrderCard = (ord: Order) => {
    const isPending = isOrderPending(ord.status);
    const isCompleted = isOrderCompleted(ord.status);
    const isCancelled = isOrderCancelled(ord.status);

    return (
      <div
        key={ord.id}
        id={`order-card-${ord.id}`}
        className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 ${
          isCancelled
            ? 'border-slate-300 opacity-80 bg-slate-50/50'
            : isCompleted
            ? 'border-emerald-300 ring-1 ring-emerald-500/10'
            : 'border-amber-400 ring-1 ring-amber-500/20 hover:shadow-md'
        }`}
      >
        {/* Card Header */}
        <div
          className={`p-3.5 sm:p-4 text-white flex items-start justify-between ${
            isCancelled
              ? 'bg-slate-700'
              : isCompleted
              ? 'bg-gradient-to-r from-emerald-800 to-teal-800'
              : 'bg-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-base sm:text-lg ${
                  isCancelled
                    ? 'text-rose-300 line-through'
                    : isCompleted
                    ? 'text-emerald-300'
                    : 'text-amber-400'
                }`}
              >
                {ord.tableNumber}
              </span>
              {ord.orderType === 'takeaway' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
                  <ShoppingBag className="w-2.5 h-2.5" /> กลับบ้าน
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">{ord.orderNumber}</p>
          </div>

          <div className="text-right space-y-1">
            {/* Status Pill */}
            <div>
              {isPending && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                  <Flame className="w-2.5 h-2.5" /> กำลังปรุง / รอดำเนินการ
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle className="w-2.5 h-2.5" /> ปรุงเสร็จแล้ว
                </span>
              )}
              {isCancelled && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <Ban className="w-2.5 h-2.5" /> ยกเลิกออเดอร์แล้ว
                </span>
              )}
            </div>

            {/* Time & Payment */}
            <div className="flex items-center justify-end gap-2 text-[11px] font-mono text-slate-300">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {new Date(ord.createdAt).toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  ord.paymentStatus === 'paid'
                    ? 'bg-emerald-500/30 text-emerald-200'
                    : 'bg-amber-500/30 text-amber-200'
                }`}
              >
                {ord.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'รอชำระ'}
              </span>
            </div>
          </div>
        </div>

        {/* Card Items List */}
        <div className="p-3.5 sm:p-4 divide-y divide-slate-100 flex-1 space-y-2">
          {ord.items.map((item, itemIdx) => (
            <div
              key={itemIdx}
              className={`pt-2 first:pt-0 flex items-start justify-between gap-2 text-xs ${
                isCancelled ? 'opacity-60' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-black text-xs px-1.5 py-0.5 rounded-md ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCancelled
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {item.quantity}x
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      isCancelled
                        ? 'line-through text-slate-500'
                        : 'text-slate-900'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                {/* Custom Options / Notes */}
                <div className="text-[11px] text-slate-500 mt-1 pl-6 space-y-0.5">
                  {item.options?.spiciness && (
                    <span className="inline-block mr-1 text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                      🌶️ {item.options.spiciness}
                    </span>
                  )}
                  {item.options?.meatChoice && (
                    <span className="inline-block mr-1 text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-medium">
                      🥩 {item.options.meatChoice}
                    </span>
                  )}
                  {item.options?.addOns?.map((a) => (
                    <span
                      key={a.name}
                      className="inline-block mr-1 text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium"
                    >
                      +{a.name}
                    </span>
                  ))}
                  {item.options?.note && (
                    <p className="text-rose-600 font-bold italic mt-0.5">
                      ⚠️ หมายเหตุ: {item.options.note}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {ord.notes && (
            <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-2">
              <span className="font-semibold text-slate-800">บันทึกเพิ่มเติม:</span> {ord.notes}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
            ลูกค้า: <span className="font-semibold text-slate-700">{ord.customerName}</span>
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Action for PENDING / IN-PROGRESS */}
            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => setOrderToCancel(ord)}
                  title="ยกเลิกออเดอร์นี้"
                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ยกเลิก</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'completed')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>ปรุงเสร็จแล้ว</span>
                </button>
              </>
            )}

            {/* Action for COMPLETED */}
            {isCompleted && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> เสร็จเรียบร้อย
                </span>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'cooking')}
                  title="ย้อนกลับไปสถานะกำลังปรุง"
                  className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-600 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span className="hidden sm:inline">ทำต่อ</span>
                </button>
              </div>
            )}

            {/* Action for CANCELLED */}
            {isCancelled && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> ยกเลิกแล้ว
                </span>
                <button
                  type="button"
                  onClick={() => updateOrderStatus(ord.id, 'cooking')}
                  title="กู้คืนออเดอร์นี้กลับมาดำเนินการใหม่"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>กู้คืน</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              หน้าจอสั่งการห้องครัว (Kitchen Display System - KDS)
            </h1>
            <p className="text-xs text-slate-500">
              รับรายการอาหารแบบเรียลไทม์ แยกสถานะชัดเจนสำหรับเชฟและพนักงาน
            </p>
          </div>
        </div>

        {/* Stat Summary Counter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold whitespace-nowrap shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>ต้องทำ: {pendingOrdersAll.length} บิล</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold whitespace-nowrap shadow-2xs">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>เสร็จแล้ว: {completedOrdersAll.length} บิล</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs font-bold whitespace-nowrap shadow-2xs">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            <span>ยกเลิก: {cancelledOrdersAll.length} บิล</span>
          </div>
        </div>
      </div>

      {/* Main Status Tabs & Controls */}
      <div className="space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Navigation Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2 border-b border-slate-100 pb-3">
          <button
            id="tab-kds-pending"
            type="button"
            onClick={() => setSelectedTab('pending')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>ที่ต้องดำเนินการ</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                selectedTab === 'pending'
                  ? 'bg-white text-amber-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {filteredPending.length}
            </span>
          </button>

          <button
            id="tab-kds-completed"
            type="button"
            onClick={() => setSelectedTab('completed')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>ทำเสร็จแล้ว</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                selectedTab === 'completed'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {filteredCompleted.length}
            </span>
          </button>

          <button
            id="tab-kds-cancelled"
            type="button"
            onClick={() => setSelectedTab('cancelled')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedTab === 'cancelled'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Ban className="w-4 h-4" />
            <span>ยกเลิกแล้ว</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                selectedTab === 'cancelled'
                  ? 'bg-white text-rose-700'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {filteredCancelled.length}
            </span>
          </button>

          <button
            id="tab-kds-all"
            type="button"
            onClick={() => setSelectedTab('all')}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>แสดงแยกทุกสถานะ (ทั้งหมด)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                selectedTab === 'all'
                  ? 'bg-white text-slate-900'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredPending.length + filteredCompleted.length + filteredCancelled.length}
            </span>
          </button>
        </div>

        {/* Search & Sub-filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between pt-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="kds-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาโต๊ะ, เลขออเดอร์, หรือชื่อเมนูอาหาร..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 pl-1">
              <Filter className="w-3 h-3" /> ประเภท:
            </span>
            <button
              type="button"
              onClick={() => setOrderTypeFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                orderTypeFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setOrderTypeFilter('dine-in')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                orderTypeFilter === 'dine-in'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ทานที่ร้าน
            </button>
            <button
              type="button"
              onClick={() => setOrderTypeFilter('takeaway')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                orderTypeFilter === 'takeaway'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              กลับบ้าน
            </button>
          </div>
        </div>
      </div>

      {/* Content Area: Filtered Tab or All Categories Grouped */}
      {selectedTab === 'pending' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              รายการออเดอร์ที่ต้องดำเนินการ (กำลังปรุง)
            </h2>
            <span className="text-xs text-slate-500">
              พบ {filteredPending.length} รายการ
            </span>
          </div>

          {filteredPending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">ไม่มีออเดอร์ค้างทำในครัว 🎉</h3>
              <p className="text-xs text-slate-500">
                รายการอาหารทั้งหมดได้รับการปรุงเสร็จเรียบร้อยแล้ว
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPending.map((ord) => renderOrderCard(ord))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'completed' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              รายการออเดอร์ที่ทำเสร็จแล้ว
            </h2>
            <span className="text-xs text-slate-500">
              พบ {filteredCompleted.length} รายการ
            </span>
          </div>

          {filteredCompleted.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <Utensils className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">ยังไม่มีรายการที่ทำเสร็จ</h3>
              <p className="text-xs text-slate-500">เมื่อปรุงอาหารเสร็จแล้ว รายการจะแสดงที่นี่</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompleted.map((ord) => renderOrderCard(ord))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'cancelled' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              รายการออเดอร์ที่ยกเลิกแล้ว
            </h2>
            <span className="text-xs text-slate-500">
              พบ {filteredCancelled.length} รายการ
            </span>
          </div>

          {filteredCancelled.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">ไม่มีรายการออเดอร์ที่ถูกยกเลิก</h3>
              <p className="text-xs text-slate-500">ไม่มีบิลที่ถูกยกเลิกในระบบ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCancelled.map((ord) => renderOrderCard(ord))}
            </div>
          )}
        </div>
      )}

      {/* ALL TAB: Shows 3 separated status sections */}
      {selectedTab === 'all' && (
        <div className="space-y-8">
          {/* Section 1: Pending */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200">
              <h2 className="text-sm sm:text-base font-extrabold text-amber-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                1. ออเดอร์ที่ต้องดำเนินการ ({filteredPending.length})
              </h2>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {filteredPending.length} บิลในคิว
              </span>
            </div>

            {filteredPending.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                ไม่มีออเดอร์ที่ต้องดำเนินการ
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPending.map((ord) => renderOrderCard(ord))}
              </div>
            )}
          </div>

          {/* Section 2: Completed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
              <h2 className="text-sm sm:text-base font-extrabold text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                2. ออเดอร์ที่ทำเสร็จแล้ว ({filteredCompleted.length})
              </h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {filteredCompleted.length} บิลพร้อมเสิร์ฟ
              </span>
            </div>

            {filteredCompleted.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                ไม่มีออเดอร์ที่ทำเสร็จแล้ว
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompleted.map((ord) => renderOrderCard(ord))}
              </div>
            )}
          </div>

          {/* Section 3: Cancelled */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-rose-200">
              <h2 className="text-sm sm:text-base font-extrabold text-rose-900 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                3. ออเดอร์ที่ยกเลิกแล้ว ({filteredCancelled.length})
              </h2>
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                {filteredCancelled.length} บิลยกเลิก
              </span>
            </div>

            {filteredCancelled.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">
                ไม่มีรายการที่ถูกยกเลิก
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCancelled.map((ord) => renderOrderCard(ord))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">ยืนยันการยกเลิกออเดอร์</h3>
                <p className="text-xs text-slate-500">
                  {orderToCancel.tableNumber} • {orderToCancel.orderNumber}
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-600">
              <p>คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?</p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">รายการอาหาร:</span>
                {orderToCancel.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-semibold text-slate-700">฿{i.totalPrice}</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900 text-xs">
                  <span>ยอดรวม:</span>
                  <span>฿{orderToCancel.netTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                ปิด / ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                ยืนยันยกเลิกออเดอร์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
