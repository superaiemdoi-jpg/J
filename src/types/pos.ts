export type UserRole = 'ADMIN' | 'CASHIER' | 'KITCHEN' | 'INVENTORY_MGR' | 'CUSTOMER_GUEST';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  pin: string; // 4-digit PIN for quick staff switch
  avatar?: string;
  active: boolean;
  permissions: {
    canTakeOrders: boolean;
    canManageInventory: boolean;
    canViewReports: boolean;
    canScanReceipts: boolean;
    canManageUsers: boolean;
    canVoidOrders: boolean;
    canAccessKitchen: boolean;
  };
}

export type CategoryType = 'all' | 'single-dish' | 'main' | 'soup' | 'appetizer' | 'beverage' | 'dessert';

export interface Category {
  id: CategoryType;
  name: string;
  iconName: string;
}

export interface IngredientUsage {
  ingredientId: string;
  quantity: number; // amount deducted per portion
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  nameEn: string;
  category: CategoryType;
  price: number;
  cost: number; // Cost of Goods per portion
  imageUrl: string;
  description: string;
  isAvailable: boolean;
  popular?: boolean;
  options?: {
    spiciness?: boolean;
    meatChoices?: string[];
    addOns?: { name: string; price: number }[];
  };
  ingredients?: IngredientUsage[];
}

export interface CartItemOption {
  spiciness?: 'ไม่เผ็ด' | 'เผ็ดน้อย' | 'เผ็ดปกติ' | 'เผ็ดมาก';
  meatChoice?: string;
  addOns?: { name: string; price: number }[];
  note?: string;
}

export interface CartItem {
  id: string; // unique item uuid in cart
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  cost: number;
  options?: CartItemOption;
  totalPrice: number;
}

export type OrderStatus = 'pending' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'PROMPTPAY_QR' | 'CASH' | 'CREDIT_CARD' | 'TRANSFER';

export interface Order {
  id: string;
  orderNumber: string; // e.g. ORD-20260910-001
  createdAt: string;
  tableNumber: string; // "โต๊ะ 1" or "กลับบ้าน (Takeaway)"
  orderType: 'dine-in' | 'takeaway';
  customerType: 'guest' | 'member';
  customerName: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  serviceCharge: number;
  vat: number;
  netTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  amountReceived?: number;
  changeAmount?: number;
  paidAt?: string;
  staffId?: string;
  staffName?: string;
  notes?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: 'meat' | 'vegetable' | 'seasoning' | 'staple' | 'beverage' | 'packaging';
  currentStock: number;
  minThreshold: number;
  unit: string;
  costPerUnit: number;
  lastRestockedAt: string;
}

export interface ExpenseItem {
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ExpenseRecord {
  id: string;
  merchantName: string;
  invoiceNumber?: string;
  date: string;
  category: 'วัตถุดิบอาหาร' | 'เครื่องดื่ม' | 'บรรจุภัณฑ์' | 'ค่าสาธารณูปโภค' | 'อุปกรณ์และซ่อมบำรุง' | 'เบ็ดเตล็ด';
  items: ExpenseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  notes?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
}

export interface DailySalesSummary {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  cogs: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  cashRevenue: number;
  qrRevenue: number;
  cardRevenue: number;
}
