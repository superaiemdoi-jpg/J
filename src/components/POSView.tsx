import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { MenuItem, CartItemOption, Order } from '../types/pos';
import { PaymentModal } from './PaymentModal';
import { AddEditMenuModal } from './AddEditMenuModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Edit2,
  Utensils,
  ShoppingBag,
  Percent,
  Check,
  Flame,
  Soup,
  Coffee,
  Cookie,
  CupSoda,
  Cake,
  SlidersHorizontal,
  X,
  CreditCard,
  User,
  Send,
  Receipt,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const {
    menuItems,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    cart,
    cartTable,
    setCartTable,
    cartOrderType,
    setCartOrderType,
    cartCustomerName,
    setCartCustomerName,
    discount,
    setDiscount,
    includeVat,
    setIncludeVat,
    includeServiceCharge,
    setIncludeServiceCharge,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCalculations,
    addMenuItem,
    deleteMenuItem,
    updateMenuItem,
    orders,
    submitOrderPayLater,
    setToastMessage,
  } = usePOS();

  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [selectedOrderToSettle, setSelectedOrderToSettle] = useState<Order | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState<boolean>(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);

  const unpaidOrders = orders.filter((o) => o.paymentStatus === 'unpaid');

  // Modifiers state for currently customizing item
  const [selectedSpiciness, setSelectedSpiciness] = useState<CartItemOption['spiciness']>('เผ็ดปกติ');
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [customNote, setCustomNote] = useState<string>('');

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleOpenCustomize = (item: MenuItem) => {
    if (item.options?.spiciness || item.options?.meatChoices || item.options?.addOns) {
      setCustomizingItem(item);
      setSelectedSpiciness(item.options?.spiciness ? 'เผ็ดปกติ' : undefined);
      setSelectedMeat(item.options?.meatChoices ? item.options.meatChoices[0] : '');
      setSelectedAddOns([]);
      setCustomNote('');
    } else {
      // Direct add
      addToCart(item, 1);
    }
  };

  const handleConfirmCustomize = () => {
    if (!customizingItem) return;
    const options: CartItemOption = {
      spiciness: selectedSpiciness,
      meatChoice: selectedMeat,
      addOns: selectedAddOns,
      note: customNote.trim() || undefined,
    };
    addToCart(customizingItem, 1, options);
    setCustomizingItem(null);
  };

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    if (selectedAddOns.some((a) => a.name === addOn.name)) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addOn.name));
    } else {
      setSelectedAddOns([...selectedAddOns, addOn]);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Soup':
        return <Soup className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Cookie':
        return <Cookie className="w-4 h-4" />;
      case 'CupSoda':
        return <CupSoda className="w-4 h-4" />;
      case 'Cake':
        return <Cake className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  const tables = ['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'โต๊ะ 4', 'โต๊ะ 5', 'โต๊ะ 6', 'โต๊ะ 7', 'โต๊ะ 8', 'โต๊ะ VIP'];

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
      {/* Unpaid Orders / Pay Later Settlement Bar */}
      {unpaidOrders.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/80 border border-amber-300/80 rounded-2xl p-3.5 shadow-xs animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-amber-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>บิลรอชำระเงิน (ลูกค้าทานอยู่ / รอเก็บเงิน):</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-2xs">
                {unpaidOrders.length} โต๊ะ
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              คลิกที่ปุ่ม <span className="font-semibold text-emerald-700">"คิดเงิน"</span> เพื่อคิดเงินเมื่อลูกค้ารับประทานเสร็จ
            </span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pt-2.5 pb-1 scrollbar-thin">
            {unpaidOrders.map((ord) => (
              <div
                key={ord.id}
                className="shrink-0 bg-white border border-amber-200 rounded-xl p-3 shadow-2xs flex items-center gap-3 hover:border-amber-400 transition-all"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">{ord.tableNumber}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({ord.orderNumber})</span>
                  </div>
                  <p className="text-sm font-extrabold text-amber-600">฿{ord.netTotal.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">
                    {ord.items.reduce((s, i) => s + i.quantity, 0)} เมนู •{' '}
                    <span className="text-amber-700 font-medium">รอชำระเงิน</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderToSettle(ord);
                    setIsPaymentOpen(true);
                  }}
                  className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>คิดเงิน</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Menu Items & Categories (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Top Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่ออาหาร, เมนู, เครื่องดื่ม..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
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

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium px-2 py-1 bg-slate-100 rounded-lg">
                แสดง {filteredItems.length} รายการ
              </span>

              <button
                id="btn-add-menu-modal"
                type="button"
                onClick={() => {
                  setEditingMenuItem(null);
                  setIsAddMenuModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-all whitespace-nowrap cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ เพิ่มเมนูใหม่</span>
              </button>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {getCategoryIcon(cat.iconName)}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                id={`menu-card-${item.id}`}
                onClick={() => handleOpenCustomize(item)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {item.popular && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3" /> ยอดนิยม
                    </span>
                  )}
                  {/* Quick Edit & Delete Actions */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMenuItem(item);
                        setIsAddMenuModalOpen(true);
                      }}
                      title="แก้ไขข้อมูลเมนู"
                      className="w-7 h-7 rounded-lg bg-white/95 hover:bg-white text-slate-700 hover:text-amber-600 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`คุณต้องการลบเมนู "${item.name}" ใช่หรือไม่?`)) {
                          deleteMenuItem(item.id);
                        }
                      }}
                      title="ลบเมนูนี้"
                      className="w-7 h-7 rounded-lg bg-white/95 hover:bg-white text-rose-600 hover:bg-rose-50 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {item.options && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-medium flex items-center gap-1">
                      <SlidersHorizontal className="w-2.5 h-2.5" /> ปรับแต่งได้
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{item.nameEn}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400">ราคา</span>
                      <p className="font-extrabold text-amber-600 text-sm sm:text-base leading-none">
                        ฿{item.price}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-colors shadow-2xs font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">ไม่พบรายการอาหารที่ค้นหา</p>
              <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่น</p>
            </div>
          )}
        </div>

        {/* Right Column: Order Ticket / Cart (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-6rem)] max-h-[820px] overflow-hidden">
            {/* Cart Header */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-sm">รายการสั่งอาหาร (Cart)</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> ล้างบิล
                  </button>
                )}
              </div>

              {/* Order Type Selector (Dine-in vs Takeaway) */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCartOrderType('dine-in')}
                  className={`py-1.5 rounded-lg transition-all ${
                    cartOrderType === 'dine-in'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทานที่ร้าน (Dine-in)
                </button>
                <button
                  type="button"
                  onClick={() => setCartOrderType('takeaway')}
                  className={`py-1.5 rounded-lg transition-all ${
                    cartOrderType === 'takeaway'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กลับบ้าน (Takeaway)
                </button>
              </div>

              {/* Table / Customer Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {cartOrderType === 'dine-in' ? (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">เลือกโต๊ะ:</label>
                    <select
                      value={cartTable}
                      onChange={(e) => setCartTable(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 text-xs outline-none"
                    >
                      {tables.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">ประเภท:</label>
                    <div className="px-2 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-bold text-xs">
                      กลับบ้าน (Takeaway)
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">ลูกค้า:</label>
                  <div className="relative">
                    <User className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
                    <input
                      type="text"
                      value={cartCustomerName}
                      onChange={(e) => setCartCustomerName(e.target.value)}
                      placeholder="ลูกค้าทั่วไป"
                      className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none text-slate-800 font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                  <Utensils className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">ยังไม่มีรายการอาหารในบิล</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">คลิกที่เมนูด้านซ้ายเพื่อเพิ่มรายการ</p>
                </div>
              ) : (
                cart.map((cartItem) => (
                  <div key={cartItem.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{cartItem.name}</p>
                      {/* Options & Modifiers summary */}
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        {cartItem.options?.spiciness && (
                          <span className="inline-block mr-1 text-amber-700 bg-amber-50 px-1 rounded">
                            {cartItem.options.spiciness}
                          </span>
                        )}
                        {cartItem.options?.meatChoice && (
                          <span className="inline-block mr-1 text-slate-700 bg-slate-100 px-1 rounded">
                            {cartItem.options.meatChoice}
                          </span>
                        )}
                        {cartItem.options?.addOns?.map((a) => (
                          <span key={a.name} className="inline-block mr-1 text-emerald-700 bg-emerald-50 px-1 rounded">
                            +{a.name} (฿{a.price})
                          </span>
                        ))}
                        {cartItem.options?.note && (
                          <p className="italic text-slate-400">โน้ต: {cartItem.options.note}</p>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1">
                        ฿{cartItem.price} x {cartItem.quantity} ={' '}
                        <span className="font-bold text-amber-600">฿{cartItem.totalPrice}</span>
                      </p>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 p-1 rounded-lg">
                      <button
                        onClick={() => updateCartQuantity(cartItem.id, -1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-slate-800">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(cartItem.id, 1)}
                        className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(cartItem.id)}
                        className="w-6 h-6 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Checkout Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2.5">
              {/* Discount and Tax Toggles */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[11px] text-slate-600 font-medium">ส่วนลด:</span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-16 px-2 py-0.5 rounded border border-slate-200 text-xs font-semibold text-right"
                  />
                  <span className="text-[10px] text-slate-400">฿</span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={includeVat}
                      onChange={(e) => setIncludeVat(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>VAT 7%</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-slate-600">
                    <input
                      type="checkbox"
                      checked={includeServiceCharge}
                      onChange={(e) => setIncludeServiceCharge(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>SVC 10%</span>
                  </label>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="space-y-1 text-xs text-slate-600 border-t border-slate-200/80 pt-2">
                <div className="flex justify-between">
                  <span>ยอดรวม (Subtotal)</span>
                  <span className="font-semibold text-slate-800">
                    ฿{cartCalculations.subtotal.toLocaleString()}
                  </span>
                </div>
                {cartCalculations.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ส่วนลด (Discount)</span>
                    <span>-฿{cartCalculations.discount.toLocaleString()}</span>
                  </div>
                )}
                {cartCalculations.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>ค่าบริการ 10%</span>
                    <span>+฿{cartCalculations.serviceCharge.toLocaleString()}</span>
                  </div>
                )}
                {cartCalculations.vat > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                    <span>+฿{cartCalculations.vat.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-300 font-bold text-slate-900">
                  <span className="text-sm">ยอดสุทธิ (Total)</span>
                  <span className="text-xl text-amber-600">
                    ฿{cartCalculations.netTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Pay Later vs Settle Now */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  id="btn-submit-order-pay-later"
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => {
                    const tableDisplay = cartOrderType === 'dine-in' ? cartTable : 'สั่งกลับบ้าน';
                    submitOrderPayLater();
                    setToastMessage(`ส่งออเดอร์ (${tableDisplay}) เข้าครัวแล้ว • ชำระเงินเมื่อลูกค้าทานเสร็จ`);
                  }}
                  className={`py-3 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs border ${
                    cart.length === 0
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>ส่งเข้าครัว (จ่ายทีหลัง)</span>
                </button>

                <button
                  id="btn-open-payment"
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setSelectedOrderToSettle(null);
                    setIsPaymentOpen(true);
                  }}
                  className={`py-3 px-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all ${
                    cart.length === 0
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] cursor-pointer'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>คิดเงินทันที</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Item Customization Modal */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <img
                  src={customizingItem.imageUrl}
                  alt={customizingItem.name}
                  className="w-10 h-10 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{customizingItem.name}</h4>
                  <p className="text-xs text-amber-600 font-bold">฿{customizingItem.price}</p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Spiciness Level */}
              {customizingItem.options?.spiciness && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">เลือกระดับความเผ็ด:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['ไม่เผ็ด', 'เผ็ดน้อย', 'เผ็ดปกติ', 'เผ็ดมาก'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedSpiciness(lvl)}
                        className={`py-2 px-1 rounded-xl border text-center font-medium transition-all ${
                          selectedSpiciness === lvl
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Meat choices */}
              {customizingItem.options?.meatChoices && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">เลือกประเภทเนื้อสัตว์ / รสชาติ:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customizingItem.options.meatChoices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setSelectedMeat(choice)}
                        className={`py-2 px-2.5 rounded-xl border text-left font-medium transition-all ${
                          selectedMeat === choice
                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold ring-1 ring-amber-500'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {customizingItem.options?.addOns && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">เพิ่มท็อปปิ้งพิเศษ:</label>
                  <div className="space-y-1.5">
                    {customizingItem.options.addOns.map((addOn) => {
                      const isChecked = selectedAddOns.some((a) => a.name === addOn.name);
                      return (
                        <button
                          key={addOn.name}
                          type="button"
                          onClick={() => toggleAddOn(addOn)}
                          className={`w-full p-2 rounded-xl border flex items-center justify-between text-left transition-all ${
                            isChecked
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span>{addOn.name}</span>
                          </div>
                          <span className="font-bold text-slate-800">+฿{addOn.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom note */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">ข้อความเพิ่มเติมถึงครัว:</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="เช่น ไม่ใส่ผักชี, หวานน้อย, แยกน้ำซุป..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomize}
                className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs"
              >
                เพิ่มลงรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setSelectedOrderToSettle(null);
        }}
        existingOrder={selectedOrderToSettle}
      />

      {/* Add / Edit Menu Modal */}
      <AddEditMenuModal
        isOpen={isAddMenuModalOpen}
        onClose={() => {
          setIsAddMenuModalOpen(false);
          setEditingMenuItem(null);
        }}
        onSave={(itemData) => addMenuItem(itemData)}
        onUpdate={(id, itemData) => updateMenuItem(id, itemData)}
        onDelete={(id) => deleteMenuItem(id)}
        initialItem={editingMenuItem}
      />
    </div>
  );
};
