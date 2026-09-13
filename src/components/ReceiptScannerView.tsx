import React, { useState, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { ExpenseRecord, ExpenseItem } from '../types/pos';
import {
  Camera,
  Upload,
  ScanLine,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Receipt,
  Trash2,
  Plus,
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  Building,
  RotateCw,
} from 'lucide-react';

export const ReceiptScannerView: React.FC = () => {
  const { expenses, addExpense, currentUser, showToast } = usePOS();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);

  // Extracted Receipt Form State
  const [merchantName, setMerchantName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseRecord['category']>('วัตถุดิบอาหาร');
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [tax, setTax] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('โอนเงิน / PromptPay');
  const [notes, setNotes] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedImage(base64);
      setScanError(null);
      triggerScan(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const triggerScan = async (base64Image: string, mimeType: string) => {
    setIsScanning(true);
    setScanError(null);
    setHasExtracted(false);

    try {
      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, mimeType }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'ไม่สามารถสแกนใบเสร็จได้');
      }

      const data = result.data;
      setMerchantName(data.merchantName || 'ร้านค้าทั่วไป');
      setInvoiceNumber(data.invoiceNumber || '');
      setReceiptDate(data.date || new Date().toISOString().split('T')[0]);
      setCategory(data.category || 'วัตถุดิบอาหาร');
      setItems(data.items || []);
      setTax(data.tax || 0);
      setTotal(data.total || 0);
      setPaymentMethod(data.paymentMethod || 'โอนเงิน / PromptPay');
      setNotes(data.notes || '');
      setIsSimulated(!!result.simulated);
      setHasExtracted(true);
      showToast('AI ดึงข้อมูลใบเสร็จสำเร็จ ตรวจสอบและบันทึกได้ทันที');
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ AI Scanner');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', quantity: 1, unitPrice: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalcTotal(newItems, tax);
  };

  const handleUpdateItem = (index: number, field: keyof ExpenseItem, val: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: val };
    if (field === 'quantity' || field === 'unitPrice') {
      current.amount = (current.quantity || 0) * (current.unitPrice || 0);
    }
    newItems[index] = current;
    setItems(newItems);
    recalcTotal(newItems, tax);
  };

  const recalcTotal = (currentItems: ExpenseItem[], currentTax: number) => {
    const sub = currentItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setTotal(sub + currentTax);
  };

  const handleSaveExpense = () => {
    if (!merchantName || total <= 0) {
      alert('กรุณาระบุชื่อร้านค้าและยอดรวมให้ถูกต้อง');
      return;
    }

    const subtotal = items.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    addExpense({
      merchantName,
      invoiceNumber: invoiceNumber || undefined,
      date: receiptDate,
      category,
      items: items.length > 0 ? items : [{ name: 'รายการตามใบเสร็จ', quantity: 1, unitPrice: total, amount: total }],
      subtotal: subtotal || total,
      tax,
      total,
      paymentMethod,
      notes: notes + (isSimulated ? ' (สแกนผ่านระบบจำลอง)' : ''),
      imageUrl: selectedImage || undefined,
      createdBy: currentUser.name,
    });

    // Reset Form
    setSelectedImage(null);
    setHasExtracted(false);
    setItems([]);
    setMerchantName('');
    setTotal(0);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 rounded-2xl bg-gradient-to-r from-sky-900 to-slate-900 text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI Multimodal OCR Powered by Gemini 3.8</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            ระบบถ่ายรูปและสแกนใบเสร็จอัตโนมัติ
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            ถ่ายรูปหรืออัปโหลดใบเสร็จค่าใช้จ่าย/ใบส่งของ AI จะอ่านชื่อร้านค้า รายการสินค้า ราคา
            และภาษี เพื่อบันทึกลงในระบบบัญชีและงบกำไรขาดทุนทันที
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* File Upload Trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          {/* Camera Capture Trigger */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>ถ่ายรูปใบเสร็จ</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold shadow-md transition-all shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>อัปโหลดรูปภาพ</span>
          </button>
        </div>
      </div>

      {/* Main OCR Workspace: Image Upload/Preview + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Image Preview & Scan Action (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" />
              <span>ภาพถ่ายใบเสร็จ (Receipt Photo)</span>
            </h3>

            {selectedImage ? (
              <div className="relative aspect-3/4 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group">
                <img
                  src={selectedImage}
                  alt="Receipt Preview"
                  className="w-full h-full object-contain"
                />

                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center space-y-3">
                    <div className="relative">
                      <ScanLine className="w-12 h-12 text-sky-400 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-sky-400 animate-ping" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-sky-300">Gemini กำลังอ่านข้อมูลในใบเสร็จ...</p>
                      <p className="text-xs text-slate-400 mt-1">
                        กำลังแยกแยะชื่อร้านค้า วันที่ สินค้า และยอดเงินรวม
                      </p>
                    </div>
                  </div>
                )}

                {!isScanning && (
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => triggerScan(selectedImage, 'image/jpeg')}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs backdrop-blur-xs"
                      title="สแกนใหม่อีกครั้ง"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setHasExtracted(false);
                      }}
                      className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs"
                      title="ลบรูปภาพ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-3/4 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">คลิกเพื่อถ่ายรูป หรือ อัปโหลดใบเสร็จ</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  รองรับไฟล์รูปภาพ JPG, PNG จากกล้องมือถือหรือสลิปการโอน
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    📸 แม็คโคร / โลตัส
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                    🥬 บิลตลาดสด
                  </span>
                </div>
              </div>
            )}

            {scanError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {isSimulated && (
              <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs">
                💡 โหมดสาธิตจำลอง: วิเคราะห์ใบเสร็จตัวอย่างสำหรับการทดสอบ
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted Expense Details & Accounting Verification (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  ข้อมูลบัญชีและค่าใช้จ่าย (ตรวจสอบและยืนยัน)
                </h3>
              </div>
              {hasExtracted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ดึงข้อมูลสำเร็จ
                </span>
              )}
            </div>

            {/* Merchant, Date, Category Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อร้านค้า / ผู้จำหน่าย:</label>
                <div className="relative">
                  <Building className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="เช่น Makro, ตลาดสดคลองเตย, การไฟฟ้านครหลวง"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">วันที่ตามใบเสร็จ:</label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">หมวดหมู่ค่าใช้จ่าย:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500 bg-white"
                >
                  <option value="วัตถุดิบอาหาร">วัตถุดิบอาหาร</option>
                  <option value="เครื่องดื่ม">เครื่องดื่ม</option>
                  <option value="บรรจุภัณฑ์">บรรจุภัณฑ์</option>
                  <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (ค่าน้ำ/ค่าไฟ)</option>
                  <option value="อุปกรณ์และซ่อมบำรุง">อุปกรณ์และซ่อมบำรุง</option>
                  <option value="เบ็ดเตล็ด">เบ็ดเตล็ด</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">เลขที่ใบเสร็จ / INV:</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="เช่น INV-2026-091"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Line items table extracted from receipt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  รายการสินค้าที่สแกนพบ ({items.length} รายการ):
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> เพิ่มแถวรายการ
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2 px-3">รายการสินค้า</th>
                      <th className="py-2 px-2 w-16 text-center">จน.</th>
                      <th className="py-2 px-2 w-24 text-right">ราคา/หน่วย</th>
                      <th className="py-2 px-2 w-24 text-right">รวม (฿)</th>
                      <th className="py-2 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          ยังไม่มีรายการสินค้า (กดปุ่มสแกนใบเสร็จด้านซ้าย หรือกดเพิ่มรายการ)
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                              placeholder="ชื่อสินค้า..."
                              className="w-full px-1.5 py-1 rounded border border-transparent hover:border-slate-200 focus:border-amber-500 font-medium text-slate-800"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-center px-1 py-1 rounded border border-transparent hover:border-slate-200 focus:border-amber-500 font-semibold"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="0.5"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                              }
                              className="w-full text-right px-1 py-1 rounded border border-transparent hover:border-slate-200 focus:border-amber-500 font-mono"
                            />
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold text-slate-800">
                            ฿{item.amount.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
              <div>
                <label className="font-bold text-slate-700 block mb-1">บันทึกเพิ่มเติม:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น สั่งผักสดรอบเช้า, จ่ายด้วยบัตรเครดิตบริษัท..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">ภาษีมูลค่าเพิ่ม (VAT):</span>
                  <input
                    type="number"
                    value={tax || ''}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value) || 0;
                      setTax(t);
                      recalcTotal(items, t);
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-0.5 rounded border border-slate-200 text-right font-mono font-semibold"
                  />
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-slate-200 font-bold text-slate-900">
                  <span className="text-sm">ยอดรวมทั้งสิ้น (Total):</span>
                  <span className="text-xl font-extrabold text-amber-600">
                    ฿{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!merchantName || total <= 0}
                onClick={handleSaveExpense}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all ${
                  !merchantName || total <= 0
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกบัญชีรายจ่ายลงในระบบ (Record to P&L Expenses)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expense History List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              ประวัติการบันทึกใบเสร็จและค่าใช้จ่าย ({expenses.length} รายการ)
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-600">
            ยอดค่าใช้จ่ายรวม:{' '}
            <span className="font-bold text-rose-600 font-mono">
              ฿{expenses.reduce((s, e) => s + e.total, 0).toLocaleString()}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">วันที่</th>
                <th className="py-3 px-4">ร้านค้า / ผู้จำหน่าย</th>
                <th className="py-3 px-4">หมวดหมู่</th>
                <th className="py-3 px-4">รายการสินค้า</th>
                <th className="py-3 px-4">วิธีชำระ</th>
                <th className="py-3 px-4">ผู้บันทึก</th>
                <th className="py-3 px-4 text-right">ยอดรวม (บาท)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-slate-500">{exp.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{exp.merchantName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                    {exp.items?.map((i) => i.name).join(', ') || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{exp.paymentMethod}</td>
                  <td className="py-3 px-4 text-slate-600">{exp.createdBy}</td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900">
                    ฿{exp.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
