import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Order } from '../types/pos';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Calendar,
  CreditCard,
  QrCode,
  Banknote,
  Users,
  Clock,
  Printer,
  FileSpreadsheet,
  ChevronRight,
  Eye,
  X,
  Award,
} from 'lucide-react';

interface ItemSale {
  name: string;
  quantity: number;
  revenue: number;
}

export const ReportsView: React.FC = () => {
  const { orders, expenses, restaurantName } = usePOS();
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [selectedOrderForSlip, setSelectedOrderForSlip] = useState<Order | null>(null);

  // Filter orders and expenses based on period
  const todayStr = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const filteredOrders = orders.filter((o) => {
    const orderDate = o.createdAt.split('T')[0];
    if (selectedPeriod === 'today') return orderDate === todayStr;
    if (selectedPeriod === 'week') return orderDate >= sevenDaysAgo;
    if (selectedPeriod === 'month') return orderDate.startsWith(thisMonthStr);
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (selectedPeriod === 'today') return e.date === todayStr;
    if (selectedPeriod === 'week') return e.date >= sevenDaysAgo;
    if (selectedPeriod === 'month') return e.date.startsWith(thisMonthStr);
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.netTotal, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.total, 0);
  const totalCogs = filteredOrders.reduce((sum, o) => {
    const orderCogs = o.items.reduce((iSum, item) => iSum + (item.cost || 0) * item.quantity, 0);
    return sum + orderCogs;
  }, 0);
  const netProfit = totalRevenue - totalExpenses - totalCogs;
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  const pl = {
    totalRevenue,
    totalExpenses,
    totalCogs,
    netProfit,
    profitMargin,
  };

  // Payment Breakdown
  const paymentBreakdown = filteredOrders.reduce(
    (acc, order) => {
      const method = order.paymentMethod || 'OTHER';
      acc[method] = (acc[method] || 0) + order.netTotal;
      return acc;
    },
    {} as Record<string, number>
  );

  // Top Selling Items
  const itemSales: Record<string, ItemSale> = {};
  filteredOrders.forEach((o) => {
    o.items.forEach((item) => {
      if (!itemSales[item.name]) {
        itemSales[item.name] = { name: item.name, quantity: 0, revenue: 0 };
      }
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.totalPrice;
    });
  });

  const topSellingItems: ItemSale[] = Object.values(itemSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const averageOrderValue =
    filteredOrders.length > 0 ? Math.round(pl.totalRevenue / filteredOrders.length) : 0;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            รายงานสรุปยอดขายและกำไรขาดทุน (P&L Analytics)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            สรุปผลประกอบการร้านอาหาร ค่าใช้จ่ายจากการสแกนใบเสร็จ และประวัติการสั่งซื้อลูกค้า
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex gap-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setSelectedPeriod('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === 'today'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === 'week'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === 'month'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setSelectedPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPeriod === 'all'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
          </div>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ยอดขายรวม (Total Revenue)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            ฿{pl.totalRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">จาก {filteredOrders.length} ออเดอร์ที่ชำระสำเร็จ</p>
        </div>

        {/* Total Expenses */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ค่าใช้จ่ายรวม (Expenses & COGS)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-600">
            ฿{pl.totalExpenses.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">จากใบเสร็จ & การซื้อสต็อก {filteredExpenses.length} ใบ</p>
        </div>

        {/* Net Profit / Loss */}
        <div
          className={`p-5 rounded-2xl border shadow-xs space-y-2 ${
            pl.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
              : 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">กำไรสุทธิ (Net Profit)</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                pl.netProfit >= 0 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {pl.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <p
            className={`text-2xl font-extrabold ${
              pl.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {pl.netProfit >= 0 ? '+' : ''}฿{pl.netProfit.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <span
              className={`px-1.5 py-0.5 rounded ${
                pl.netProfit >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}
            >
              อัตรากำไร: {pl.profitMargin}%
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">ยอดซื้อเฉลี่ย / บิล (AOV)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">฿{averageOrderValue.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400">
            ยอดขายเฉลี่ยต่อโต๊ะ/ลูกค้า
          </p>
        </div>
      </div>

      {/* Middle Row: Payment Methods & Top Selling Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Payment Methods Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-600" />
            <span>สัดส่วนช่องทางการชำระเงิน</span>
          </h3>

          <div className="space-y-3">
            {[
              { id: 'PROMPTPAY_QR', label: 'PromptPay QR Code', icon: QrCode, color: 'bg-blue-600' },
              { id: 'CASH', label: 'เงินสด (Cash)', icon: Banknote, color: 'bg-emerald-600' },
              { id: 'CREDIT_CARD', label: 'บัตรเครดิต (Credit Card)', icon: CreditCard, color: 'bg-purple-600' },
              { id: 'TRANSFER', label: 'โอนบัญชีธนาคาร', icon: Receipt, color: 'bg-indigo-600' },
            ].map((p) => {
              const amount = paymentBreakdown[p.id] || 0;
              const pct = pl.totalRevenue > 0 ? Math.round((amount / pl.totalRevenue) * 100) : 0;
              const Icon = p.icon;

              return (
                <div key={p.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-medium text-slate-700">{p.label}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      ฿{amount.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Dishes (7 cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>เมนูอาหารยอดขายสูงสุด 5 อันดับแรก</span>
            </h3>
            <span className="text-xs text-slate-400">เรียงตามจำนวนจาน</span>
          </div>

          <div className="divide-y divide-slate-100">
            {topSellingItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">ยังไม่มีข้อมูลยอดขายในรอบนี้</p>
            ) : (
              topSellingItems.map((dish, idx) => (
                <div key={dish.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-[11px] ${
                        idx === 0
                          ? 'bg-amber-500 text-white'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-700'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">{dish.name}</p>
                      <p className="text-[11px] text-slate-500">ขายได้ {dish.quantity} จาน/ที่</p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="font-extrabold text-slate-900">
                      ฿{dish.revenue.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block">ยอดขาย</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Customer Orders History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              ประวัติการสั่งซื้อลูกค้า (Customer Order History) - {filteredOrders.length} รายการ
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            บันทึกทั้งลูกค้าทั่วไป (Guest Mode) และลูกค้าในร้าน
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">เลขที่บิล</th>
                <th className="py-3 px-4">เวลา / วันที่</th>
                <th className="py-3 px-4">โต๊ะ / บริการ</th>
                <th className="py-3 px-4">ชื่อลูกค้า</th>
                <th className="py-3 px-4">รายการอาหาร</th>
                <th className="py-3 px-4">ชำระผ่าน</th>
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4 text-right">ยอดสุทธิ (บาท)</th>
                <th className="py-3 px-4 text-center">ดูใบเสร็จ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    ไม่มีรายการคำสั่งซื้อในช่วงเวลานี้
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(ord.createdAt).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {ord.tableNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ord.customerName}</div>
                      <span className="text-[10px] text-slate-400">
                        {ord.customerType === 'guest' ? 'ลูกค้าทั่วไป (Self-Service)' : 'สมาชิก / หน้าร้าน'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {ord.items.map((i) => `${i.name} (${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{ord.staffName}</td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                      ฿{ord.netTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedOrderForSlip(ord)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100"
                        title="ดูใบเสร็จฉบับเต็ม"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slip Modal View */}
      {selectedOrderForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">ใบเสร็จรับเงิน</h4>
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Slip Paper */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <h4 className="font-bold text-sm text-slate-900">{restaurantName}</h4>
                <p className="text-[10px] text-slate-400">บิล: {selectedOrderForSlip.orderNumber}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(selectedOrderForSlip.createdAt).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <span>{selectedOrderForSlip.tableNumber}</span>
                <span>ลูกค้า: {selectedOrderForSlip.customerName}</span>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {selectedOrderForSlip.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="flex-1 truncate">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-bold">฿{item.totalPrice}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>ยอดรวม:</span>
                  <span>฿{selectedOrderForSlip.subtotal}</span>
                </div>
                {selectedOrderForSlip.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ส่วนลด:</span>
                    <span>-฿{selectedOrderForSlip.discount}</span>
                  </div>
                )}
                {selectedOrderForSlip.vat > 0 && (
                  <div className="flex justify-between">
                    <span>VAT 7%:</span>
                    <span>+฿{selectedOrderForSlip.vat}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                  <span>ยอดสุทธิ:</span>
                  <span className="text-amber-600">฿{selectedOrderForSlip.netTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                onClick={() => setSelectedOrderForSlip(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
