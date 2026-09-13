import React, { useState, useEffect } from 'react';
import { Ingredient } from '../types/pos';
import {
  X,
  Plus,
  Trash2,
  Package,
  AlertTriangle,
  DollarSign,
  Scale,
  Layers,
  Check,
  AlertCircle,
} from 'lucide-react';

interface AddEditIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<Ingredient, 'id' | 'lastRestockedAt'>) => void;
  onUpdate?: (id: string, itemData: Partial<Omit<Ingredient, 'id'>>) => void;
  onDelete?: (id: string) => void;
  initialItem?: Ingredient | null;
}

const CATEGORY_OPTIONS: {
  id: Ingredient['category'];
  label: string;
  icon: string;
  desc: string;
}[] = [
  { id: 'meat', label: 'เนื้อสัตว์และอาหารทะเล', icon: '🥩', desc: 'หมู, ไก่, กุ้ง, ปลาหมึก, หมูกรอบ' },
  { id: 'vegetable', label: 'ผักและพืชสมุนไพร', icon: '🥬', desc: 'ใบกะเพรา, มะนาว, พริก, กระเทียม, หอมแดง' },
  { id: 'seasoning', label: 'เครื่องปรุงและซอส', icon: '🧂', desc: 'น้ำปลา, ซีอิ๊ว, ซอสหอยนางรม, น้ำตาล' },
  { id: 'staple', label: 'วัตถุดิบหลัก / ข้าว-แป้ง', icon: '🌾', desc: 'ข้าวหอมมะลิ, เส้นก๋วยเตี๋ยว, แป้งทอด' },
  { id: 'beverage', label: 'เครื่องดื่มและชา', icon: '🧃', desc: 'ใบชาไทย, ผงกาแฟ, นมสด, นมข้น' },
  { id: 'packaging', label: 'บรรจุภัณฑ์', icon: '📦', desc: 'กล่องกระดาษ, ถุงหิ้ว, ช้อนส้อม, แก้ว' },
];

const UNIT_PRESETS = [
  'กก.',
  'กรัม',
  'ฟอง',
  'ลิตร',
  'มล.',
  'ขวด',
  'กระป๋อง',
  'ใบ',
  'มัด',
  'แพ็ค',
];

const QUICK_SUGGESTIONS = [
  { name: 'หมูสามชั้นสด', cat: 'meat' as const, unit: 'กก.', cost: 165, min: 5 },
  { name: 'ไข่ไก่เบอร์ 2', cat: 'meat' as const, unit: 'ฟอง', cost: 4.5, min: 30 },
  { name: 'ใบกะเพราป่าแท้', cat: 'vegetable' as const, unit: 'กก.', cost: 65, min: 2 },
  { name: 'มะนาวแป้นสด', cat: 'vegetable' as const, unit: 'กก.', cost: 75, min: 3 },
  { name: 'ข้าวหอมมะลิแท้ 100%', cat: 'staple' as const, unit: 'กก.', cost: 38, min: 15 },
  { name: 'น้ำปลาแท้เกรดพรีเมียม', cat: 'seasoning' as const, unit: 'ขวด', cost: 42, min: 4 },
  { name: 'กล่องกระดาษ Takeaway', cat: 'packaging' as const, unit: 'ใบ', cost: 4.5, min: 50 },
];

