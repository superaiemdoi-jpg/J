import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with larger limit for receipt image uploads
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API: Scan Receipt using Gemini
app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "กรุณาแนบรูปภาพใบเสร็จ (Image is required)" });
      return;
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const client = getGeminiClient();

    if (!client) {
      // Return simulated intelligent parse if no key configured so user can still test seamlessly
      const fallbackResult = {
        merchantName: "Makro Cash & Carry (สาขาประดิษฐ์มนูธรรม)",
        date: new Date().toISOString().split("T")[0],
        invoiceNumber: "INV-" + Math.floor(100000 + Math.random() * 900000),
        category: "วัตถุดิบอาหาร",
        items: [
          { name: "เนื้อหมูสันคอสไลซ์ 2 กก.", quantity: 2, unitPrice: 185, amount: 370 },
          { name: "ไข่ไก่เบอร์ 2 (แผง 30 ฟอง)", quantity: 3, unitPrice: 135, amount: 405 },
          { name: "ข้าวหอมมะลิคัดพิเศษ 15 กก.", quantity: 1, unitPrice: 580, amount: 580 },
          { name: "น้ำมันพืชขวด 1 ลิตร", quantity: 4, unitPrice: 52, amount: 208 },
        ],
        subtotal: 1460.75,
        tax: 102.25,
        total: 1563.0,
        paymentMethod: "โอนเงิน / PromptPay",
        notes: "สแกนสำเร็จ (โหมดจำลอง - ไม่พบ GEMINI_API_KEY)",
      };
      res.json({ success: true, data: fallbackResult, simulated: true });
      return;
    }

    const prompt = `คุณคือผู้เชี่ยวชาญด้านระบบบัญชีและสแกนใบเสร็จร้านอาหาร (Restaurant Accounting OCR Expert)
วิเคราะห์รูปภาพใบเสร็จรับเงิน/ใบส่งของที่แนบมา และดึงข้อมูลออกมาในรูปแบบ JSON อย่างแม่นยำ:
1. ชื่อร้านค้า/ผู้ขาย (merchantName) เช่น แม็คโคร, โลตัส, ตลาดสด, ตลาดไท
2. วันที่ของใบเสร็จ (date รูปแบบ YYYY-MM-DD เช่น 2026-09-10) ถ้าไม่มีระบุให้ใช้วันนี้
3. เลขที่ใบเสร็จ (invoiceNumber)
4. หมวดหมู่ค่าใช้จ่าย (category) เลือกจาก: 'วัตถุดิบอาหาร', 'เครื่องดื่ม', 'บรรจุภัณฑ์', 'ค่าสาธารณูปโภค', 'อุปกรณ์และซ่อมบำรุง', 'เบ็ดเตล็ด'
5. รายการสินค้าทั้งหมด (items): ชื่อ (name), จำนวน (quantity), ราคาต่อหน่วย (unitPrice), ยอดรวมรายการ (amount)
6. ยอดรวมก่อนภาษี (subtotal) เป็นตัวเลข
7. ภาษีมูลค่าเพิ่ม (tax) เป็นตัวเลข
8. ยอดรวมสุทธิ (total) เป็นตัวเลข
9. วิธีการชำระเงิน (paymentMethod) เช่น เงินสด, บัตรเครดิต, QR โอนเงิน
10. บันทึกเพิ่มเติม (notes)`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: cleanBase64,
      },
    };

    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchantName: { type: Type.STRING, description: "ชื่อร้านค้าหรือผู้จำหน่าย" },
            date: { type: Type.STRING, description: "วันที่ในรูปแบบ YYYY-MM-DD" },
            invoiceNumber: { type: Type.STRING, description: "เลขที่ใบเสร็จหรือใบกำกับภาษี" },
            category: { type: Type.STRING, description: "หมวดหมู่ค่าใช้จ่าย เช่น วัตถุดิบอาหาร" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  amount: { type: Type.NUMBER },
                },
                required: ["name", "quantity", "unitPrice", "amount"],
              },
            },
            subtotal: { type: Type.NUMBER },
            tax: { type: Type.NUMBER },
            total: { type: Type.NUMBER },
            paymentMethod: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ["merchantName", "date", "items", "total", "category"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedJson });
  } catch (err: any) {
    console.error("Error scanning receipt:", err);
    res.status(500).json({
      error: "เกิดข้อผิดพลาดในการสแกนใบเสร็จ: " + (err.message || "Unknown error"),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`POS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
