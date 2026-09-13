import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { MenuItem, CartItemOption, Order } from '../types/pos';
import { generatePromptPayPayload, generateQRCodeDataUrl } from '../utils/promptpay';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  QrCode,
  CheckCircle2,
  Utensils,
  Clock,
  ArrowRight,
  X,
  SlidersHorizontal,
  Check,
  ChefHat,
  Search,
  Flame,
} from 'lucide-react';

export const CustomerOrderView: React.FC = () => {
  const {
    menuItems,
    categories,
    selectedCategory,
    setSelectedCategory,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartCalculations,
    checkoutCart,
    submitOrderPayLater,
    markOrderPaid,
    promptPayId,
    restaurantName,
    orders,
  } = usePOS();

  const [customerTable, setCustomerTable] = useState<string>('โต๊ะ 1');
  const [diningType, setDiningType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [guestName, setGuestName] = useState<string>('ลูกค้าทั่วไป');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modifiers state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedSpiciness, setSelectedSpiciness] = useState<CartItemOption['spiciness']>('เผ็ดปกติ');
  const [selectedMeat, setSelectedMeat] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [customNote, setCustomNote] = useState<string>('');

  // Generate QR Code when QR modal is opened
  useEffect(() => {
    if (isQrModalOpen && cartCalculations.netTotal > 0) {
      const payload = generatePromptPayPayload(promptPayId, cartCalculations.netTotal);
      generateQRCodeDataUrl(payload).then((url) => setQrDataUrl(url));
    }
  }, [isQrModalOpen, cartCalculations.netTotal, promptPayId]);

  const handleOpenCustomize = (item: MenuItem) => {
    if (item.options?.spiciness || item.options?.meatChoices || item.options?.addOns) {
      setCustomizingItem(item);
      setSelectedSpiciness(item.options?.spiciness ? 'เผ็ดปกติ' : undefined);
      setSelectedMeat(item.options?.meatChoices ? item.options.meatChoices[0] : '');
      setSelectedAddOns([]);
      setCustomNote('');
    } else {
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

  const handleConfirmOrderPayLater = () => {
    if (cart.length === 0) return;
    const newOrder = submitOrderPayLater({
      tableNumber: diningType === 'dine-in' ? customerTable : 'กลับบ้าน (Takeaway)',
      orderType: diningType,
      customerName: guestName || 'ลูกค้าทั่วไป',
    });
    setPlacedOrder(newOrder);
    setIsCartOpen(false);
  };

  const handleConfirmOrderAndPay = () => {
    if (placedOrder && placedOrder.paymentStatus === 'unpaid') {
      markOrderPaid(placedOrder.id, 'PROMPTPAY_QR', placedOrder.netTotal);
      setPlacedOrder({
        ...placedOrder,
        paymentStatus: 'paid',
        paymentMethod: 'PROMPTPAY_QR',
        amountReceived: placedOrder.netTotal,
        paidAt: new Date().toISOString(),
      });
    } else {
      const newOrder = checkoutCart('PROMPTPAY_QR', cartCalculations.netTotal, true);
      setPlacedOrder(newOrder);
    }
    setIsQrModalOpen(false);
    setIsCartOpen(false);
  };

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch && item.isAvailable;
  });

  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Customer Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>สั่งอาหารด้วยตัวเอง (Self-Order) • ไม่ต้องล็อกอิน</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">{restaurantName}</h1>
            <p className="text-xs sm:text-sm text-amber-100 mt-1">
              เลือกเมนูที่คุณชื่นชอบ ยืนยันคำสั่งซื้อเพื่อส่งเข้าครัว และชำระเงินเมื่อทานเสร็จที่เคาน์เตอร์
            </p>
          </div>

          {/* Table & Dine-in selection */}
          <div className="mt-4 sm:mt-0 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs space-y-2">
            <div className="flex gap-1.5 p-1 bg-black/20 rounded-xl">
              <button
                type="button"
                onClick={() => setDiningType('dine-in')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all ${
                  diningType === 'dine-in' ? 'bg-white text-amber-900 shadow-2xs' : 'text-white/80'
                }`}
              >
                ทานที่ร้าน
              </button>
              <button
                type="button"
                onClick={() => setDiningType('takeaway')}
                className={`flex-1 py-1 px-2.5 rounded-lg font-bold transition-all ${
                  diningType === 'takeaway' ? 'bg-white text-amber-900 shadow-2xs' : 'text-white/80'
                }`}
              >
                กลับบ้าน
              </button>
            </div>

            {diningType === 'dine-in' ? (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-100">โต๊ะของคุณ:</span>
                <select
                  value={customerTable}
                  onChange={(e) => setCustomerTable(e.target.value)}
                  className="bg-white text-slate-800 font-bold px-2 py-1 rounded-lg text-xs outline-none"
                >
                  {['โต๊ะ 1', 'โต๊ะ 2', 'โต๊ะ 3', 'โต๊ะ 4', 'โต๊ะ 5', 'โต๊ะ 6', 'โต๊ะ 7', 'โต๊ะ 8'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-amber-100 font-semibold">รับสินค้าที่จุดรับกลับบ้าน</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {/* Active Placed Order Banner if any */}
        {placedOrder && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-sm space-y-2.5 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 block">
                    ยืนยันคำสั่งซื้อเรียบร้อยแล้ว! 🍽️
                  </span>
                  <span className="text-xs text-slate-600">
                    {placedOrder.tableNumber} • ยอดรวม ฿{placedOrder.netTotal.toLocaleString()}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-200/80 text-amber-900">
                {placedOrder.orderNumber}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <ChefHat className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[11px] leading-relaxed text-slate-600">
                  เชฟได้รับรายการอาหารแล้วและกำลังเริ่มปรุง สามารถนั่งรออาหารเสิร์ฟที่โต๊ะได้เลย
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-amber-800 flex items-center gap-1">
                  💡 ชำระเงินหลังทานเสร็จที่เคาน์เตอร์แคชเชียร์
                </span>
                {placedOrder.paymentStatus === 'unpaid' ? (
                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer text-left sm:text-right"
                  >
                    (หากต้องการสแกน PromptPay QR ล่วงหน้า คลิกที่นี่)
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold">✓ ชำระเงินเรียบร้อยแล้ว</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>สถานะ: กำลังปรุงอาหาร (Cooking)</span>
              </div>
              <button
                onClick={() => setPlacedOrder(null)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-2xs transition-all cursor-pointer"
              >
                + สั่งอาหารเพิ่ม
              </button>
            </div>
          </div>
        )}

        {/* Search & Categories */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเมนูอาหาร เครื่องดื่ม ของหวาน..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs sm:text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none shadow-2xs"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const isSel = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSel
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Items List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenCustomize(item)}
              className="bg-white rounded-2xl border border-slate-200 p-3 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer flex gap-3 items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                {item.popular && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md mb-1">
                    <Flame className="w-2.5 h-2.5" /> แนะนำ
                  </span>
                )}
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h4>
                <p className="text-[10px] text-slate-400 line-clamp-1">{item.nameEn}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-tight">
                  {item.description}
                </p>
                <p className="text-base font-extrabold text-amber-600 mt-2">฿{item.price}</p>
              </div>

              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Bar at bottom */}
      {cart.length > 0 && (
        <div className="fixed bottom-3 inset-x-3 max-w-lg mx-auto z-40">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-3 flex items-center justify-between border border-slate-700 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2.5 pl-2">
              <div className="relative w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-slate-900">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-400">
                  {diningType === 'dine-in' ? customerTable : 'กลับบ้าน'} • {cart.length} เมนู
                </p>
                <p className="text-base font-extrabold text-amber-400 leading-tight">
                  ฿{cartCalculations.subtotal.toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <span>ดูรายการที่สั่ง ({totalCartCount})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Customer Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">รายการอาหารที่คุณสั่ง</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-2 flex-1">
              {cart.map((cartItem) => (
                <div key={cartItem.id} className="pt-2 first:pt-0 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900">{cartItem.name}</p>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      {cartItem.options?.spiciness && (
                        <span className="text-amber-700 bg-amber-50 px-1 rounded mr-1">
                          {cartItem.options.spiciness}
                        </span>
                      )}
                      {cartItem.options?.meatChoice && (
                        <span className="text-slate-700 bg-slate-100 px-1 rounded mr-1">
                          {cartItem.options.meatChoice}
                        </span>
                      )}
                      {cartItem.options?.addOns?.map((a) => (
                        <span key={a.name} className="text-emerald-700 bg-emerald-50 px-1 rounded mr-1">
                          +{a.name} (฿{a.price})
                        </span>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mt-1">
                      ฿{cartItem.price} x {cartItem.quantity} ={' '}
                      <span className="font-bold text-amber-600">฿{cartItem.totalPrice}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => updateCartQuantity(cartItem.id, -1)}
                      className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800">
                      {cartItem.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(cartItem.id, 1)}
                      className="w-6 h-6 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(cartItem.id)}
                      className="w-6 h-6 rounded bg-rose-50 text-rose-600 flex items-center justify-center text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Pay Later confirmation */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-baseline font-bold text-slate-900">
                <div>
                  <span className="text-sm block">ยอดรวมทั้งหมด:</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    (ชำระเงินที่เคาน์เตอร์หลังทานเสร็จ)
                  </span>
                </div>
                <span className="text-2xl text-amber-600">
                  ฿{cartCalculations.subtotal.toLocaleString()}
                </span>
              </div>

              {/* Table / Dining info tag */}
              <div className="flex items-center justify-between text-xs px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>{diningType === 'dine-in' ? customerTable : 'สั่งกลับบ้าน (Takeaway)'}</span>
                </div>
                <span className="text-[11px] text-amber-700 font-medium">ทานเสร็จค่อยชำระเงิน</span>
              </div>

              {/* Primary action: Confirm order to kitchen (Pay later) */}
              <button
                id="btn-confirm-order-customer"
                onClick={handleConfirmOrderPayLater}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ยืนยันคำสั่งซื้อ (฿{cartCalculations.subtotal.toLocaleString()})</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <span>ส่งรายการเข้าครัวทันที</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsQrModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  หรือสแกน PromptPay QR ล่วงหน้า
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer QR Code Payment Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 text-center p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="text-left">
                <h3 className="font-bold text-slate-900 text-base">สแกนชำระผ่าน PromptPay</h3>
                <p className="text-xs text-slate-500">
                  {diningType === 'dine-in' ? customerTable : 'สั่งกลับบ้าน'}
                </p>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs inline-block">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="PromptPay QR" className="w-52 h-52 mx-auto" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  กำลังสร้าง QR Code...
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500">พร้อมเพย์: {promptPayId}</p>
              <p className="text-2xl font-extrabold text-amber-600">
                ฿{cartCalculations.subtotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400">
                เปิดแอปธนาคารของคุณ &gt; เลือกสแกน QR เพื่อชำระเงิน
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={handleConfirmOrderAndPay}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>จำลองการโอนสำเร็จ (ยืนยันส่งออเดอร์เข้าครัว)</span>
              </button>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-700"
              >
                ย้อนกลับไปแก้ไขรายการ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Customization Modal for Customer */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
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
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
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

              {customizingItem.options?.meatChoices && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">เลือกเนื้อสัตว์ / ชนิด:</label>
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

              {customizingItem.options?.addOns && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">เพิ่มพิเศษ:</label>
                  <div className="space-y-1.5">
                    {customizingItem.options.addOns.map((addOn) => {
                      const isChecked = selectedAddOns.some((a) => a.name === addOn.name);
                      return (
                        <button
                          key={addOn.name}
                          type="button"
                          onClick={() => {
                            if (selectedAddOns.some((a) => a.name === addOn.name)) {
                              setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addOn.name));
                            } else {
                              setSelectedAddOns([...selectedAddOns, addOn]);
                            }
                          }}
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">โน้ตเพิ่มเติม:</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="เช่น ไม่ใส่พริก, หวานน้อย..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setCustomizingItem(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCustomize}
                className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs"
              >
                เพิ่มลงในถาด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
