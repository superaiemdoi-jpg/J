import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { Ingredient } from '../types/pos';
import { AddEditIngredientModal } from './AddEditIngredientModal';
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  TrendingDown,
  RotateCcw,
  Calendar,
  DollarSign,
  Filter,
  X,
  Edit2,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    lowStockItems,
    restockItem,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    addExpense,
    currentUser,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowOnly, setFilterLowOnly] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [deletingItem, setDeletingItem] = useState<Ingredient | null>(null);

  // Restock modal state
  const [restockingItem, setRestockingItem] = useState<Ingredient | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('5');
  const [restockCost, setRestockCost] = useState<string>('');
  const [recordAsExpense, setRecordAsExpense] = useState<boolean>(true);

  const categories = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'meat', label: 'เนื้อสัตว์' },
    { id: 'vegetable', label: 'ผักและเครื่องเทศ' },
    { id: 'seasoning', label: 'เครื่องปรุงและซอส' },
    { id: 'staple', label: 'วัตถุดิบหลัก' },
    { id: 'beverage', label: 'เครื่องดื่ม' },
    { id: 'packaging', label: 'บรรจุภัณฑ์' },
  ];

  const filteredInventory = inventory.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowOnly = !filterLowOnly || item.currentStock <= item.minThreshold;
    return matchesCat && matchesSearch && matchesLowOnly;
  });

  const totalStockValue = inventory.reduce(
    (sum, item) => sum + item.currentStock * item.costPerUnit,
    0
  );

  const handleOpenRestock = (item: Ingredient) => {
    setRestockingItem(item);
    setRestockAmount('5');
    setRestockCost((item.costPerUnit * 5).toString());
    setRecordAsExpense(true);
  };

  const handleConfirmRestock = () => {
    if (!restockingItem) return;
    const qty = parseFloat(restockAmount) || 0;
    const costTotal = parseFloat(restockCost) || 0;
    const unitCost = qty > 0 && costTotal > 0 ? costTotal / qty : restockingItem.costPerUnit;

    // 1. Update stock in inventory
    restockItem(restockingItem.id, qty, unitCost);

    // 2. Optionally record as accounting expense
    if (recordAsExpense && costTotal > 0) {
      addExpense({
        merchantName: `ซื้อวัตถุดิบ: ${restockingItem.name}`,
        date: new Date().toISOString().split('T')[0],
        category: 'วัตถุดิบอาหาร',
        items: [
          {
            name: `${restockingItem.name} (${qty} ${restockingItem.unit})`,
            quantity: qty,
            unitPrice: unitCost,
            amount: costTotal,
          },
        ],
        subtotal: costTotal,
        tax: 0,
        total: costTotal,
        paymentMethod: 'เงินสด / โอนเงิน',
        notes: `เติมสต็อกเข้าระบบ โดย ${currentUser.name}`,
        createdBy: currentUser.name,
      });
    }

    setRestockingItem(null);
  };

  const handleConfirmDelete = () => {
    if (deletingItem) {
      deleteIngredient(deletingItem.id);
      setDeletingItem(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              จัดการคลังวัตถุดิบและสต็อก (Inventory)
            </h1>
            <p className="text-xs text-slate-500">
              ควบคุมสต็อก ตัดยอดตามสูตรอาหาร เติมสินค้า และเพิ่ม/แก้ไข/ลบรายการวัตถุดิบ
            </p>
          </div>
        </div>

        <button
          id="btn-add-ingredient"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มวัตถุดิบใหม่</span>
        </button>
      </div>

      {/* Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">จำนวนวัตถุดิบทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{inventory.length} รายการ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">วัตถุดิบใกล้หมดสต็อก (Alert)</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{lowStockItems.length} รายการ</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">มูลค่าสินค้าในคลังคงเหลือ</p>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">
              ฿{Math.round(totalStockValue).toLocaleString()}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Critical Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-900">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
            <div>
              <h3 className="font-bold text-sm">
                ระบบแจ้งเตือน: วัตถุดิบลดต่ำกว่าจุดปลอดภัย ({lowStockItems.length} รายการ)
              </h3>
              <p className="text-xs text-rose-700">
                รายการด้านล่างนี้จำเป็นต้องสั่งซื้อหรือเติมสต็อกด่วนเพื่อไม่ให้กระทบการขายหน้าร้าน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-white rounded-xl border border-rose-200 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                    คงเหลือ {item.currentStock} {item.unit} (เกณฑ์แจ้งเตือน {item.minThreshold} {item.unit})
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRestock(item)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  เติมสต็อก
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อวัตถุดิบ..."
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:border-amber-500 outline-none"
            />
          </div>

          <button
            onClick={() => setFilterLowOnly(!filterLowOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              filterLowOnly
                ? 'bg-rose-500 text-white border-rose-500'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>เฉพาะที่ใกล้หมด ({lowStockItems.length})</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">ชื่อวัตถุดิบ / สินค้า</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">ระดับสต็อกปัจจุบัน</th>
                <th className="py-3 px-4">เกณฑ์เตือน</th>
                <th className="py-3 px-4">ต้นทุน/หน่วย</th>
                <th className="py-3 px-4">มูลค่ารวม</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">ไม่พบข้อมูลวัตถุดิบ</p>
                    <p className="text-xs text-slate-400 mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "เพิ่มวัตถุดิบใหม่" ด้านบน</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  const percent = Math.min(100, Math.round((item.currentStock / (item.minThreshold * 2.5 || 1)) * 100));

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-extrabold text-slate-900 text-sm">
                            {item.currentStock} {item.unit}
                          </span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isLow ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {item.minThreshold} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        ฿{item.costPerUnit} / {item.unit}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        ฿{Math.round(item.currentStock * item.costPerUnit).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-500" /> ใกล้หมด
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> ปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenRestock(item)}
                            title="เติมสต็อกสินค้า"
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                          >
                            + เติมสต็อก
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            title="แก้ไขข้อมูลวัตถุดิบ"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            title="ลบวัตถุดิบนี้"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal */}
      <AddEditIngredientModal
        isOpen={isAddModalOpen || !!editingItem}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={addIngredient}
        onUpdate={updateIngredient}
        onDelete={deleteIngredient}
        initialItem={editingItem}
      />

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">ยืนยันการลบวัตถุดิบ</h3>
                <p className="text-xs text-slate-500">รหัส: {deletingItem.id}</p>
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-600">
              <p>
                คุณต้องการลบวัตถุดิบ <strong className="text-slate-900 text-sm font-bold">"{deletingItem.name}"</strong> ออกจากระบบคลังใช่หรือไม่?
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>หมวดหมู่:</span>
                  <span className="font-semibold text-slate-800">{deletingItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span>คงเหลือปัจจุบัน:</span>
                  <span className="font-semibold text-slate-800">
                    {deletingItem.currentStock} {deletingItem.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>ต้นทุนต่อหน่วย:</span>
                  <span className="font-semibold text-slate-800">฿{deletingItem.costPerUnit}</span>
                </div>
              </div>
              <p className="text-rose-600 text-[11px]">
                ⚠️ หากมีเมนูอาหารใดที่ผูกกับวัตถุดิบนี้ เมนูนั้นจะไม่สามารถตัดสต็อกอัตโนมัติได้
              </p>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-semibold cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Action Modal */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">เติมสต็อก: {restockingItem.name}</h4>
                  <p className="text-xs text-slate-400">
                    คงเหลือปัจจุบัน {restockingItem.currentStock} {restockingItem.unit}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRestockingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  จำนวนที่ต้องการเติม ({restockingItem.unit}):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={restockAmount}
                  onChange={(e) => {
                    const amt = e.target.value;
                    setRestockAmount(amt);
                    const n = parseFloat(amt) || 0;
                    setRestockCost((n * restockingItem.costPerUnit).toString());
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-base outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ยอดเงินที่ซื้อ (บาท):
                </label>
                <input
                  type="number"
                  value={restockCost}
                  onChange={(e) => setRestockCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold text-base outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordAsExpense}
                    onChange={(e) => setRecordAsExpense(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>บันทึกลงในค่าใช้จ่ายบัญชีร้านอัตโนมัติ (P&L Expense)</span>
                </label>
                <p className="text-[11px] text-slate-500 pl-5">
                  ระบบจะลงรายการเป็นรายจ่ายหมวดวัตถุดิบและนำไปคำนวณกำไรขาดทุนทันที
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs cursor-pointer"
              >
                ยืนยันการเติมสต็อก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