export const AddEditIngredientModal: React.FC<AddEditIngredientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialItem,
}) => {
  const isEditing = !!initialItem;

  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<Ingredient['category']>('meat');
  const [currentStock, setCurrentStock] = useState<string>('10');
  const [minThreshold, setMinThreshold] = useState<string>('3');
  const [unit, setUnit] = useState<string>('กก.');
  const [costPerUnit, setCostPerUnit] = useState<string>('50');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setCategory(initialItem.category);
      setCurrentStock(initialItem.currentStock.toString());
      setMinThreshold(initialItem.minThreshold.toString());
      setUnit(initialItem.unit);
      setCostPerUnit(initialItem.costPerUnit.toString());
    } else {
      setName('');
      setCategory('meat');
      setCurrentStock('10');
      setMinThreshold('3');
      setUnit('กก.');
      setCostPerUnit('50');
    }
    setShowDeleteConfirm(false);
    setErrorMsg('');
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อวัตถุดิบ');
      return;
    }

    const stockNum = parseFloat(currentStock) || 0;
    const minNum = parseFloat(minThreshold) || 0;
    const costNum = parseFloat(costPerUnit) || 0;

    if (stockNum < 0 || minNum < 0 || costNum < 0) {
      setErrorMsg('จำนวนสต็อกและต้นทุนต้องไม่ติดลบ');
      return;
    }

    if (isEditing && initialItem && onUpdate) {
      onUpdate(initialItem.id, {
        name: name.trim(),
        category,
        currentStock: stockNum,
        minThreshold: minNum,
        unit: unit.trim() || 'ชิ้น',
        costPerUnit: costNum,
      });
    } else {
      onSave({
        name: name.trim(),
        category,
        currentStock: stockNum,
        minThreshold: minNum,
        unit: unit.trim() || 'ชิ้น',
        costPerUnit: costNum,
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (initialItem && onDelete) {
      onDelete(initialItem.id);
      onClose();
    }
  };

  const handleApplyPreset = (p: typeof QUICK_SUGGESTIONS[0]) => {
    setName(p.name);
    setCategory(p.cat);
    setUnit(p.unit);
    setCostPerUnit(p.cost.toString());
    setMinThreshold(p.min.toString());
  };

  const calculatedTotalValue = (parseFloat(currentStock) || 0) * (parseFloat(costPerUnit) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                {isEditing ? 'แก้ไขข้อมูลวัตถุดิบ' : 'เพิ่มวัตถุดิบใหม่เข้าสู่คลัง'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `รหัสสินค้า: ${initialItem.id} • อัปเดตข้อมูลและเกณฑ์สต็อก`
                  : 'กำหนดชื่อ, หมวดหมู่, สต็อกเริ่มต้น และเกณฑ์แจ้งเตือนสต็อก'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick preset suggestions (Only for Add mode) */}
          {!isEditing && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">
                💡 รายการตัวอย่างด่วน (คลิกเพื่อกรอกอัตโนมัติ):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Field 1: Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>ชื่อวัตถุดิบ / สินค้า <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">ระบุชื่อให้ชัดเจน</span>
            </label>
            <input
              id="input-ingredient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เนื้อหมูสันนอก, ไข่ไก่เบอร์ 2, มะนาวแป้น..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all"
              required
            />
          </div>

          {/* Field 2: Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 block">
              หมวดหมู่วัตถุดิบ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    category === cat.id
                      ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{cat.icon}</span>
                    {category === cat.id && (
                      <Check className="w-3.5 h-3.5 text-amber-600 font-bold" />
                    )}
                  </div>
                  <span className="font-bold text-xs mt-1">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Field 3: Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>หน่วยนับ <span className="text-rose-500">*</span></span>
              <span className="text-[11px] font-normal text-slate-400">เลือกหรือพิมพ์เอง</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {UNIT_PRESETS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    unit === u
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <input
              id="input-ingredient-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="พิมพ์หน่วยนับเอง เช่น ซอง, โหล..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-amber-500 outline-none"
            />
          </div>

          {/* Grid: Current Stock & Minimum Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <label className="text-xs font-bold text-slate-800 block">
                ระดับสต็อกเริ่มต้น / ปัจจุบัน ({unit || 'หน่วย'})
              </label>
              <input
                id="input-ingredient-stock"
                type="number"
                step="0.01"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 font-extrabold text-base text-slate-900 focus:border-amber-500 outline-none"
                required
              />
              <p className="text-[10px] text-slate-500">จำนวนที่ตรวจนับได้จริงในร้าน</p>
            </div>

            <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200 space-y-1">
              <label className="text-xs font-bold text-rose-900 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                จุดแจ้งเตือนสต็อกต่ำ (Min Alert)
              </label>
              <input
                id="input-ingredient-min"
                type="number"
                step="0.01"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-rose-300 font-extrabold text-base text-rose-900 focus:border-rose-500 outline-none"
                required
              />
              <p className="text-[10px] text-rose-600">เมื่อลดถึงเกณฑ์นี้ ระบบจะแจ้งเตือนเติมสต็อก</p>
            </div>
          </div>

          {/* Field: Cost per Unit & Value Preview */}
          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs font-bold text-amber-950 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                ต้นทุนเฉลี่ยต่อหน่วย (บาท / {unit || 'หน่วย'})
              </label>
              <span className="text-xs text-amber-800 font-semibold">
                มูลค่าสต็อกรวม: <strong className="text-sm font-black text-amber-950">฿{Math.round(calculatedTotalValue).toLocaleString()}</strong>
              </span>
            </div>
            <input
              id="input-ingredient-cost"
              type="number"
              step="0.1"
              min="0"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-amber-300 font-bold text-base text-slate-900 focus:border-amber-600 outline-none"
              required
            />
            <p className="text-[10px] text-amber-800">
              ใช้สำหรับการตัดต้นทุนอาหารอัตโนมัติเมื่อมีการสั่งอาหารและคำนวณกำไร-ขาดทุน (P&L)
            </p>
          </div>

          {/* Delete Section if in Edit Mode */}
          {isEditing && onDelete && (
            <div className="pt-2 border-t border-slate-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบวัตถุดิบนี้ออกจากระบบ</span>
                </button>
              ) : (
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>ยืนยันการลบวัตถุดิบ "{name}" หรือไม่?</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    การลบจะทำให้รายการนี้ถูกถอดออกจากระบบสต็อก หากมีเมนูที่ผูกกับวัตถุดิบนี้อยู่ จะไม่ถูกตัดสต็อกอัตโนมัติ
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      ยืนยันการลบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95"
            >
              {isEditing ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มวัตถุดิบ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
