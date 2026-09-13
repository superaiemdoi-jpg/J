export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * 🍽️ ระบบฐานข้อมูลร้านอาหาร POS บน Google Sheets (Google Apps Script Backend)
 * ระบบจัดการออเดอร์, รายการอาหาร, คลังวัตถุดิบ, บัญชีรายจ่าย และพนักงาน
 * =========================================================================
 * 
 * วิธีติดตั้ง:
 * 1. สร้าง Google Spreadsheet ใหม่ขึ้นมา 1 ไฟล์ (เช่น ตั้งชื่อว่า "POS Database - ครัวไทยรสเอก")
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมดออก แล้ววางโค้ดทั้งหมดนี้ลงไป
 * 4. เลือกฟังก์ชัน "initDatabase" แล้วกดปุ่ม "เรียกใช้" (Run) 1 ครั้ง เพื่อสร้างตารางและหัวตารางทั้งหมดอัตโนมัติ
 * 5. กดปุ่มสีน้ำเงิน "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภทเป็น "เว็บแอป" (Web app)
 *    - คำอธิบาย: POS API v1.0
 *    - ดำเนินการในฐานะ (Execute as): "ฉัน" (Me)
 *    - ผู้มีสิทธิ์เข้าถึง (Who has access): "ทุกคน" (Anyone) **สำคัญมาก!**
 * 7. กดปุ่ม "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL เว็บแอป" (Web App URL)
 * 8. นำ URL ที่ได้ไปวางในเมนู "ตั้งค่า Google Sheets" ในระบบ POS หน้าเว็บได้ทันที!
 */

// ชื่อชีตต่างๆ ในระบบฐานข้อมูล
var SHEET_NAMES = {
  DASHBOARD: 'Dashboard',
  ORDERS: 'Orders',
  ORDER_ITEMS: 'OrderItems',
  MENU_ITEMS: 'MenuItems',
  INVENTORY: 'Inventory',
  EXPENSES: 'Expenses',
  USERS: 'Users',
  SETTINGS: 'Settings'
};

/**
 * ฟังก์ชันเริ่มต้น: สร้างชีตและหัวตารางทั้งหมด พร้อมตกแต่งสีสันและฟอร์แมตให้สวยงาม
 * เรียกใช้ฟังก์ชันนี้เพียงครั้งเดียวใน Apps Script Editor!
 */
function initDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ตาราง Orders (คำสั่งซื้อ)
  var ordersSheet = getOrCreateSheet(ss, SHEET_NAMES.ORDERS);
  setupSheetHeaders(ordersSheet, [
    'Order ID', 'เลขที่ออเดอร์', 'วันเวลาที่สั่ง', 'โต๊ะ / Takeaway', 'ประเภทบริการ', 
    'ประเภทลูกค้า', 'ชื่อลูกค้า', 'จำนวนจาน', 'ยอดรวม (Subtotal)', 'ส่วนลด', 
    'Service Charge', 'ภาษี VAT', 'ยอดสุทธิ (Net Total)', 'สถานะออเดอร์', 'สถานะชำระเงิน', 
    'วิธีชำระเงิน', 'ยอดเงินที่รับ', 'เงินทอน', 'เวลาที่ชำระเงิน', 'พนักงานรับออเดอร์', 
    'หมายเหตุ', 'รายการย่อ (Summary)'
  ], '#0F172A'); // Slate 900
  
  // 2. ตาราง OrderItems (รายการอาหารแต่ละจาน)
  var itemsSheet = getOrCreateSheet(ss, SHEET_NAMES.ORDER_ITEMS);
  setupSheetHeaders(itemsSheet, [
    'Order ID', 'เลขที่ออเดอร์', 'Item UUID', 'รหัสเมนู', 'ชื่อเมนู', 
    'จำนวนจาน', 'ราคาต่อจาน', 'ต้นทุนต่อจาน', 'รายละเอียด/ความเผ็ด/ท็อปปิ้ง', 
    'ราคารวม (บาท)', 'วันเวลาที่สั่ง'
  ], '#1E293B'); // Slate 800

  // 3. ตาราง MenuItems (รายการเมนูอาหาร)
  var menuSheet = getOrCreateSheet(ss, SHEET_NAMES.MENU_ITEMS);
  setupSheetHeaders(menuSheet, [
    'รหัสเมนู', 'ชื่อเมนู (TH)', 'ชื่อภาษาอังกฤษ (EN)', 'หมวดหมู่', 'ราคาขาย (บาท)', 
    'ต้นทุน (บาท)', 'รายละเอียดเมนู', 'สถานะพร้อมขาย', 'เมนูแนะนำ', 'ลิงก์รูปภาพ', 
    'ตัวเลือกเสริม (JSON)', 'สูตรวัตถุดิบ (JSON)'
  ], '#D97706'); // Amber 600

  // 4. ตาราง Inventory (คลังวัตถุดิบ)
  var invSheet = getOrCreateSheet(ss, SHEET_NAMES.INVENTORY);
  setupSheetHeaders(invSheet, [
    'รหัสวัตถุดิบ', 'ชื่อวัตถุดิบ', 'หมวดหมู่วัตถุดิบ', 'สต็อกคงเหลือ', 
    'เกณฑ์แจ้งเตือนสต็อกต่ำ', 'หน่วยนับ', 'ต้นทุนเฉลี่ยต่อหน่วย (บาท)', 'วันที่เติมสต็อกล่าสุด'
  ], '#059669'); // Emerald 600

  // 5. ตาราง Expenses (รายจ่าย & ใบเสร็จ OCR)
  var expSheet = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES);
  setupSheetHeaders(expSheet, [
    'รหัสรายจ่าย', 'ร้านค้า / ผู้รับเงิน', 'เลขที่ใบเสร็จ', 'วันที่จ่าย', 'หมวดหมู่รายจ่าย', 
    'ยอดก่อนภาษี', 'ภาษี VAT', 'ยอดจ่ายสุทธิ (บาท)', 'ช่องทางชำระเงิน', 'หมายเหตุ', 
    'ผู้บันทึก', 'เวลาที่บันทึกระบบ'
  ], '#DC2626'); // Rose 600

  // 6. ตาราง Users (พนักงานและสิทธิ์)
  var usersSheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
  setupSheetHeaders(usersSheet, [
    'รหัสผู้ใช้', 'ชื่อพนักงาน', 'ตำแหน่ง (Role)', 'รหัส PIN 4 หลัก', 'สถานะใช้งาน', 
    'ลิงก์รูปโปรไฟล์', 'สิทธิ์การใช้งาน (JSON)'
  ], '#4F46E5'); // Indigo 600

  // 7. ตาราง Settings (การตั้งค่าร้าน)
  var settingsSheet = getOrCreateSheet(ss, SHEET_NAMES.SETTINGS);
  setupSheetHeaders(settingsSheet, [
    'คีย์ (Key)', 'ค่า (Value)', 'คำอธิบายการตั้งค่า', 'อัปเดตล่าสุด'
  ], '#334155'); // Slate 700

  // 8. หน้า Dashboard สรุปผล
  setupDashboard(ss);

  // ลบ Sheet1 เริ่มต้นออกถ้ามี
  try {
    var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('แผ่น1');
    if (defaultSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defaultSheet);
    }
  } catch (e) {
    // ข้ามหากไม่มี
  }

  Logger.log('✅ ติดตั้งโครงสร้างฐานข้อมูล POS บน Google Sheets สำเร็จเรียบร้อยแล้ว!');
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function setupSheetHeaders(sheet, headers, headerBgColor) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setValues([headers]);
  }
  
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(headerBgColor)
             .setFontColor('#FFFFFF')
             .setFontWeight('bold')
             .setFontFamily('Prompt')
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle');
             
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);

  for (var i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 160);
  }
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 160);
}

