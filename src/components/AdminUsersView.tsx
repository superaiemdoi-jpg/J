import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { UserAccount, UserRole } from '../types/pos';
import {
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  CheckCircle2,
  XCircle,
  Settings,
  Building,
  QrCode,
  Check,
  X,
  Shield,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const {
    users,
    addUser,
    updateUserRole,
    currentUser,
    promptPayId,
    setPromptPayId,
    restaurantName,
    setRestaurantName,
    showToast,
  } = usePOS();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CASHIER');
  const [newUserPin, setNewUserPin] = useState<string>('1234');

  // Restaurant settings state
  const [tempPromptPayId, setTempPromptPayId] = useState<string>(promptPayId);
  const [tempRestaurantName, setTempRestaurantName] = useState<string>(restaurantName);

  const rolesConfig: Record<
    UserRole,
    { title: string; color: string; permissions: string[]; desc: string }
  > = {
    ADMIN: {
      title: 'ผู้ดูแลระบบ (Admin / เจ้าของร้าน)',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      permissions: [
        'เข้าถึงทุกส่วนในระบบ',
        'จัดการสิทธิ์และเพิ่มผู้ใช้งาน',
        'ดูและออกรายงานกำไรขาดทุน (P&L)',
        'สแกนใบเสร็จและบันทึกบัญชี AI',
        'จัดการสต็อกและต้นทุนสินค้า',
      ],
      desc: 'สิทธิ์สูงสุดสำหรับเจ้าของร้านและผู้บริหาร',
    },
    INVENTORY_MGR: {
      title: 'ผู้จัดการสต็อกและกะ (Manager)',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      permissions: [
        'คิดเงินและสั่งอาหารหน้าร้าน',
        'ดูรายงานยอดขายประจำวัน',
        'สแกนใบเสร็จค่าใช้จ่าย',
        'เติมสต็อกและตรวจสอบสินค้าใกล้หมด',
      ],
      desc: 'สำหรับหัวหน้างานดูแลหน้าร้านและสต็อก',
    },
    CASHIER: {
      title: 'พนักงานแคชเชียร์ (Cashier)',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      permissions: [
        'รับออเดอร์และบันทึกรายการอาหาร',
        'สร้าง PromptPay QR และคิดเงินสด',
        'พิมพ์ใบเสร็จให้ลูกค้า',
      ],
      desc: 'สำหรับพนักงานคิดเงินหน้าร้าน',
    },
    KITCHEN: {
      title: 'พนักงานห้องครัว (Kitchen)',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      permissions: [
        'ดูคิวรายการอาหารที่ลูกค้าสั่ง',
        'อัปเดตสถานะการปรุงอาหาร',
        'ดูจำนวนสต็อกคงเหลือ',
      ],
      desc: 'สำหรับฝ่ายครัวและบาร์เครื่องดื่ม',
    },
    CUSTOMER_GUEST: {
      title: 'ลูกค้าทั่วไป (Self-Service Guest)',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      permissions: [
        'สั่งอาหารด้วยตนเองผ่านเมนูดิจิทัล',
        'ชำระเงินผ่าน PromptPay QR Code',
        'ดูสถานะการปรุงอาหาร',
      ],
      desc: 'สำหรับลูกค้าที่สั่งอาหารเองโดยไม่ต้องล็อกอิน',
    },
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPromptPayId(tempPromptPayId);
    setRestaurantName(tempRestaurantName);
    showToast('บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      alert('กรุณากรอกชื่อพนักงาน');
      return;
    }

    const defaultPermissions = {
      canTakeOrders:
        newUserRole === 'ADMIN' || newUserRole === 'CASHIER' || newUserRole === 'INVENTORY_MGR',
      canManageInventory: newUserRole === 'ADMIN' || newUserRole === 'INVENTORY_MGR',
      canViewReports: newUserRole === 'ADMIN' || newUserRole === 'INVENTORY_MGR',
      canScanReceipts: newUserRole === 'ADMIN' || newUserRole === 'INVENTORY_MGR',
      canManageUsers: newUserRole === 'ADMIN',
      canVoidOrders: newUserRole === 'ADMIN' || newUserRole === 'INVENTORY_MGR',
      canAccessKitchen: newUserRole === 'ADMIN' || newUserRole === 'KITCHEN',
    };

    addUser({
      name: newUserName.trim(),
      role: newUserRole,
      pin: newUserPin.trim() || '1234',
      active: true,
      permissions: defaultPermissions,
    });

    setIsAddUserModalOpen(false);
    setNewUserName('');
    setNewUserPin('1234');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ระบบความปลอดภัยและการจัดการสิทธิ์ (RBAC)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            จัดการผู้ใช้งานและสิทธิ์ตามตำแหน่งงาน
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            กำหนดบทบาทหน้าที่ แยกสิทธิ์การเข้าถึงข้อมูลทางการเงินและการขายอย่างปลอดภัย
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ เพิ่มพนักงาน / ผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Roles & Permissions Matrix Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {(['ADMIN', 'INVENTORY_MGR', 'CASHIER', 'KITCHEN'] as UserRole[]).map((rKey) => {
          const r = rolesConfig[rKey];
          return (
            <div
              key={rKey}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${r.color}`}>
                    {r.title.split(' ')[0]}
                  </span>
                  <Shield className="w-4 h-4 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-900 text-xs mt-2">{r.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{r.desc}</p>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-600">
                {r.permissions.map((perm, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              รายชื่อผู้ใช้งานในระบบ ({users.length} คน)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            ผู้ใช้งานปัจจุบัน: <span className="font-bold text-slate-900">{currentUser.name}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">ตำแหน่ง / สิทธิ์ (Role)</th>
                <th className="py-3 px-4">รหัส PIN</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4 text-right">ปรับเปลี่ยนสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isCurrent = u.id === currentUser.id;
                const roleInfo = rolesConfig[u.role] || rolesConfig.CASHIER;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-white">
                            คุณ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleInfo.color}`}>
                        {roleInfo.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{u.pin ? '••••' : '-'}</td>
                    <td className="py-3.5 px-4">
                      {u.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ใช้งานอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" /> ระงับการใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="ADMIN">Admin (ผู้ดูแลระบบ)</option>
                        <option value="INVENTORY_MGR">Manager (ผู้จัดการสต็อก)</option>
                        <option value="CASHIER">Cashier (แคชเชียร์)</option>
                        <option value="KITCHEN">Kitchen (ห้องครัว)</option>
                        <option value="CUSTOMER_GUEST">Guest (ลูกค้าสั่งเอง)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restaurant Settings (PromptPay & Business Name) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-slate-800 text-sm">การตั้งค่าข้อมูลร้านและพร้อมเพย์รับเงิน</h3>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ชื่อร้านอาหาร:</label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tempRestaurantName}
                onChange={(e) => setTempRestaurantName(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-semibold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              หมายเลขพร้อมเพย์ร้านค้า (PromptPay ID สำหรับสร้าง QR Code):
            </label>
            <div className="relative">
              <QrCode className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={tempPromptPayId}
                onChange={(e) => setTempPromptPayId(e.target.value)}
                placeholder="เช่น 0812345678 หรือ เลขประจำตัวผู้เสียภาษี 13 หลัก"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="sm:col-span-2 pt-2">
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              บันทึกการตั้งค่าร้านค้า
            </button>
          </div>
        </form>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">เพิ่มพนักงานใหม่</h4>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">ชื่อ - นามสกุล:</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="เช่น มาริสา กิตติชัย"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ตำแหน่งงาน / สิทธิ์:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-semibold bg-white"
                >
                  <option value="CASHIER">พนักงานแคชเชียร์ (Cashier)</option>
                  <option value="KITCHEN">พนักงานห้องครัว (Kitchen)</option>
                  <option value="INVENTORY_MGR">ผู้จัดการสต็อกและกะ (Manager)</option>
                  <option value="ADMIN">ผู้ดูแลระบบ (Admin)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">รหัส PIN (4 หลัก):</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono tracking-widest text-center text-sm font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white shadow-xs"
                >
                  บันทึกพนักงานใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
