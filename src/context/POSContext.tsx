import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Category,
  Ingredient,
  MenuItem,
  Order,
  CartItem,
  CartItemOption,
  ExpenseRecord,
  UserAccount,
  UserRole,
  OrderStatus,
  PaymentMethod,
  DailySalesSummary,
} from '../types/pos';
import {
  INITIAL_CATEGORIES,
  INITIAL_INGREDIENTS,
  INITIAL_MENU_ITEMS,
  INITIAL_ORDERS,
  INITIAL_EXPENSES,
  INITIAL_USERS,
} from '../data/initialData';
import {
  getSavedGoogleScriptConfig,
  saveGoogleScriptConfig,
  testGoogleScriptConnection as apiTestGoogleScript,
  fetchAllFromGoogleSheets,
  syncAllToGoogleSheets,
  pushOrderToGoogleSheets,
  pushOrderStatusToGoogleSheets,
  pushIngredientToGoogleSheets,
  pushDeleteIngredientToGoogleSheets,
  pushExpenseToGoogleSheets,
} from '../services/googleSheetsService';

interface POSContextType {
  // Navigation & View
  activeTab: string;
  setActiveTab: (tab: string) => void;
  restaurantName: string;
  setRestaurantName: (name: string) => void;
  promptPayId: string;
  setPromptPayId: (id: string) => void;

  // Google Sheets Cloud Database Integration
  googleScriptUrl: string;
  setGoogleScriptUrl: (url: string) => void;
  googleSheetUrl: string;
  setGoogleSheetUrl: (url: string) => void;
  autoSyncToSheets: boolean;
  setAutoSyncToSheets: (auto: boolean) => void;
  isGoogleScriptSyncing: boolean;
  googleScriptStatus: 'disconnected' | 'connected' | 'syncing' | 'error';
  lastGoogleScriptSync: string | null;
  testGoogleScriptConnection: (url?: string) => Promise<{ success: boolean; message: string }>;
  syncAllToSheets: () => Promise<boolean>;
  loadAllFromSheets: () => Promise<boolean>;

  // Auth & Roles
  currentUser: UserAccount;
  users: UserAccount[];
  isGuestMode: boolean;
  switchUser: (user: UserAccount) => void;
  loginWithPin: (pin: string) => boolean;
  switchToGuestMode: () => void;
  updateUserPermissions: (userId: string, permissions: UserAccount['permissions']) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  addUser: (user: Omit<UserAccount, 'id'>) => void;

