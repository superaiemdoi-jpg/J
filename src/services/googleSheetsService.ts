import { Order, MenuItem, Ingredient, ExpenseRecord, UserAccount, OrderStatus, PaymentStatus, PaymentMethod } from '../types/pos';

export interface GoogleSheetsSyncStatus {
  status: 'disconnected' | 'connected' | 'syncing' | 'error';
  lastSyncedAt: string | null;
  message?: string;
}

export interface GoogleSheetsDataResponse {
  success: boolean;
  message?: string;
  data?: {
    orders?: Order[];
    menuItems?: MenuItem[];
    inventory?: Ingredient[];
    expenses?: ExpenseRecord[];
    users?: UserAccount[];
    settings?: Record<string, string>;
  };
  stats?: {
    ordersCount: number;
    menuCount: number;
    inventoryCount: number;
    expensesCount: number;
    usersCount: number;
  };
}

const STORAGE_KEYS = {
  SCRIPT_URL: 'pos_gas_web_app_url',
  SHEET_URL: 'pos_gas_sheet_url',
  AUTO_SYNC: 'pos_gas_auto_sync',
  LAST_SYNC: 'pos_gas_last_synced_at',
};

export const getSavedGoogleScriptConfig = () => {
  return {
    scriptUrl: localStorage.getItem(STORAGE_KEYS.SCRIPT_URL) || '',
    sheetUrl: localStorage.getItem(STORAGE_KEYS.SHEET_URL) || '',
    autoSync: localStorage.getItem(STORAGE_KEYS.AUTO_SYNC) !== 'false', // default true
    lastSyncedAt: localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || null,
  };
};

export const saveGoogleScriptConfig = (config: {
  scriptUrl?: string;
  sheetUrl?: string;
  autoSync?: boolean;
  lastSyncedAt?: string;
}) => {
  if (config.scriptUrl !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, config.scriptUrl.trim());
  }
  if (config.sheetUrl !== undefined) {
    localStorage.setItem(STORAGE_KEYS.SHEET_URL, config.sheetUrl.trim());
  }
  if (config.autoSync !== undefined) {
    localStorage.setItem(STORAGE_KEYS.AUTO_SYNC, config.autoSync ? 'true' : 'false');
  }
  if (config.lastSyncedAt !== undefined) {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, config.lastSyncedAt);
  }
};

/**
 * Clean and format Google Apps Script Web App URL
 */
export const cleanScriptUrl = (url: string): string => {
  let cleaned = url.trim();
  // If user pasted a /edit or /view URL from script editor, notify/fix
  if (cleaned.includes('script.google.com') && !cleaned.includes('/exec')) {
    // try to check if it's an exec url
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.slice(0, -1);
    }
  }
  return cleaned;
};

/**
 * Ping test to check if Google Apps Script Web App is reachable
 */
export const testGoogleScriptConnection = async (
  scriptUrl: string
): Promise<{ success: boolean; message: string; details?: any }> => {
  const url = cleanScriptUrl(scriptUrl);
  if (!url) {
    return { success: false, message: 'กรุณากรอก URL เว็บแอป Google Apps Script' };
  }

  try {
    const testUrl = url.includes('?') ? `${url}&action=ping` : `${url}?action=ping`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.status === 'ok' || data.success) {
      return {
        success: true,
        message: data.message || 'เชื่อมต่อกับ Google Sheet สำเร็จแล้ว!',
        details: data,
      };
    } else {
      return {
        success: false,
        message: data.message || 'ได้รับคำตอบจากเซิร์ฟเวอร์แต่สถานะไม่สมบูรณ์',
        details: data,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อได้: ${err.message || 'กรุณาตรวจสอบว่าตั้งค่าสิทธิ์เข้าถึงเป็น "ทุกคน (Anyone)" หรือยัง'}`,
    };
  }
};

/**
 * Send POST request to Google Apps Script Web App
 * Uses text/plain payload to avoid CORS preflight options issues
 */
const postToGoogleScript = async (scriptUrl: string, payload: any): Promise<any> => {
  const url = cleanScriptUrl(scriptUrl);
  if (!url) throw new Error('ไม่มี URL เว็บแอป Google Apps Script');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  return json;
};

/**
 * Fetch all data from Google Sheets
 */
export const fetchAllFromGoogleSheets = async (
  scriptUrl: string
): Promise<GoogleSheetsDataResponse> => {
  const url = cleanScriptUrl(scriptUrl);
  if (!url) throw new Error('ไม่มี URL เว็บแอป Google Apps Script');

  const reqUrl = url.includes('?') ? `${url}&action=getAll` : `${url}?action=getAll`;
  const response = await fetch(reqUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result;
};

/**
 * Upload all current POS data to Google Sheets (Full Database Sync)
 */
export const syncAllToGoogleSheets = async (
  scriptUrl: string,
  payload: {
    orders: Order[];
    menuItems: MenuItem[];
    inventory: Ingredient[];
    expenses: ExpenseRecord[];
    users: UserAccount[];
    restaurantName: string;
    promptPayId: string;
  }
): Promise<{ success: boolean; message: string; stats?: any }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: 'syncAll',
      data: payload,
    });
    return result;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูลขึ้น Google Sheets',
    };
  }
};

/**
 * Real-time push: Create new order in Google Sheets
 */
export const pushOrderToGoogleSheets = async (
  scriptUrl: string,
  order: Order
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: 'createOrder',
      data: order,
    });
    return result;
  } catch (err: any) {
    console.error('Failed to push order to Google Sheets:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Real-time push: Update order status & payment in Google Sheets
 */
export const pushOrderStatusToGoogleSheets = async (
  scriptUrl: string,
  params: {
    orderId: string;
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    amountReceived?: number;
    changeAmount?: number;
    paidAt?: string;
  }
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: 'updateOrderStatus',
      data: params,
    });
    return result;
  } catch (err: any) {
    console.error('Failed to update order status in Google Sheets:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Real-time push: Add or update ingredient in Google Sheets
 */
export const pushIngredientToGoogleSheets = async (
  scriptUrl: string,
  ingredient: Ingredient,
  isNew: boolean = false
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: isNew ? 'addIngredient' : 'updateIngredient',
      data: ingredient,
    });
    return result;
  } catch (err: any) {
    console.error('Failed to sync ingredient to Google Sheets:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Real-time push: Delete ingredient in Google Sheets
 */
export const pushDeleteIngredientToGoogleSheets = async (
  scriptUrl: string,
  ingredientId: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: 'deleteIngredient',
      data: { id: ingredientId },
    });
    return result;
  } catch (err: any) {
    console.error('Failed to delete ingredient in Google Sheets:', err);
    return { success: false, message: err.message };
  }
};

/**
 * Real-time push: Add expense record in Google Sheets
 */
export const pushExpenseToGoogleSheets = async (
  scriptUrl: string,
  expense: ExpenseRecord
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await postToGoogleScript(scriptUrl, {
      action: 'addExpense',
      data: expense,
    });
    return result;
  } catch (err: any) {
    console.error('Failed to sync expense to Google Sheets:', err);
    return { success: false, message: err.message };
  }
};
