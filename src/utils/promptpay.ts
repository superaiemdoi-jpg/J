import QRCode from 'qrcode';

/**
 * Calculates CRC16-CCITT checksum for EMVCo QR Code
 */
function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates standard Thai PromptPay EMVCo QR string for a mobile number or Tax ID
 */
export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean phone/ID
  const cleanTarget = target.replace(/[^0-9]/g, '');
  let formattedTarget = cleanTarget;
  let targetType = '01'; // 01 for mobile phone, 02 for national ID / tax ID

  if (cleanTarget.length === 10 && cleanTarget.startsWith('0')) {
    // Thai Mobile format: 0066 + 9 digits (e.g. 0812345678 -> 0066812345678)
    formattedTarget = '0066' + cleanTarget.substring(1);
    targetType = '01';
  } else if (cleanTarget.length === 13) {
    targetType = '02';
  }

  // Tag 29: Merchant Account Information (PromptPay)
  const aid = '0016A000000677010111';
  const targetTag = `${targetType}${formattedTarget.length.toString().padStart(2, '0')}${formattedTarget}`;
  const tag29Value = `${aid}${targetTag}`;
  const tag29 = `29${tag29Value.length.toString().padStart(2, '0')}${tag29Value}`;

  // Tag 00 & 01 & 53 & 58
  const tag00 = '000201'; // Payload Format Indicator
  const tag01 = amount ? '010212' : '010211'; // Point of Initiation (12: Dynamic with amount, 11: Static)
  const tag53 = '5303764'; // Transaction Currency (764 = THB)
  const tag58 = '5802TH'; // Country Code (TH)

  let tag54 = '';
  if (amount && amount > 0) {
    const amtStr = amount.toFixed(2);
    tag54 = `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
  }

  const rawPayload = `${tag00}${tag01}${tag29}${tag53}${tag54}${tag58}6304`;
  const checksum = crc16(rawPayload);

  return `${rawPayload}${checksum}`;
}

/**
 * Renders PromptPay QR code as a Data URL (PNG image)
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}
