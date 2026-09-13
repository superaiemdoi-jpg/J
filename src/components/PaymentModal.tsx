import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { PaymentMethod, Order } from '../types/pos';
import { generatePromptPayPayload, generateQRCodeDataUrl } from '../utils/promptpay';
import {
  QrCode,
  Banknote,
  CreditCard,
  Building2,
  CheckCircle2,
  Printer,
  X,
  Sparkles,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (order: Order) => void;
  existingOrder?: Order | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  existingOrder,
}) => {
  const {
    cart,
    cartCalculations,
    cartTable,
    cartOrderType,
    cartCustomerName,
    promptPayId,
    restaurantName,
    currentUser,
    checkoutCart,
    markOrderPaid,
  } = usePOS();

  const activeTotal = existingOrder ? existingOrder.netTotal : cartCalculations.netTotal;
  const activeSubtotal = existingOrder ? existingOrder.subtotal : cartCalculations.subtotal;
  const activeDiscount = existingOrder ? existingOrder.discount : cartCalculations.discount;
  const activeVat = existingOrder ? existingOrder.vat : cartCalculations.vat;
  const activeServiceCharge = existingOrder ? existingOrder.serviceCharge : cartCalculations.serviceCharge;
  const activeTable = existingOrder
    ? existingOrder.tableNumber
    : cartOrderType === 'dine-in'
    ? cartTable
    : 'สั่งกลับบ้าน';
  const activeCustomerName = existingOrder ? existingOrder.customerName : cartCustomerName;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PROMPTPAY_QR');
  const [cashReceived, setCashReceived] = useState<number>(activeTotal);
  const [customCash, setCustomCash] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Generate QR code when PromptPay is selected
  useEffect(() => {
    if (paymentMethod === 'PROMPTPAY_QR' && activeTotal > 0) {
      const payload = generatePromptPayPayload(promptPayId, activeTotal);
      generateQRCodeDataUrl(payload).then((url) => setQrDataUrl(url));
    }
  }, [paymentMethod, activeTotal, promptPayId]);

  // Set initial cash received to match net total
  useEffect(() => {
    setCashReceived(activeTotal);
    setCustomCash(activeTotal.toString());
  }, [activeTotal, isOpen]);

  if (!isOpen) return null;

  const changeAmount = Math.max(0, cashReceived - activeTotal);
  const isCashInsufficient = paymentMethod === 'CASH' && cashReceived < activeTotal;

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (existingOrder) {
        markOrderPaid(
          existingOrder.id,
          paymentMethod,
          paymentMethod === 'CASH' ? cashReceived : activeTotal
        );
        const updatedOrder: Order = {
          ...existingOrder,
          paymentStatus: 'paid',
          paymentMethod,
          amountReceived: paymentMethod === 'CASH' ? cashReceived : activeTotal,
          changeAmount: paymentMethod === 'CASH' ? Math.max(0, cashReceived - activeTotal) : 0,
          paidAt: new Date().toISOString(),
        };
        setCompletedOrder(updatedOrder);
        setIsProcessing(false);
        if (onPaymentSuccess) {
          onPaymentSuccess(updatedOrder);
        }
      } else {
        const newOrder = checkoutCart(
          paymentMethod,
          paymentMethod === 'CASH' ? cashReceived : activeTotal
        );
        setCompletedOrder(newOrder);
        setIsProcessing(false);
        if (onPaymentSuccess) {
          onPaymentSuccess(newOrder);
        }
      }
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {completedOrder ? 'ชำระเงินสำเร็จ / ใบเสร็จ' : 'คิดเงินและเลือกช่องทางชำระเงิน'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTable} • {activeCustomerName}
              </p>
            </div>
          </div>
          {!completedOrder && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        {!completedOrder ? (
          <div className="p-5 space-y-5">
            {/* Total Amount Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white text-center shadow-md">
              <p className="text-xs text-amber-100 font-medium">ยอดชำระสุทธิ (Net Total)</p>
              <p className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                ฿{activeTotal.toLocaleString()}
              </p>
              <div className="flex justify-center gap-4 text-xs text-amber-100/90 mt-2 font-normal">
                <span>ยอดรวม ฿{activeSubtotal}</span>
                {activeDiscount > 0 && <span>ส่วนลด -฿{activeDiscount}</span>}
                {activeVat > 0 && <span>VAT 7% +฿{activeVat}</span>}
                {activeServiceCharge > 0 && <span>Service 10% +฿{activeServiceCharge}</span>}
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                เลือกช่องทางการชำระเงิน:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  id="pay-method-promptpay"
                  type="button"
                  onClick={() => setPaymentMethod('PROMPTPAY_QR')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    paymentMethod === 'PROMPTPAY_QR'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-blue-600" />
                  <span>PromptPay QR</span>
                </button>

                <button
                  id="pay-method-cash"
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>เงินสด (Cash)</span>
                </button>

                <button
                  id="pay-method-card"
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    paymentMethod === 'CREDIT_CARD'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-700 shadow-xs ring-1 ring-purple-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>บัตรเครดิต</span>
                </button>

                <button
                  id="pay-method-transfer"
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                    paymentMethod === 'TRANSFER'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>โอนบัญชีธนาคาร</span>
                </button>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod === 'PROMPTPAY_QR' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-800">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>สแกน QR Code เพื่อชำระเงินผ่านแอปธนาคารทุกแห่ง</span>
                </div>

                <div className="inline-block p-3 bg-white rounded-xl shadow-xs border border-slate-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="PromptPay QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                      กำลังสร้าง QR Code...
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-slate-500">พร้อมเพย์ร้านค้า (PromptPay ID):</p>
                  <p className="font-mono font-bold text-slate-800 text-sm tracking-wider">
                    {promptPayId} ({restaurantName})
                  </p>
                  <p className="font-semibold text-amber-600">
                    ยอดเงิน: ฿{cartCalculations.netTotal.toLocaleString()} บาท
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'CASH' && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    จำนวนเงินที่รับจากลูกค้า:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">฿</span>
                    <input
                      id="input-cash-received"
                      type="number"
                      value={customCash}
                      onChange={(e) => {
                        setCustomCash(e.target.value);
                        setCashReceived(parseFloat(e.target.value) || 0);
                      }}
                      className="w-full pl-8 pr-4 py-2 text-xl font-bold rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    />
                  </div>
                </div>

                {/* Quick Cash Buttons */}
                <div>
                  <span className="text-[11px] text-slate-500 mb-1 block">ปุ่มลัดรับเงินสด:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCashReceived(activeTotal);
                        setCustomCash(activeTotal.toString());
                      }}
                      className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                    >
                      พอดี (Exact)
                    </button>
                    {[100, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setCashReceived(amt);
                          setCustomCash(amt.toString());
                        }}
                        className="py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700"
                      >
                        ฿{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Change calculation box */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isCashInsufficient ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="text-xs font-bold">
                    {isCashInsufficient ? 'เงินยังไม่ครบ (ขาดอีก)' : 'เงินทอน (Change):'}
                  </span>
                  <span className="text-xl font-extrabold">
                    ฿{Math.abs(changeAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'CREDIT_CARD' && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center space-y-2 text-xs text-purple-900">
                <CreditCard className="w-8 h-8 text-purple-600 mx-auto" />
                <p className="font-bold text-sm">เครื่อง EDC พร้อมรับบัตร</p>
                <p className="text-purple-700">
                  รองรับ Visa, Mastercard, JCB และ Contactless แตะเพื่อจ่าย
                </p>
                <p className="font-semibold text-slate-700">ยอดที่ส่งเข้าเครื่อง: ฿{activeTotal.toLocaleString()}</p>
              </div>
            )}

            {paymentMethod === 'TRANSFER' && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 text-xs text-indigo-900">
                <Building2 className="w-6 h-6 text-indigo-600" />
                <p className="font-bold text-sm">โอนเงินผ่านบัญชีร้านค้า</p>
                <p>ธนาคารกสิกรไทย (KBANK) • สาขาเอกมัย</p>
                <p className="font-mono font-bold text-sm text-indigo-950">เลขบัญชี: 098-2-34567-8</p>
                <p>ชื่อบัญชี: บจก. ครัวไทยรสเอก (Thai Flavor Kitchen Co., Ltd.)</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                id="btn-confirm-payment"
                type="button"
                disabled={isProcessing || isCashInsufficient}
                onClick={handleCompletePayment}
                className={`flex-2 py-3 px-4 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                  isCashInsufficient
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isProcessing ? (
                  <span>กำลังบันทึกการชำระเงิน...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ยืนยันการชำระเงิน (฿{activeTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Receipt / Thermal Slip View */
          <div className="p-5 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">ชำระเงินเรียบร้อยแล้ว!</p>
                <p>ระบบบันทึกยอดขายและตัดสต็อกวัตถุดิบอัตโนมัติแล้ว</p>
              </div>
            </div>

            {/* Printable Receipt Paper */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-bold text-sm text-slate-900">{restaurantName}</h4>
                <p className="text-[11px] text-slate-500">ใบเสร็จรับเงินอย่างย่อ / Tax Receipt</p>
                <p className="text-[10px] text-slate-400 mt-1">เลขที่บิล: {completedOrder.orderNumber}</p>
                <p className="text-[10px] text-slate-400">
                  {new Date(completedOrder.createdAt).toLocaleString('th-TH')}
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <span>{completedOrder.tableNumber}</span>
                <span>ผู้รับรายการ: {completedOrder.staffName}</span>
              </div>

              {/* Items */}
              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                {completedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div className="flex-1 pr-2">
                      <span className="font-medium text-slate-800">{item.name}</span>
                      {item.options?.spiciness && (
                        <span className="text-[10px] text-slate-500 block">
                          ({item.options.spiciness})
                        </span>
                      )}
                    </div>
                    <span className="text-slate-600 w-8 text-right">x{item.quantity}</span>
                    <span className="text-slate-800 font-semibold w-16 text-right">
                      ฿{item.totalPrice}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-xs pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>ยอดรวม (Subtotal)</span>
                  <span>฿{completedOrder.subtotal}</span>
                </div>
                {completedOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>ส่วนลด (Discount)</span>
                    <span>-฿{completedOrder.discount}</span>
                  </div>
                )}
                {completedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>ค่าบริการ 10%</span>
                    <span>+฿{completedOrder.serviceCharge}</span>
                  </div>
                )}
                {completedOrder.vat > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT 7%</span>
                    <span>+฿{completedOrder.vat}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-1.5">
                  <span>ยอดสุทธิ (Total)</span>
                  <span>฿{completedOrder.netTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>ชำระด้วย: {completedOrder.paymentMethod}</span>
                  {completedOrder.changeAmount && completedOrder.changeAmount > 0 ? (
                    <span>เงินทอน: ฿{completedOrder.changeAmount}</span>
                  ) : null}
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-300">
                ขอบคุณที่ใช้บริการ • Thank you for dining with us
              </div>
            </div>

            {/* Receipt Modal Footer Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                id="btn-finish-receipt"
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  onClose();
                }}
                className="flex-2 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>เริ่มรายการใหม่ / ปิดหน้าต่าง</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
