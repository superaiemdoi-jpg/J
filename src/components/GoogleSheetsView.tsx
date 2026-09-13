import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { GOOGLE_APPS_SCRIPT_CODE, GOOGLE_SHEETS_SCHEMAS } from '../data/googleAppsScriptCode';
import {
  Database,
  CloudCheck,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Sparkles,
  Terminal,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export const GoogleSheetsView: React.FC = () => {
  const {
    googleScriptUrl,
    setGoogleScriptUrl,
    googleSheetUrl,
    setGoogleSheetUrl,
    autoSyncToSheets,
    setAutoSyncToSheets,
    isGoogleScriptSyncing,
    googleScriptStatus,
    lastGoogleScriptSync,
    testGoogleScriptConnection,
    syncAllToSheets,
    loadAllFromSheets,
    orders,
    menuItems,
    inventory,
    expenses,
    users,
    showToast,
  } = usePOS();

  const [activeSubTab, setActiveSubTab] = useState<'sync' | 'code' | 'schema' | 'faq'>('sync');
  const [inputUrl, setInputUrl] = useState<string>(googleScriptUrl);
  const [inputSheetUrl, setInputSheetUrl] = useState<string>(googleSheetUrl);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('th-TH')}] ระบบพร้อมเชื่อมต่อ Google Sheets Database`,
  ]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString('th-TH')}] ${msg}`, ...prev.slice(0, 19)]);
  };

  const handleSaveConfig = () => {
    setGoogleScriptUrl(inputUrl);
    setGoogleSheetUrl(inputSheetUrl);
    addLog(`บันทึกการตั้งค่า URL เว็บแอปเรียบร้อยแล้ว`);
    showToast('บันทึกการตั้งค่า Google Sheets เรียบร้อยแล้ว');
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    addLog(`กำลังทดสอบการเชื่อมต่อกับ: ${inputUrl.slice(0, 45)}...`);

    const res = await testGoogleScriptConnection(inputUrl);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      addLog(`✅ ทดสอบเชื่อมต่อสำเร็จ: ${res.message}`);
      setGoogleScriptUrl(inputUrl);
      setGoogleSheetUrl(inputSheetUrl);
    } else {
      addLog(`❌ ทดสอบเชื่อมต่อไม่สำเร็จ: ${res.message}`);
    }
  };

  const handleFullUpload = async () => {
    addLog(`กำลังอัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets (ออเดอร์: ${orders.length}, เมนู: ${menuItems.length}, วัตถุดิบ: ${inventory.length}, รายจ่าย: ${expenses.length})...`);
    const ok = await syncAllToSheets();
    if (ok) {
      addLog(`✅ อัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets สำเร็จเรียบร้อยแล้ว!`);
    } else {
      addLog(`❌ อัปโหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ URL หรือสิทธิ์การเข้าถึง`);
    }
  };

  const handleFullDownload = async () => {
    addLog(`กำลังดึงข้อมูลทั้งหมดจาก Google Sheets...`);
    const ok = await loadAllFromSheets();
    if (ok) {
      addLog(`✅ ดึงข้อมูลล่าสุดจาก Google Sheets ลงสู่ระบบ POS เรียบร้อยแล้ว!`);
    } else {
      addLog(`❌ ดึงข้อมูลไม่สำเร็จ กรุณาตรวจสอบว่าชีตมีข้อมูลถูกต้องหรือไม่`);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    showToast('คัดลอกโค้ด Google Apps Script (Code.gs) เรียบร้อยแล้ว!');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleDownloadCodeFile = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดไฟล์ Code.gs เรียบร้อยแล้ว');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                ฐานข้อมูลคลาวด์ Google Sheets (Database)
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                Google Apps Script
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ใช้ Google Sheets เป็นฐานข้อมูลหลักฟรี 100% ซิงค์ออเดอร์, คลังสต็อก, เมนู และรายจ่ายแบบเรียลไทม์
            </p>
          </div>
        </div>

        {/* Live Status Pill & Sheet Open Button */}
        <div className="flex items-center gap-2">
          {googleScriptStatus === 'connected' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>เชื่อมต่อชีตแล้ว (Online)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>ยังไม่เชื่อมต่อ</span>
            </div>
          )}

          {googleSheetUrl && (
            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>เปิดสเปรดชีต</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('sync')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'sync'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>การเชื่อมต่อและซิงค์ข้อมูล (Connection & Sync)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('code')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'code'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>โค้ด Google Apps Script (Code.gs)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'schema'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>โครงสร้างตารางฐานข้อมูล (8 Sheets)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'faq'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>วิธีติดตั้ง & แก้ปัญหา (FAQ)</span>
        </button>
      </div>

      {/* TAB 1: CONNECTION & SYNC */}
      {activeSubTab === 'sync' && (
        <div className="space-y-6">
          {/* Main Connection Form Card */}
          <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    ตั้งค่า URL เว็บแอป Google Apps Script
                  </h3>
                  <p className="text-xs text-slate-400">
                    นำ Web App URL ที่ได้จากการกด Deploy ใน Google Apps Script มาวางที่นี่
                  </p>
                </div>
              </div>

              {lastGoogleScriptSync && (
                <span className="text-[11px] text-slate-500 font-medium">
                  ซิงค์ล่าสุดเมื่อ: <strong>{new Date(lastGoogleScriptSync).toLocaleTimeString('th-TH')}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>URL เว็บแอป Google Apps Script (Web App URL) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-mono">ลงท้ายด้วย /exec</span>
                </label>
                <input
                  id="input-gas-url"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>ลิงก์เปิด Google Sheets ของคุณ (ไม่บังคับ)</span>
                  <span className="text-[10px] text-slate-400 font-mono">docs.google.com/spreadsheets/...</span>
                </label>
                <input
                  id="input-gas-sheet-url"
                  type="text"
                  value={inputSheetUrl}
                  onChange={(e) => setInputSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Test Result Message Banner */}
            {testResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
                {testResult.success && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-mono">
                    Ping OK
                  </span>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 gap-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={autoSyncToSheets}
                    onChange={(e) => {
                      setAutoSyncToSheets(e.target.checked);
                      showToast(
                        e.target.checked
                          ? 'เปิดการซิงค์อัตโนมัติแล้ว'
                          : 'ปิดการซิงค์อัตโนมัติ'
                      );
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>เปิดการซิงค์อัตโนมัติ (Real-Time Auto Sync)</span>
                </label>
                <span className="text-[11px] text-slate-400 hidden lg:inline">
                  (ส่งข้อมูลทันทีเมื่อมีออเดอร์ใหม่, ชำระเงิน, เติมสต็อก หรือบันทึกค่าใช้จ่าย)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !inputUrl.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Zap className={`w-4 h-4 text-amber-600 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            </div>
          </div>

          {/* Database Synchronization Operations Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Push / Upload Card */}
            <div className="p-5 bg-gradient-to-br from-white to-emerald-50/50 rounded-3xl border border-emerald-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  POS ➡️ Google Sheets
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  อัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets (Push All)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  ส่งข้อมูลทั้งหมดจากระบบ POS ไปเขียนลงในชีต ได้แก่ ออเดอร์, เมนูอาหาร, คลังวัตถุดิบ, รายจ่าย และบัญชีพนักงาน
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-emerald-100 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>รายการออเดอร์:</span>
                  <strong className="text-slate-900">{orders.length} รายการ</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>รายการเมนูอาหาร:</span>
                  <strong className="text-slate-900">{menuItems.length} เมนู</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>รายการคลังวัตถุดิบ:</span>
                  <strong className="text-slate-900">{inventory.length} ชนิด</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>บันทึกรายจ่าย & บัญชี:</span>
                  <strong className="text-slate-900">{expenses.length} รายการ</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFullUpload}
                disabled={isGoogleScriptSyncing}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isGoogleScriptSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isGoogleScriptSyncing
                    ? 'กำลังส่งข้อมูลขึ้น Google Sheets...'
                    : 'อัปโหลดข้อมูลทั้งหมดขึ้น Google Sheets'}
                </span>
              </button>
            </div>

            {/* Pull / Download Card */}
            <div className="p-5 bg-gradient-to-br from-white to-blue-50/50 rounded-3xl border border-blue-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full">
                  Google Sheets ➡️ POS
                </span>
              </div>

              <div>
                <h4 className="font-extrabold text-slate-900 text-base">
                  ดึงข้อมูลทั้งหมดจาก Google Sheets (Pull All)
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  นำเข้าข้อมูลล่าสุดจากสเปรดชีต เช่น หากคุณแก้ไขราคาเมนู หรืออัปเดตจำนวนสต็อกใน Google Sheets บนคอมพิวเตอร์
                </p>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                💡 <strong>เหมาะสำหรับ:</strong> การเปิดร้านในวันใหม่ หรือเมื่อเจ้าของร้านมีการแก้ไขเมนู/ราคาใน Google Sheets โดยตรงแล้วต้องการให้อุปกรณ์แคชเชียร์อัปเดตตามทันที
              </div>

              <button
                type="button"
                onClick={handleFullDownload}
                disabled={isGoogleScriptSyncing}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isGoogleScriptSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isGoogleScriptSyncing
                    ? 'กำลังดึงข้อมูลจาก Google Sheets...'
                    : 'ดึงข้อมูลล่าสุดจาก Google Sheets ลงแอพ'}
                </span>
              </button>
            </div>
          </div>

          {/* Sync Console & Activity Logs */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-slate-300 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">บันทึกกิจกรรมการซิงค์ (Activity Logs)</span>
              </div>
              <button
                onClick={() => setLogs([`[${new Date().toLocaleTimeString('th-TH')}] เคลียร์บันทึกแล้ว`])}
                className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
              >
                เคลียร์บันทึก
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CODE.GS */}
      {activeSubTab === 'code' && (
        <div className="space-y-6">
          {/* Quick Steps Guide */}
          <div className="p-5 bg-amber-50/70 rounded-3xl border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>วิธีนำโค้ดไปวางใน Google Spreadsheet (ง่ายมากเพียง 4 ขั้นตอน):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-700">
              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                <p className="font-bold text-slate-900">สร้าง Google Sheet</p>
                <p className="text-[11px] text-slate-500">เปิด sheets.new แล้วไปที่เมนู <strong>ส่วนขยาย (Extensions)</strong> &gt; <strong>Apps Script</strong></p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                <p className="font-bold text-slate-900">วางโค้ด Code.gs</p>
                <p className="text-[11px] text-slate-500">กดปุ่ม <strong>"คัดลอกโค้ดทั้งหมด"</strong> ด้านล่าง แล้วนำไปวางแทนโค้ดเดิมทั้งหมดใน Apps Script แล้วกด Save</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                <p className="font-bold text-slate-900">กดปุ่ม initDatabase</p>
                <p className="text-[11px] text-slate-500">เลือกฟังก์ชัน <strong>initDatabase</strong> แล้วกด <strong>▶ เรียกใช้ (Run)</strong> เพื่อสร้างตารางอัตโนมัติ</p>
              </div>
              <div className="p-3 bg-white rounded-2xl border border-amber-200 space-y-1">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-[10px]">4</span>
                <p className="font-bold text-slate-900">Deploy เป็นเว็บแอป</p>
                <p className="text-[11px] text-slate-500">กด <strong>Deploy</strong> &gt; <strong>Web app</strong> &gt; ผู้มีสิทธิ์: <strong>"ทุกคน (Anyone)"</strong> แล้วนำ URL มาใส่ในแอพ</p>
              </div>
            </div>
          </div>

          {/* Code Viewer Container */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            {/* Header of Code Box */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-2 font-bold text-white">google-apps-script/Code.gs</span>
                <span className="text-slate-500 text-[10px] hidden sm:inline">(Google Apps Script Backend API)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCodeFile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด Code.gs</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'คัดลอกแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="p-4 sm:p-5 max-h-[600px] overflow-y-auto font-mono text-[11px] sm:text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              <pre className="whitespace-pre-wrap select-all font-mono">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEMA & DATABASE STRUCTURE */}
      {activeSubTab === 'schema' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">
                โครงสร้างฐานข้อมูล 8 แผ่นงาน (Database Schema)
              </h4>
              <p className="text-xs text-slate-500">
                ฟังก์ชัน `initDatabase()` จะสร้างและจัดรูปแบบตารางเหล่านี้ใน Google Sheets ให้อัตโนมัติ
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอกโค้ดติดตั้ง</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GOOGLE_SHEETS_SCHEMAS.map((schema) => (
              <div
                key={schema.name}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-md shrink-0"
                      style={{ backgroundColor: schema.color }}
                    />
                    <h5 className="font-bold text-slate-900 text-sm">{schema.name}</h5>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {schema.columns.length} คอลัมน์
                  </span>
                </div>

                <p className="text-xs text-slate-500">{schema.description}</p>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    คอลัมน์และหัวตาราง:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {schema.columns.map((col, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: FAQ & TROUBLESHOOTING */}
      {activeSubTab === 'faq' && (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">
              คำถามที่พบบ่อยและวิธีแก้ไขปัญหา (Troubleshooting)
            </h3>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  1. ตอนกด Deploy ใน Apps Script ต้องเลือกอะไรบ้าง?
                </h5>
                <p className="leading-relaxed">
                  เลือกประเภท: <strong>เว็บแอป (Web app)</strong> <br />
                  - ดำเนินการในฐานะ (Execute as): <strong>"ฉัน" (Me)</strong> <br />
                  - ผู้มีสิทธิ์เข้าถึง (Who has access): <strong>"ทุกคน" (Anyone)</strong> <br />
                  <span className="text-rose-600 font-semibold">
                    ⚠️ หากไม่ได้เลือก "ทุกคน (Anyone)" เบราว์เซอร์จะติดบล็อก CORS และไม่สามารถส่งออเดอร์เข้าไปได้
                  </span>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  2. มีข้อความแจ้งเตือน "Google ยังไม่ได้ยืนยันแอปนี้" (Unverified app) ตอนกด Run ทำอย่างไร?
                </h5>
                <p className="leading-relaxed">
                  นี่เป็นข้อความปกติสำหรับการใช้งานสคริปต์ส่วนตัวของคุณเอง:
                  <br />
                  1. กดที่คำว่า <strong>"ขั้นสูง" (Advanced)</strong> ที่มุมล่างซ้าย
                  <br />
                  2. กดคลิกที่ <strong>"ไปที่ ... (ไม่ปลอดภัย)" (Go to ... unsafe)</strong>
                  <br />
                  3. กดปุ่ม <strong>"อนุญาต" (Allow)</strong>
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  3. ข้อมูลใน Google Sheets นำไปต่อยอดอะไรได้บ้าง?
                </h5>
                <p className="leading-relaxed">
                  เนื่องจากข้อมูลบันทึกลงใน Google Spreadsheet โดยตรง คุณสามารถ:
                  <br />
                  • เชื่อมต่อไปยัง <strong>Google Looker Studio</strong> เพื่อทำกราฟิกแดชบอร์ดผู้บริหาร
                  <br />
                  • ส่งต่อให้ <strong>สำนักงานบัญชี</strong> ทำภาษีและปิดงบการเงินได้ทันที
                  <br />
                  • ส่งแจ้งเตือนเข้า <strong>LINE Notify</strong> หรือ <strong>LINE Messaging API</strong> เมื่อมีออเดอร์ใหม่
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