function setupDashboard(ss) {
  var dash = getOrCreateSheet(ss, SHEET_NAMES.DASHBOARD);
  if (dash.getLastRow() > 0) return;
  
  dash.clear();
  dash.setColumnWidth(1, 30);
  dash.setColumnWidth(2, 220);
  dash.setColumnWidth(3, 180);
  dash.setColumnWidth(4, 220);
  dash.setColumnWidth(5, 180);

  dash.getRange('B2:E2').merge()
      .setValue('🍽️ สรุปภาพรวมร้านอาหาร (POS Executive Dashboard)')
      .setFontSize(16)
      .setFontWeight('bold')
      .setFontColor('#0F172A');

  dash.getRange('B3:E3').merge()
      .setValue('ข้อมูลสรุปอัตโนมัติจากตาราง Orders, Inventory และ Expenses เชื่อมต่อกับระบบ POS แบบเรียลไทม์')
      .setFontSize(10)
      .setFontColor('#64748B');

  dash.getRange('B5:C5').merge().setValue('📊 สรุปยอดขายทั้งหมด').setBackground('#F1F5F9').setFontWeight('bold');
  dash.getRange('B6').setValue('ยอดขายรวมสุทธิ (บาท):');
  dash.getRange('C6').setFormula('=IFERROR(SUM(Orders!M2:M), 0)').setNumberFormat('#,##0.00').setFontWeight('bold');
  dash.getRange('B7').setValue('จำนวนออเดอร์ทั้งหมด:');
  dash.getRange('C7').setFormula('=IFERROR(COUNTA(Orders!A2:A), 0)').setNumberFormat('#,##0');
  dash.getRange('B8').setValue('ยอดขายเฉลี่ยต่อบิล:');
  dash.getRange('C8').setFormula('=IFERROR(C6/C7, 0)').setNumberFormat('#,##0.00');

  dash.getRange('D5:E5').merge().setValue('📦 สต็อกและรายจ่าย').setBackground('#F1F5F9').setFontWeight('bold');
  dash.getRange('D6').setValue('รายจ่ายรวมทั้งหมด (บาท):');
  dash.getRange('E6').setFormula('=IFERROR(SUM(Expenses!H2:H), 0)').setNumberFormat('#,##0.00').setFontColor('#DC2626').setFontWeight('bold');
  dash.getRange('D7').setValue('มูลค่าสินค้าในคลังคงเหลือ:');
  dash.getRange('E7').setFormula('=IFERROR(SUMPRODUCT(Inventory!D2:D, Inventory!G2:G), 0)').setNumberFormat('#,##0.00').setFontColor('#059669').setFontWeight('bold');
  dash.getRange('D8').setValue('กำไรขั้นต้นประมาณการ:');
  dash.getRange('E8').setFormula('=IFERROR(C6 - SUMPRODUCT(OrderItems!F2:F, OrderItems!H2:H), 0)').setNumberFormat('#,##0.00').setFontWeight('bold');

  dash.getRange('B10:E10').merge().setValue('💡 คำแนะนำการใช้งาน:').setFontWeight('bold').setFontColor('#334155');
  dash.getRange('B11:E11').merge().setValue('• คุณสามารถดูข้อมูลแยกตามตารางได้จากแท็บด้านล่าง (Orders, MenuItems, Inventory, Expenses)');
  dash.getRange('B12:E12').merge().setValue('• เมื่อมีการขายหน้าร้าน หรือเพิ่มวัตถุดิบ ข้อมูลจะถูกบันทึกลงตารางทันทีอัตโนมัติ');
  dash.getRange('B13:E13').merge().setValue('• คุณสามารถนำข้อมูลนี้ไปทำกราฟ Looker Studio หรือคำนวณภาษีต่อได้ทันที');

  dash.getRange('B5:C8').setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange('D5:E8').setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  if (action === 'ping') {
    return jsonResponse({
      status: 'ok',
      success: true,
      message: 'เชื่อมต่อระบบฐานข้อมูล Google Sheets POS สำเร็จแล้ว!',
      timestamp: new Date().toISOString(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
    });
  }

  if (action === 'getAll') {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var data = {
        orders: getSheetDataAsObjects(ss, SHEET_NAMES.ORDERS),
        menuItems: getSheetDataAsObjects(ss, SHEET_NAMES.MENU_ITEMS),
        inventory: getSheetDataAsObjects(ss, SHEET_NAMES.INVENTORY),
        expenses: getSheetDataAsObjects(ss, SHEET_NAMES.EXPENSES),
        users: getSheetDataAsObjects(ss, SHEET_NAMES.USERS)
      };

      return jsonResponse({
        success: true,
        message: 'ดึงข้อมูลสำเร็จ',
        data: data,
        stats: {
          ordersCount: data.orders.length,
          menuCount: data.menuItems.length,
          inventoryCount: data.inventory.length,
          expensesCount: data.expenses.length,
          usersCount: data.users.length
        }
      });
    } catch (err) {
      return jsonResponse({ success: false, error: err.toString() });
    }
  }

  var html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>POS API Online</title>' +
    '<style>body{font-family:sans-serif;background:#0F172A;color:#FFF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}' +
    '.box{background:#1E293B;padding:32px;border-radius:20px;text-align:center;max-width:480px;border:1px solid #334155}' +
    'a{color:#F59E0B;text-decoration:none;font-weight:bold;margin-top:16px;display:inline-block}' +
    '</style></head><body><div class="box"><h1>🍽️ Google Sheets POS API Online</h1>' +
    '<p>ระบบฐานข้อมูลร้านอาหารพร้อมใช้งานแล้ว เชื่อมต่อผ่านแอปพลิเคชันได้ทันที</p>' +
    '<a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '" target="_blank">เปิดดู Google Spreadsheet ↗</a>' +
    '</div></body></html>'
  );
  return html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'Empty payload' });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var data = payload.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'createOrder') {
      var order = data;
      var ordersSheet = getOrCreateSheet(ss, SHEET_NAMES.ORDERS);
      var itemsSheet = getOrCreateSheet(ss, SHEET_NAMES.ORDER_ITEMS);
      
      var itemsSummary = (order.items || []).map(function(item) {
        return item.name + ' x' + item.quantity;
      }).join(', ');

      ordersSheet.appendRow([
        order.id || '',
        order.orderNumber || '',
        order.createdAt || new Date().toISOString(),
        order.tableNumber || '',
        order.orderType || 'dine-in',
        order.customerType || 'guest',
        order.customerName || '',
        (order.items || []).reduce(function(sum, i) { return sum + (i.quantity || 0); }, 0),
        order.subtotal || 0,
        order.discount || 0,
        order.serviceCharge || 0,
        order.vat || 0,
        order.netTotal || 0,
        order.status || 'pending',
        order.paymentStatus || 'unpaid',
        order.paymentMethod || '',
        order.amountReceived || 0,
        order.changeAmount || 0,
        order.paidAt || '',
        order.staffName || '',
        order.notes || '',
        itemsSummary
      ]);

      if (order.items && order.items.length > 0) {
        var itemsRows = [];
        for (var i = 0; i < order.items.length; i++) {
          var it = order.items[i];
          var optStr = '';
          if (it.options) {
            var parts = [];
            if (it.options.spiciness) parts.push(it.options.spiciness);
            if (it.options.meatChoice) parts.push(it.options.meatChoice);
            if (it.options.addOns && it.options.addOns.length > 0) {
              parts.push('เพิ่ม: ' + it.options.addOns.map(function(a) { return a.name; }).join(', '));
            }
            if (it.options.note) parts.push('หมายเหตุ: ' + it.options.note);
            optStr = parts.join(' | ');
          }

          itemsRows.push([
            order.id || '',
            order.orderNumber || '',
            it.id || '',
            it.menuItemId || '',
            it.name || '',
            it.quantity || 1,
            it.price || 0,
            it.cost || 0,
            optStr,
            it.totalPrice || 0,
            order.createdAt || new Date().toISOString()
          ]);
        }
        
        if (itemsRows.length > 0) {
          itemsSheet.getRange(itemsSheet.getLastRow() + 1, 1, itemsRows.length, itemsRows[0].length)
                    .setValues(itemsRows);
        }
      }

      return jsonResponse({
        success: true,
        message: 'บันทึกออเดอร์ ' + order.orderNumber + ' สำเร็จ',
        orderId: order.id
      });
    }

    if (action === 'updateOrderStatus') {
      var ordersSheet = getOrCreateSheet(ss, SHEET_NAMES.ORDERS);
      var rows = ordersSheet.getDataRange().getValues();
      var orderId = data.orderId;
      var foundRow = -1;

      for (var r = 1; r < rows.length; r++) {
        if (rows[r][0] == orderId) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        if (data.status) ordersSheet.getRange(foundRow, 14).setValue(data.status);
        if (data.paymentStatus) ordersSheet.getRange(foundRow, 15).setValue(data.paymentStatus);
        if (data.paymentMethod) ordersSheet.getRange(foundRow, 16).setValue(data.paymentMethod);
        if (data.amountReceived !== undefined) ordersSheet.getRange(foundRow, 17).setValue(data.amountReceived);
        if (data.changeAmount !== undefined) ordersSheet.getRange(foundRow, 18).setValue(data.changeAmount);
        if (data.paidAt) ordersSheet.getRange(foundRow, 19).setValue(data.paidAt);

        return jsonResponse({ success: true, message: 'อัปเดตสถานะออเดอร์เรียบร้อย' });
      } else {
        return jsonResponse({ success: false, message: 'ไม่พบออเดอร์ ID: ' + orderId });
      }
    }

    if (action === 'addIngredient') {
      var invSheet = getOrCreateSheet(ss, SHEET_NAMES.INVENTORY);
      var ing = data;
      invSheet.appendRow([
        ing.id || ('ing-' + Date.now()),
        ing.name || '',
        ing.category || 'meat',
        ing.currentStock || 0,
        ing.minThreshold || 0,
        ing.unit || 'กก.',
        ing.costPerUnit || 0,
        ing.lastRestockedAt || new Date().toISOString().split('T')[0]
      ]);
      return jsonResponse({ success: true, message: 'เพิ่มวัตถุดิบเรียบร้อย' });
    }

    if (action === 'updateIngredient') {
      var invSheet = getOrCreateSheet(ss, SHEET_NAMES.INVENTORY);
      var rows = invSheet.getDataRange().getValues();
      var ingId = data.id;
      var foundRow = -1;

      for (var r = 1; r < rows.length; r++) {
        if (rows[r][0] == ingId) {
          foundRow = r + 1;
          break;
        }
      }

      if (foundRow > 0) {
        if (data.name !== undefined) invSheet.getRange(foundRow, 2).setValue(data.name);
        if (data.category !== undefined) invSheet.getRange(foundRow, 3).setValue(data.category);
        if (data.currentStock !== undefined) invSheet.getRange(foundRow, 4).setValue(data.currentStock);
        if (data.minThreshold !== undefined) invSheet.getRange(foundRow, 5).setValue(data.minThreshold);
        if (data.unit !== undefined) invSheet.getRange(foundRow, 6).setValue(data.unit);
        if (data.costPerUnit !== undefined) invSheet.getRange(foundRow, 7).setValue(data.costPerUnit);
        if (data.lastRestockedAt !== undefined) invSheet.getRange(foundRow, 8).setValue(data.lastRestockedAt);

        return jsonResponse({ success: true, message: 'อัปเดตวัตถุดิบเรียบร้อย' });
      } else {
        invSheet.appendRow([
          data.id, data.name, data.category, data.currentStock, 
          data.minThreshold, data.unit, data.costPerUnit, data.lastRestockedAt || ''
        ]);
        return jsonResponse({ success: true, message: 'สร้างวัตถุดิบใหม่เรียบร้อย' });
      }
    }

    if (action === 'deleteIngredient') {
      var invSheet = getOrCreateSheet(ss, SHEET_NAMES.INVENTORY);
      var rows = invSheet.getDataRange().getValues();
      var ingId = data.id;

      for (var r = 1; r < rows.length; r++) {
        if (rows[r][0] == ingId) {
          invSheet.deleteRow(r + 1);
          return jsonResponse({ success: true, message: 'ลบวัตถุดิบเรียบร้อย' });
        }
      }
      return jsonResponse({ success: false, message: 'ไม่พบวัตถุดิบ' });
    }

    if (action === 'addExpense') {
      var expSheet = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES);
      var exp = data;
      expSheet.appendRow([
        exp.id || ('exp-' + Date.now()),
        exp.merchantName || '',
        exp.invoiceNumber || '',
        exp.date || new Date().toISOString().split('T')[0],
        exp.category || 'วัตถุดิบอาหาร',
        exp.subtotal || 0,
        exp.tax || 0,
        exp.total || 0,
        exp.paymentMethod || 'เงินสด / โอนเงิน',
        exp.notes || '',
        exp.createdBy || 'เจ้าของร้าน',
        exp.createdAt || new Date().toISOString()
      ]);
      return jsonResponse({ success: true, message: 'บันทึกรายจ่ายเรียบร้อย' });
    }

    if (action === 'syncAll') {
      initDatabase();
      var syncData = data;
      
      if (syncData.menuItems && syncData.menuItems.length > 0) {
        var menuSheet = getOrCreateSheet(ss, SHEET_NAMES.MENU_ITEMS);
        menuSheet.getRange(2, 1, Math.max(1, menuSheet.getLastRow()), 12).clearContent();
        
        var mRows = syncData.menuItems.map(function(m) {
          return [
            m.id, m.name, m.nameEn || '', m.category, m.price, m.cost || 0,
            m.description || '', m.isAvailable ? 'พร้อมขาย' : 'หมดชั่วคราว',
            m.popular ? 'แนะนำ' : '', m.imageUrl || '',
            JSON.stringify(m.options || {}), JSON.stringify(m.ingredients || [])
          ];
        });
        if (mRows.length > 0) {
          menuSheet.getRange(2, 1, mRows.length, mRows[0].length).setValues(mRows);
        }
      }

      if (syncData.inventory && syncData.inventory.length > 0) {
        var invSheet = getOrCreateSheet(ss, SHEET_NAMES.INVENTORY);
        invSheet.getRange(2, 1, Math.max(1, invSheet.getLastRow()), 8).clearContent();

        var iRows = syncData.inventory.map(function(i) {
          return [
            i.id, i.name, i.category, i.currentStock, i.minThreshold,
            i.unit, i.costPerUnit, i.lastRestockedAt || ''
          ];
        });
        if (iRows.length > 0) {
          invSheet.getRange(2, 1, iRows.length, iRows[0].length).setValues(iRows);
        }
      }

      if (syncData.expenses && syncData.expenses.length > 0) {
        var expSheet = getOrCreateSheet(ss, SHEET_NAMES.EXPENSES);
        expSheet.getRange(2, 1, Math.max(1, expSheet.getLastRow()), 12).clearContent();

        var eRows = syncData.expenses.map(function(e) {
          return [
            e.id, e.merchantName, e.invoiceNumber || '', e.date, e.category,
            e.subtotal || 0, e.tax || 0, e.total, e.paymentMethod,
            e.notes || '', e.createdBy, e.createdAt || ''
          ];
        });
        if (eRows.length > 0) {
          expSheet.getRange(2, 1, eRows.length, eRows[0].length).setValues(eRows);
        }
      }

      if (syncData.users && syncData.users.length > 0) {
        var usersSheet = getOrCreateSheet(ss, SHEET_NAMES.USERS);
        usersSheet.getRange(2, 1, Math.max(1, usersSheet.getLastRow()), 7).clearContent();

        var uRows = syncData.users.map(function(u) {
          return [
            u.id, u.name, u.role, u.pin, u.active ? 'ใช้งาน' : 'ระงับ',
            u.avatar || '', JSON.stringify(u.permissions || {})
          ];
        });
        if (uRows.length > 0) {
          usersSheet.getRange(2, 1, uRows.length, uRows[0].length).setValues(uRows);
        }
      }

      return jsonResponse({
        success: true,
        message: 'ซิงค์ข้อมูลทั้งหมดขึ้น Google Sheets เรียบร้อยแล้ว!',
        syncedAt: new Date().toISOString()
      });
    }

    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function getSheetDataAsObjects(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return [];

  var headers = values[0];
  var results = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    results.push(obj);
  }
  return results;
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GOOGLE_SHEETS_SCHEMAS = [
  {
    name: 'Dashboard (แดชบอร์ดสรุปผล)',
    color: '#0F172A',
    description: 'หน้ารวมสถิติยอดขายรวม, ค่าใช้จ่ายรวม, สินค้าคงคลัง และประมาณการกำไรสุทธิแบบเรียลไทม์ พร้อมสูตรอัตโนมัติ',
    columns: ['สูตรคำนวณยอดขายรวม', 'จำนวนออเดอร์', 'ยอดต่อบิลเฉลี่ย', 'รายจ่ายรวม', 'มูลค่าสต็อกคงคลัง', 'กำไรขั้นต้น'],
  },
  {
    name: 'Orders (คำสั่งซื้อ)',
    color: '#1E293B',
    description: 'เก็บบันทึกออเดอร์ทุกบิล พร้อมยอดเงิน ส่วนลด ภาษี โต๊ะ และเวลาชำระเงิน',
    columns: [
      'Order ID', 'เลขที่ออเดอร์', 'วันเวลาที่สั่ง', 'โต๊ะ / Takeaway', 'ประเภทบริการ',
      'ประเภทลูกค้า', 'ชื่อลูกค้า', 'จำนวนจาน', 'ยอดรวม (Subtotal)', 'ส่วนลด',
      'Service Charge', 'ภาษี VAT', 'ยอดสุทธิ (Net Total)', 'สถานะออเดอร์', 'สถานะชำระเงิน',
      'วิธีชำระเงิน', 'ยอดเงินที่รับ', 'เงินทอน', 'เวลาที่ชำระเงิน', 'พนักงานรับออเดอร์', 'หมายเหตุ'
    ],
  },
  {
    name: 'OrderItems (รายการอาหารในบิล)',
    color: '#334155',
    description: 'ตารางบันทึกรายละเอียดอาหารแต่ละจาน พร้อมตัวเลือกความเผ็ด ท็อปปิ้ง และต้นทุน เพื่อวิเคราะห์เมนูขายดี',
    columns: [
      'Order ID', 'เลขที่ออเดอร์', 'Item UUID', 'รหัสเมนู', 'ชื่อเมนู',
      'จำนวนจาน', 'ราคาต่อจาน', 'ต้นทุนต่อจาน', 'รายละเอียด/ความเผ็ด/ท็อปปิ้ง', 'ราคารวม (บาท)', 'วันเวลาที่สั่ง'
    ],
  },
  {
    name: 'MenuItems (เมนูอาหาร)',
    color: '#D97706',
    description: 'รายการอาหาร หมวดหมู่ ราคาขาย ต้นทุน สถานะพร้อมขาย และสูตรตัดสต็อก',
    columns: [
      'รหัสเมนู', 'ชื่อเมนู (TH)', 'ชื่อภาษาอังกฤษ (EN)', 'หมวดหมู่', 'ราคาขาย (บาท)',
      'ต้นทุน (บาท)', 'รายละเอียดเมนู', 'สถานะพร้อมขาย', 'เมนูแนะนำ', 'ลิงก์รูปภาพ', 'ตัวเลือกเสริม (JSON)', 'สูตรวัตถุดิบ (JSON)'
    ],
  },
  {
    name: 'Inventory (คลังวัตถุดิบ)',
    color: '#059669',
    description: 'สต็อกวัตถุดิบปัจจุบัน จุดแจ้งเตือนสั่งซื้อ ต้นทุนต่อหน่วย และวันที่เติมล่าสุด',
    columns: [
      'รหัสวัตถุดิบ', 'ชื่อวัตถุดิบ', 'หมวดหมู่วัตถุดิบ', 'สต็อกคงเหลือ',
      'เกณฑ์แจ้งเตือนสต็อกต่ำ', 'หน่วยนับ', 'ต้นทุนเฉลี่ยต่อหน่วย (บาท)', 'วันที่เติมสต็อกล่าสุด'
    ],
  },
  {
    name: 'Expenses (บันทึกรายจ่าย & AI OCR)',
    color: '#DC2626',
    description: 'รายจ่ายร้านอาหาร ใบเสร็จสแกนด้วย AI วัตถุดิบ ค่าสาธารณูปโภค ซ่อมบำรุง',
    columns: [
      'รหัสรายจ่าย', 'ร้านค้า / ผู้รับเงิน', 'เลขที่ใบเสร็จ', 'วันที่จ่าย', 'หมวดหมู่รายจ่าย',
      'ยอดก่อนภาษี', 'ภาษี VAT', 'ยอดจ่ายสุทธิ (บาท)', 'ช่องทางชำระเงิน', 'หมายเหตุ', 'ผู้บันทึก', 'เวลาที่บันทึกระบบ'
    ],
  },
  {
    name: 'Users (พนักงาน)',
    color: '#4F46E5',
    description: 'บัญชีพนักงาน ตำแหน่ง รหัส PIN 4 หลัก และสิทธิ์การเข้าถึงเมนูต่างๆ',
    columns: ['รหัสผู้ใช้', 'ชื่อพนักงาน', 'ตำแหน่ง (Role)', 'รหัส PIN 4 หลัก', 'สถานะใช้งาน', 'ลิงก์รูปโปรไฟล์', 'สิทธิ์การใช้งาน (JSON)'],
  },
  {
    name: 'Settings (การตั้งค่า)',
    color: '#475569',
    description: 'ข้อมูลชื่อร้าน, เลข PromptPay QR, อัตราภาษี และหมายเหตุบิล',
    columns: ['คีย์ (Key)', 'ค่า (Value)', 'คำอธิบายการตั้งค่า', 'อัปเดตล่าสุด'],
  },
];
