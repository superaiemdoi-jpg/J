import React, { useState, useEffect } from 'react';
import { MenuItem, CategoryType } from '../types/pos';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Flame,
  Check,
  Sparkles,
  DollarSign,
  Layers,
  Utensils,
} from 'lucide-react';

interface AddEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<MenuItem, 'id'>) => void;
  onUpdate?: (id: string, itemData: Partial<MenuItem>) => void;
  onDelete?: (id: string) => void;
  initialItem?: MenuItem | null;
}

const PRESET_IMAGES = [
  {
    label: 'กะเพราหมูกรอบ/หมูสับ',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ต้มยำกุ้งแม่น้ำ',
    url: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ผัดไทยกุ้งสด',
    url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ส้มตำไทย',
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ชาไทยเย็น',
    url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ข้าวเหนียวมะม่วง',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ไก่ทอด / ของทอด',
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ข้าวผัด',
    url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
  },
];

export const AddEditMenuModal: React.FC<AddEditMenuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  onDelete,
  initialItem,
}) => {
  const isEditing = !!initialItem;

  const [name, setName] = useState<string>('');
  const [nameEn, setNameEn] = useState<string>('');
  const [category, setCategory] = useState<CategoryType>('single-dish');
  const [price, setPrice] = useState<string>('65');
  const [cost, setCost] = useState<string>('25');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(PRESET_IMAGES[0].url);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [popular, setPopular] = useState<boolean>(false);

  // Customization options
  const [hasSpiciness, setHasSpiciness] = useState<boolean>(true);
  const [meatChoicesText, setMeatChoicesText] = useState<string>('หมูสับ, ไก่ชิ้น, ทะเล (+15), เนื้อ (+20)');
  const [addOnsText, setAddOnsText] = useState<string>('ไข่ดาว (10), ไข่เจียว (15), พิเศษ (15)');

  // Delete confirmation
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (initialItem) {
      setName(initialItem.name);
      setNameEn(initialItem.nameEn || '');
      setCategory(initialItem.category);
      setPrice(initialItem.price.toString());
      setCost(initialItem.cost.toString());
      setDescription(initialItem.description || '');
      setImageUrl(initialItem.imageUrl || PRESET_IMAGES[0].url);
      setIsAvailable(initialItem.isAvailable);
      setPopular(!!initialItem.popular);

      setHasSpiciness(!!initialItem.options?.spiciness);
      setMeatChoicesText(initialItem.options?.meatChoices ? initialItem.options.meatChoices.join(', ') : '');
      const addOnsStr = initialItem.options?.addOns
        ? initialItem.options.addOns.map((a) => `${a.name} (${a.price})`).join(', ')
        : '';
      setAddOnsText(addOnsStr);
    } else {
      setName('');
      setNameEn('');
      setCategory('single-dish');
      setPrice('65');
      setCost('25');
      setDescription('');
      setImageUrl(PRESET_IMAGES[0].url);
      setIsAvailable(true);
      setPopular(false);
      setHasSpiciness(true);
      setMeatChoicesText('หมูสับ, ไก่ชิ้น, ทะเล (+15), เนื้อ (+20)');
      setAddOnsText('ไข่ดาว (10), ไข่เจียว (15), พิเศษ (15)');
    }
    setIsConfirmDelete(false);
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อเมนูอาหารภาษาไทย');
      return;
    }

    const numPrice = parseFloat(price) || 0;
    const numCost = parseFloat(cost) || 0;

    // Parse meat choices
    const meatChoices = meatChoicesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Parse add-ons: format "ไข่ดาว (10)" or "ไข่ดาว 10"
    const parsedAddOns: { name: string; price: number }[] = [];
    if (addOnsText.trim()) {
      const parts = addOnsText.split(',');
      for (const part of parts) {
        const match = part.match(/^([^(\d]+)[(\s]*(\d+)[)\s]*$/);
        if (match) {
          parsedAddOns.push({
            name: match[1].trim(),
            price: parseInt(match[2], 10),
          });
        } else if (part.trim()) {
          parsedAddOns.push({
            name: part.trim(),
            price: 10,
          });
        }
      }
    }

    const options = {
      spiciness: hasSpiciness,
      meatChoices: meatChoices.length > 0 ? meatChoices : undefined,
      addOns: parsedAddOns.length > 0 ? parsedAddOns : undefined,
    };

    const itemPayload: Omit<MenuItem, 'id'> = {
      name: name.trim(),
      nameEn: nameEn.trim() || name.trim(),
      category,
      price: numPrice,
      cost: numCost,
      description: description.trim(),
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      isAvailable,
      popular,
      options: hasSpiciness || meatChoices.length > 0 || parsedAddOns.length > 0 ? options : undefined,
    };

    if (isEditing && initialItem && onUpdate) {
      onUpdate(initialItem.id, itemPayload);
    } else {
      onSave(itemPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (!initialItem || !onDelete) return;
    onDelete(initialItem.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {isEditing ? `แก้ไขเมนู: ${initialItem?.name}` : 'เพิ่มเมนูอาหารใหม่เข้าระบบ'}
              </h3>
              <p className="text-[11px] text-slate-500">
                จัดการชื่อ ราคา ต้นทุน และตัวเลือกปรับแต่งสำหรับคิดเงินหน้าร้าน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                ชื่อเมนูอาหาร (ภาษาไทย) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ข้าวกะเพราหมูกรอบ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">ชื่อภาษาอังกฤษ (English Name):</label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="เช่น Crispy Pork Holy Basil Rice"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">หมวดหมู่อาหาร:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500 bg-white"
              >
                <option value="single-dish">อาหารจานเดียว (Single Dish)</option>
                <option value="main">กับข้าว (Main Dish)</option>
                <option value="soup">ต้ม/แกง (Soup & Curry)</option>
                <option value="appetizer">ของทานเล่น (Appetizer)</option>
                <option value="beverage">เครื่องดื่ม (Beverage)</option>
                <option value="dessert">ของหวาน (Dessert)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  ราคาขาย (฿) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-amber-600 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">ต้นทุนวัตถุดิบ (฿):</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="สำหรับคิดกำไร"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-800 block mb-1">รายละเอียด / คำอธิบายสั้นๆ:</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ระบุส่วนผสมพิเศษ หรือความอร่อยของจานนี้..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Image Selection & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>รูปภาพเมนูอาหาร (Image URL หรือเลือกรูปตัวอย่าง):</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 outline-none focus:border-amber-500"
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                </div>
              )}
            </div>

            {/* Presets Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-semibold">เลือกรูปเร็ว:</span>
              {PRESET_IMAGES.map((p, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setImageUrl(p.url)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                    imageUrl === p.url
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability & Popular Badges */}
          <div className="flex flex-wrap gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span>พร้อมจำหน่ายหน้าร้าน (เปิดขาย)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={popular}
                onChange={(e) => setPopular(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>ติดป้าย "เมนูยอดนิยม"</span>
              </span>
            </label>
          </div>

          {/* Customization Options */}
          <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>ตัวเลือกการปรับแต่งรสชาติและท็อปปิ้ง</span>
              </h4>
            </div>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={hasSpiciness}
                onChange={(e) => setHasSpiciness(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500"
              />
              <span>ให้ลูกค้าเลือกระดับความเผ็ดได้ (ไม่เผ็ด / เผ็ดน้อย / เผ็ดปกติ / เผ็ดมาก)</span>
            </label>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ตัวเลือกเนื้อสัตว์ (คั่นด้วยเครื่องหมายจุลภาค , ):
              </label>
              <input
                type="text"
                value={meatChoicesText}
                onChange={(e) => setMeatChoicesText(e.target.value)}
                placeholder="เช่น หมูสับ, ไก่ชิ้น, ทะเล (+15), เนื้อ (+20)"
                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 text-slate-800 outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ใส่ (+15) เพื่อบวกราคาเพิ่มอัตโนมัติ เช่น "เนื้อ (+20)"
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                ท็อปปิ้งเพิ่มเติม (คั่นด้วยเครื่องหมายจุลภาค , ):
              </label>
              <input
                type="text"
                value={addOnsText}
                onChange={(e) => setAddOnsText(e.target.value)}
                placeholder="เช่น ไข่ดาว (10), ไข่เจียว (15), พิเศษ (15)"
                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 text-slate-800 outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                ใส่ชื่อพร้อมราคาในวงเล็บ เช่น "ไข่ดาว (10)" ระบบจะเพิ่มในบิลทันที
              </p>
            </div>
          </div>

          {/* Delete Confirmation Box (If Editing) */}
          {isConfirmDelete && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 animate-in fade-in duration-200">
              <p className="font-bold text-rose-700 text-xs">
                ⚠️ ยืนยันที่จะลบเมนู "{initialItem?.name}" ออกจากระบบ?
              </p>
              <p className="text-[11px] text-rose-600">
                รายการอาหารนี้จะถูกนำออกจากระบบทันที แต่ยอดขายในอดีตยังคงถูกบันทึกไว้ในรายงาน
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 bg-white font-semibold text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  ยืนยันลบเมนูถาวร
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDelete(true)}
                className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบเมนูนี้</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกเมนูใหม่'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