  // Menu
  menuItems: MenuItem[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleItemAvailability: (id: string) => void;
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  deleteMenuItem: (id: string) => void;
  updateMenuItem: (id: string, updated: Partial<MenuItem>) => void;

  // Cart & POS calculations
  cart: CartItem[];
  cartTable: string;
  setCartTable: (table: string) => void;
  cartOrderType: 'dine-in' | 'takeaway';
  setCartOrderType: (type: 'dine-in' | 'takeaway') => void;
  cartCustomerName: string;
  setCartCustomerName: (name: string) => void;
  discount: number;
  setDiscount: (amt: number) => void;
  includeVat: boolean;
  setIncludeVat: (include: boolean) => void;
  includeServiceCharge: boolean;
  setIncludeServiceCharge: (include: boolean) => void;
  addToCart: (item: MenuItem, quantity?: number, options?: CartItemOption) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  cartCalculations: {
    subtotal: number;
    discount: number;
    serviceCharge: number;
    vat: number;
    netTotal: number;
    totalCost: number;
  };

  // Orders
  orders: Order[];
  checkoutCart: (
    paymentMethod: PaymentMethod,
    amountReceived?: number,
    asGuestCustomer?: boolean
  ) => Order;
  submitOrderPayLater: (options?: {
    tableNumber?: string;
    orderType?: 'dine-in' | 'takeaway';
    customerName?: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markOrderPaid: (orderId: string, paymentMethod: PaymentMethod, amountReceived?: number) => void;
  cancelOrder: (orderId: string) => void;

  // Inventory & Stock Alert
  inventory: Ingredient[];
  lowStockItems: Ingredient[];
  restockItem: (id: string, amount: number, unitCost?: number) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastRestockedAt'>) => void;
  updateIngredient: (id: string, updated: Partial<Omit<Ingredient, 'id'>>) => void;
  deleteIngredient: (id: string) => void;

  // Expenses & AI Receipt OCR
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'createdAt'>) => void;

  // Daily Sales & P&L
  dailySalesSummary: DailySalesSummary;
  filteredDailySales: (daysAgo?: number) => DailySalesSummary;

  // Toast / System notice
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & General
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [restaurantName, setRestaurantName] = useState<string>('ครัวไทยรสเอก (Thai Flavor Kitchen)');
  const [promptPayId, setPromptPayId] = useState<string>('081-234-5678');

  // Users & Auth
  const [users, setUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('pos_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    return users[0] || INITIAL_USERS[0];
  });
  const isGuestMode = currentUser.role === 'CUSTOMER_GUEST';

  // Menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('pos_menu_items');
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });
  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTable, setCartTable] = useState<string>('โต๊ะ 1');
  const [cartOrderType, setCartOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [cartCustomerName, setCartCustomerName] = useState<string>('ลูกค้าทั่วไป');
  const [discount, setDiscount] = useState<number>(0);
  const [includeVat, setIncludeVat] = useState<boolean>(false);
  const [includeServiceCharge, setIncludeServiceCharge] = useState<boolean>(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  // Inventory
  const [inventory, setInventory] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem('pos_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  // Expenses
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('pos_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist to local storage
  useEffect(() => {
    localStorage.setItem('pos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('pos_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('pos_menu_items', JSON.stringify(menuItems));
  }, [menuItems]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Google Sheets Cloud Database Integration State
  const initialGasConfig = useMemo(() => getSavedGoogleScriptConfig(), []);
  const [googleScriptUrl, setGoogleScriptUrlState] = useState<string>(initialGasConfig.scriptUrl);
  const [googleSheetUrl, setGoogleSheetUrlState] = useState<string>(initialGasConfig.sheetUrl);
  const [autoSyncToSheets, setAutoSyncToSheetsState] = useState<boolean>(initialGasConfig.autoSync);
  const [lastGoogleScriptSync, setLastGoogleScriptSync] = useState<string | null>(initialGasConfig.lastSyncedAt);
  const [isGoogleScriptSyncing, setIsGoogleScriptSyncing] = useState<boolean>(false);
  const [googleScriptStatus, setGoogleScriptStatus] = useState<'disconnected' | 'connected' | 'syncing' | 'error'>(
    initialGasConfig.scriptUrl ? 'connected' : 'disconnected'
  );

  const setGoogleScriptUrl = (url: string) => {
    const trimmed = url.trim();
    setGoogleScriptUrlState(trimmed);
    saveGoogleScriptConfig({ scriptUrl: trimmed });
    setGoogleScriptStatus(trimmed ? 'connected' : 'disconnected');
  };

  const setGoogleSheetUrl = (url: string) => {
    const trimmed = url.trim();
    setGoogleSheetUrlState(trimmed);
    saveGoogleScriptConfig({ sheetUrl: trimmed });
  };

  const setAutoSyncToSheets = (auto: boolean) => {
    setAutoSyncToSheetsState(auto);
    saveGoogleScriptConfig({ autoSync: auto });
  };

  const testGoogleScriptConnection = async (
    url?: string
  ): Promise<{ success: boolean; message: string; details?: any }> => {
    const targetUrl = url || googleScriptUrl;
    if (!targetUrl) {
      return { success: false, message: 'กรุณากรอก URL เว็บแอป Google Apps Script' };
    }
    setIsGoogleScriptSyncing(true);
    const res = await apiTestGoogleScript(targetUrl);
    setIsGoogleScriptSyncing(false);
    if (res.success) {
      setGoogleScriptStatus('connected');
    } else {
      setGoogleScriptStatus('error');
    }
    return res;
  };

  const syncAllToSheets = async (): Promise<boolean> => {
    if (!googleScriptUrl) {
      showToast('กรุณาระบุ URL เว็บแอป Google Apps Script ก่อน');
      return false;
    }
    setIsGoogleScriptSyncing(true);
    setGoogleScriptStatus('syncing');
    try {
      const res = await syncAllToGoogleSheets(googleScriptUrl, {
        orders,
        menuItems,
        inventory,
        expenses,
        users,
        restaurantName,
        promptPayId,
      });
      if (res.success) {
        const now = new Date().toISOString();
        setLastGoogleScriptSync(now);
        saveGoogleScriptConfig({ lastSyncedAt: now });
        setGoogleScriptStatus('connected');
        showToast('ซิงค์ข้อมูลทั้งหมดขึ้น Google Sheets สำเร็จเรียบร้อยแล้ว!');
        return true;
      } else {
        setGoogleScriptStatus('error');
        showToast(`ซิงค์ไม่สำเร็จ: ${res.message}`);
        return false;
      }
    } catch (err: any) {
      setGoogleScriptStatus('error');
      showToast(`เกิดข้อผิดพลาด: ${err.message}`);
      return false;
    } finally {
      setIsGoogleScriptSyncing(false);
    }
  };

  const loadAllFromSheets = async (): Promise<boolean> => {
    if (!googleScriptUrl) {
      showToast('กรุณาระบุ URL เว็บแอป Google Apps Script ก่อน');
      return false;
    }
    setIsGoogleScriptSyncing(true);
    setGoogleScriptStatus('syncing');
    try {
      const res = await fetchAllFromGoogleSheets(googleScriptUrl);
      if (res.success && res.data) {
        if (res.data.orders && Array.isArray(res.data.orders) && res.data.orders.length > 0) {
          setOrders(res.data.orders);
        }
        if (res.data.menuItems && Array.isArray(res.data.menuItems) && res.data.menuItems.length > 0) {
          setMenuItems(res.data.menuItems);
        }
        if (res.data.inventory && Array.isArray(res.data.inventory) && res.data.inventory.length > 0) {
          setInventory(res.data.inventory);
        }
        if (res.data.expenses && Array.isArray(res.data.expenses) && res.data.expenses.length > 0) {
          setExpenses(res.data.expenses);
        }
        const now = new Date().toISOString();
        setLastGoogleScriptSync(now);
        saveGoogleScriptConfig({ lastSyncedAt: now });
        setGoogleScriptStatus('connected');
        showToast('ดึงข้อมูลล่าสุดจาก Google Sheets เรียบร้อยแล้ว!');
        return true;
      } else {
        setGoogleScriptStatus('error');
        showToast(`ดึงข้อมูลไม่สำเร็จ: ${res.message || 'ไม่มีข้อมูลตอบกลับ'}`);
        return false;
      }
    } catch (err: any) {
      setGoogleScriptStatus('error');
      showToast(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`);
      return false;
    } finally {
      setIsGoogleScriptSyncing(false);
    }
  };

  // Low stock calculation
  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.currentStock <= item.minThreshold);
  }, [inventory]);

  // Role & Auth Switch
  const switchUser = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'CUSTOMER_GUEST') {
      setActiveTab('customer-self');
      showToast('เข้าสู่โหมดสั่งอาหารสำหรับลูกค้า (ไม่ต้องเข้าสู่ระบบ)');
    } else if (user.role === 'KITCHEN') {
      setActiveTab('kitchen');
      showToast(`เข้าสู่ระบบ: ${user.name}`);
    } else if (user.role === 'INVENTORY_MGR') {
      setActiveTab('inventory');
      showToast(`เข้าสู่ระบบ: ${user.name}`);
    } else {
      setActiveTab('pos');
      showToast(`เข้าสู่ระบบ: ${user.name}`);
    }
  };

  const loginWithPin = (pin: string): boolean => {
    const found = users.find((u) => u.pin === pin && u.active);
    if (found) {
      switchUser(found);
      return true;
    }
    return false;
  };

  const switchToGuestMode = () => {
    const guestUser = users.find((u) => u.role === 'CUSTOMER_GUEST') || {
      id: 'guest',
      name: 'ลูกค้าทั่วไป (Customer)',
      role: 'CUSTOMER_GUEST' as const,
      pin: '',
      active: true,
      permissions: {
        canTakeOrders: true,
        canManageInventory: false,
        canViewReports: false,
        canScanReceipts: false,
        canManageUsers: false,
        canVoidOrders: false,
        canAccessKitchen: false,
      },
    };
    setCurrentUser(guestUser);
    setActiveTab('customer-self');
    showToast('เข้าสู่หน้าสั่งอาหารสำหรับลูกค้า (ลูกค้าทั่วไป)');
  };

  const updateUserPermissions = (userId: string, permissions: UserAccount['permissions']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, permissions } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, permissions }));
    }
    showToast('อัปเดตสิทธิ์การใช้งานเรียบร้อยแล้ว');
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role,
          };
        }
        return u;
      })
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, role }));
    }
    showToast('อัปเดตสิทธิ์การใช้งานเรียบร้อยแล้ว');
  };

  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: 'user-' + Date.now(),
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`เพิ่มผู้ใช้งาน ${newUser.name} เรียบร้อยแล้ว`);
  };

  // Cart operations
  const addToCart = (item: MenuItem, quantity = 1, options?: CartItemOption) => {
    setCart((prev) => {
      // Calculate unit price with options
      let extraPrice = 0;
      if (options?.addOns) {
        extraPrice = options.addOns.reduce((acc, curr) => acc + curr.price, 0);
      }
      if (options?.meatChoice && options.meatChoice.includes('+')) {
        const match = options.meatChoice.match(/\+(\d+)/);
        if (match) extraPrice += parseInt(match[1], 10);
      }
      const unitPrice = item.price + extraPrice;

      // Check if identical option exists in cart
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.menuItemId === item.id &&
          JSON.stringify(ci.options || {}) === JSON.stringify(options || {})
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          totalPrice: newQty * unitPrice,
        };
        return updated;
      }

      const newCartItem: CartItem = {
        id: 'ci-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        menuItemId: item.id,
        name: item.name,
        price: unitPrice,
        quantity,
        cost: item.cost,
        options,
        totalPrice: unitPrice * quantity,
      };
      return [...prev, newCartItem];
    });

    showToast(`เพิ่ม "${item.name}" ลงในรายการ`);
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.price * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Cart calculations
  const cartCalculations = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalCost = cart.reduce((sum, item) => sum + item.cost * item.quantity, 0);
    const discounted = Math.max(0, subtotal - discount);
    const serviceCharge = includeServiceCharge ? Math.round(discounted * 0.1) : 0;
    const vat = includeVat ? Math.round((discounted + serviceCharge) * 0.07) : 0;
    const netTotal = discounted + serviceCharge + vat;

    return {
      subtotal,
      discount,
      serviceCharge,
      vat,
      netTotal,
      totalCost,
    };
  }, [cart, discount, includeServiceCharge, includeVat]);

  // Inventory deduction helper
  const deductInventoryForItems = (items: CartItem[]) => {
    setInventory((prevInv) => {
      const updatedInv = [...prevInv];
      let lowStockAlertTriggered = false;

      items.forEach((cartItem) => {
        const menuItem = menuItems.find((m) => m.id === cartItem.menuItemId);
        if (menuItem && menuItem.ingredients) {
          menuItem.ingredients.forEach((ingUsage) => {
            const index = updatedInv.findIndex((i) => i.id === ingUsage.ingredientId);
            if (index > -1) {
              const deductAmount = ingUsage.quantity * cartItem.quantity;
              const newStock = Math.max(0, Number((updatedInv[index].currentStock - deductAmount).toFixed(3)));
              updatedInv[index] = {
                ...updatedInv[index],
                currentStock: newStock,
              };
              if (newStock <= updatedInv[index].minThreshold) {
                lowStockAlertTriggered = true;
              }
            }
          });
        }
      });

      if (lowStockAlertTriggered) {
        showToast('⚠️ มีวัตถุดิบลดลงถึงเกณฑ์แจ้งเตือน กรุณาตรวจสอบสต็อก');
      }

      return updatedInv;
    });
  };

  // Checkout Cart
  const checkoutCart = (
    paymentMethod: PaymentMethod,
    amountReceived?: number,
    asGuestCustomer?: boolean
  ): Order => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const seqNum = String(orders.length + 1).padStart(3, '0');
    const orderNumber = `ORD-${dateStr}-${seqNum}`;

    const isGuest = asGuestCustomer || currentUser.role === 'CUSTOMER_GUEST';
    const cName = isGuest
      ? `${cartCustomerName || 'ลูกค้าทั่วไป'} (${cartOrderType === 'dine-in' ? cartTable : 'กลับบ้าน'})`
      : cartCustomerName || 'ลูกค้าทั่วไป';

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      createdAt: now.toISOString(),
      tableNumber: cartOrderType === 'dine-in' ? cartTable : 'กลับบ้าน (Takeaway)',
      orderType: cartOrderType,
      customerType: 'guest',
      customerName: cName,
      items: [...cart],
      subtotal: cartCalculations.subtotal,
      discount: cartCalculations.discount,
      serviceCharge: cartCalculations.serviceCharge,
      vat: cartCalculations.vat,
      netTotal: cartCalculations.netTotal,
      status: 'cooking',
      paymentStatus: 'paid',
      paymentMethod,
      amountReceived: amountReceived || cartCalculations.netTotal,
      changeAmount: amountReceived ? Math.max(0, amountReceived - cartCalculations.netTotal) : 0,
      paidAt: now.toISOString(),
      staffId: currentUser.id,
      staffName: isGuest ? 'ลูกค้าสั่งเอง (Guest Self-Order)' : currentUser.name,
    };

    // Add to orders
    setOrders((prev) => [newOrder, ...prev]);

    // Automatically deduct linked inventory stock
    deductInventoryForItems(cart);

    // Clear cart
    clearCart();

    // Real-time auto-sync to Google Sheets
    if (autoSyncToSheets && googleScriptUrl) {
      pushOrderToGoogleSheets(googleScriptUrl, newOrder).catch((err) =>
        console.warn('Google Sheets auto-sync order error:', err)
      );
    }

    showToast(`ชำระเงินสำเร็จ บิลเลขที่ ${orderNumber}`);
    return newOrder;
  };

  const submitOrderPayLater = (options?: {
    tableNumber?: string;
    orderType?: 'dine-in' | 'takeaway';
    customerName?: string;
  }): Order => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const seqNum = String(orders.length + 1).padStart(3, '0');
    const orderNumber = `ORD-${dateStr}-${seqNum}`;

    const isGuest = currentUser.role === 'CUSTOMER_GUEST';
    const tbl = options?.tableNumber || (cartOrderType === 'dine-in' ? cartTable : 'กลับบ้าน (Takeaway)');
    const oType = options?.orderType || cartOrderType;
    const cName = options?.customerName || cartCustomerName || 'ลูกค้าทั่วไป';

    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      orderNumber,
      createdAt: now.toISOString(),
      tableNumber: tbl,
      orderType: oType,
      customerType: 'guest',
      customerName: `${cName} (${tbl})`,
      items: [...cart],
      subtotal: cartCalculations.subtotal,
      discount: cartCalculations.discount,
      serviceCharge: cartCalculations.serviceCharge,
      vat: cartCalculations.vat,
      netTotal: cartCalculations.netTotal,
      status: 'cooking',
      paymentStatus: 'unpaid',
      staffId: currentUser.id,
      staffName: isGuest ? 'ลูกค้าสั่งเอง (Guest Self-Order)' : currentUser.name,
    };

    setOrders((prev) => [newOrder, ...prev]);
    deductInventoryForItems(cart);
    clearCart();

    // Real-time auto-sync to Google Sheets
    if (autoSyncToSheets && googleScriptUrl) {
      pushOrderToGoogleSheets(googleScriptUrl, newOrder).catch((err) =>
        console.warn('Google Sheets auto-sync order error:', err)
      );
    }

    showToast(`ส่งรายการอาหารเข้าครัวเรียบร้อยแล้ว (${tbl}) - รอชำระเงิน`);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
    if (autoSyncToSheets && googleScriptUrl) {
      pushOrderStatusToGoogleSheets(googleScriptUrl, { orderId, status }).catch(console.warn);
    }
    showToast(`อัปเดตสถานะออเดอร์เป็น: ${status}`);
  };

  const markOrderPaid = (
    orderId: string,
    paymentMethod: PaymentMethod,
    amountReceived?: number
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const rec = amountReceived || ord.netTotal;
          const change = Math.max(0, rec - ord.netTotal);
          const paidTime = new Date().toISOString();
          if (autoSyncToSheets && googleScriptUrl) {
            pushOrderStatusToGoogleSheets(googleScriptUrl, {
              orderId,
              status: 'completed',
              paymentStatus: 'paid',
              paymentMethod,
              amountReceived: rec,
              changeAmount: change,
              paidAt: paidTime,
            }).catch(console.warn);
          }
          return {
            ...ord,
            paymentStatus: 'paid',
            paymentMethod,
            amountReceived: rec,
            changeAmount: change,
            paidAt: paidTime,
          };
        }
        return ord;
      })
    );
    showToast('บันทึกการชำระเงินเรียบร้อยแล้ว');
  };

  const cancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: 'cancelled' } : ord))
    );
    if (autoSyncToSheets && googleScriptUrl) {
      pushOrderStatusToGoogleSheets(googleScriptUrl, {
        orderId,
        status: 'cancelled',
      }).catch(console.warn);
    }
    showToast('ยกเลิกรายการออเดอร์เรียบร้อยแล้ว');
  };

  // Restock inventory item
  const restockItem = (id: string, amount: number, unitCost?: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = {
            ...item,
            currentStock: Number((item.currentStock + amount).toFixed(2)),
            costPerUnit: unitCost !== undefined ? unitCost : item.costPerUnit,
            lastRestockedAt: new Date().toISOString().split('T')[0],
          };
          if (autoSyncToSheets && googleScriptUrl) {
            pushIngredientToGoogleSheets(googleScriptUrl, updatedItem, false).catch(console.warn);
          }
          return updatedItem;
        }
        return item;
      })
    );
    showToast(`เติมสต็อกเรียบร้อยแล้ว (+${amount})`);
  };

  // Add new ingredient
  const addIngredient = (itemData: Omit<Ingredient, 'id' | 'lastRestockedAt'>) => {
    const newId = 'ing-' + Date.now();
    const newIngredient: Ingredient = {
      ...itemData,
      id: newId,
      lastRestockedAt: new Date().toISOString().split('T')[0],
    };
    setInventory((prev) => [newIngredient, ...prev]);
    if (autoSyncToSheets && googleScriptUrl) {
      pushIngredientToGoogleSheets(googleScriptUrl, newIngredient, true).catch(console.warn);
    }
    showToast(`เพิ่มวัตถุดิบ "${itemData.name}" เรียบร้อยแล้ว`);
  };

  // Update ingredient
  const updateIngredient = (id: string, updated: Partial<Omit<Ingredient, 'id'>>) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updated };
          if (autoSyncToSheets && googleScriptUrl) {
            pushIngredientToGoogleSheets(googleScriptUrl, updatedItem, false).catch(console.warn);
          }
          return updatedItem;
        }
        return item;
      })
    );
    showToast('อัปเดตข้อมูลวัตถุดิบเรียบร้อยแล้ว');
  };

  // Delete ingredient
  const deleteIngredient = (id: string) => {
    const itemToDelete = inventory.find((i) => i.id === id);
    setInventory((prev) => prev.filter((item) => item.id !== id));
    if (autoSyncToSheets && googleScriptUrl) {
      pushDeleteIngredientToGoogleSheets(googleScriptUrl, id).catch(console.warn);
    }
    showToast(`ลบวัตถุดิบ "${itemToDelete?.name || ''}" เรียบร้อยแล้ว`);
  };

  // Add expense record
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id' | 'createdAt'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: 'exp-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    if (autoSyncToSheets && googleScriptUrl) {
      pushExpenseToGoogleSheets(googleScriptUrl, newExpense).catch(console.warn);
    }
    showToast(`บันทึกค่าใช้จ่าย "${expenseData.merchantName}" เรียบร้อยแล้ว`);
  };

  const toggleItemAvailability = (id: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const addMenuItem = (itemData: Omit<MenuItem, 'id'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: 'menu-' + Date.now(),
    };
    setMenuItems((prev) => [newItem, ...prev]);
    showToast(`เพิ่มเมนู "${newItem.name}" เรียบร้อยแล้ว`);
  };

  const deleteMenuItem = (id: string) => {
    const target = menuItems.find((m) => m.id === id);
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    setCart((prev) => prev.filter((ci) => ci.menuItemId !== id));
    showToast(`ลบเมนู "${target?.name || ''}" เรียบร้อยแล้ว`);
  };

  const updateMenuItem = (id: string, updated: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    showToast('อัปเดตข้อมูลเมนูอาหารเรียบร้อยแล้ว');
  };

  // Daily Sales Summary & P&L calculation
  const getSalesSummaryForDays = (daysAgo = 0): DailySalesSummary => {
    const targetDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const targetOrders = orders.filter((o) => {
      return o.paymentStatus === 'paid' && o.createdAt.startsWith(targetDate);
    });

    const targetExpenses = expenses.filter((e) => e.date === targetDate);

    const totalRevenue = targetOrders.reduce((sum, o) => sum + o.netTotal, 0);
    const totalOrders = targetOrders.length;

    // Calculate COGS from order items
    const cogs = targetOrders.reduce((sum, o) => {
      const orderCogs = o.items.reduce((iSum, item) => iSum + item.cost * item.quantity, 0);
      return sum + orderCogs;
    }, 0);

    const totalExpenses = targetExpenses.reduce((sum, e) => sum + e.total, 0);
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalExpenses;

    const cashRevenue = targetOrders
      .filter((o) => o.paymentMethod === 'CASH')
      .reduce((sum, o) => sum + o.netTotal, 0);
    const qrRevenue = targetOrders
      .filter((o) => o.paymentMethod === 'PROMPTPAY_QR')
      .reduce((sum, o) => sum + o.netTotal, 0);
    const cardRevenue = targetOrders
      .filter((o) => o.paymentMethod === 'CREDIT_CARD')
      .reduce((sum, o) => sum + o.netTotal, 0);

    return {
      date: targetDate,
      totalRevenue,
      totalOrders,
      cogs,
      grossProfit,
      totalExpenses,
      netProfit,
      cashRevenue,
      qrRevenue,
      cardRevenue,
    };
  };

  const dailySalesSummary = useMemo(() => {
    return getSalesSummaryForDays(0);
  }, [orders, expenses]);

  return (
    <POSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        restaurantName,
        setRestaurantName,
        promptPayId,
        setPromptPayId,
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
        currentUser,
        users,
        isGuestMode,
        switchUser,
        loginWithPin,
        switchToGuestMode,
        updateUserPermissions,
        updateUserRole,
        addUser,
        menuItems,
        categories,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        toggleItemAvailability,
        addMenuItem,
        deleteMenuItem,
        updateMenuItem,
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
        orders,
        checkoutCart,
        submitOrderPayLater,
        updateOrderStatus,
        markOrderPaid,
        cancelOrder,
        inventory,
        lowStockItems,
        restockItem,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        expenses,
        addExpense,
        dailySalesSummary,
        filteredDailySales: getSalesSummaryForDays,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
