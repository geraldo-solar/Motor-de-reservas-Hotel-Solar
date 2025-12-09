import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Generate PIX payment information
 * This is a simplified version - in production, you would integrate with a payment gateway
 * like Mercado Pago, PagSeguro, or your bank's API
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, reservationId, customerName } = req.body;

    if (!amount || !reservationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production, you would call your payment gateway API here
    // For now, we'll generate a mock PIX code
    
    // PIX Key (this should be your actual PIX key)
    const pixKey = process.env.PIX_KEY || 'reserva@hotelsolar.tur.br';
    
    // Generate a simple PIX code (in production, use proper PIX payload format)
    // This is a simplified example - real PIX codes follow the EMV QR Code standard
    const pixPayload = generatePixPayload({
      pixKey,
      merchantName: 'HOTEL SOLAR',
      merchantCity: 'SAO PAULO',
      amount: parseFloat(amount),
      transactionId: reservationId.slice(0, 25), // Max 25 chars
    });

    // In production, you would also generate a QR code image
    // For now, we'll just return the payload
    
    return res.status(200).json({
      success: true,
      pix: {
        payload: pixPayload,
        qrCode: pixPayload, // In production, this would be a base64 image or URL
        amount: parseFloat(amount),
        expiresIn: 3600, // 1 hour in seconds
        pixKey,
      },
    });
  } catch (error) {
    console.error('Error generating PIX:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PIX',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Generate PIX payload following EMV QR Code standard (simplified)
 * In production, use a proper library like 'pix-utils' or similar
 */
function generatePixPayload(data: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  transactionId: string;
}): string {
  const { pixKey, merchantName, merchantCity, amount, transactionId } = data;
  
  // This is a simplified PIX payload
  // In production, use proper EMV QR Code format with CRC calculation
  const payload = [
    '00020126',
    `0014BR.GOV.BCB.PIX`,
    `01${pixKey.length.toString().padStart(2, '0')}${pixKey}`,
    `52040000`,
    `5303986`,
    `54${amount.toFixed(2).length.toString().padStart(2, '0')}${amount.toFixed(2)}`,
    `5802BR`,
    `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`,
    `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`,
    `62${(7 + transactionId.length).toString().padStart(2, '0')}05${transactionId.length.toString().padStart(2, '0')}${transactionId}`,
    '6304', // CRC placeholder
  ].join('');
  
  // Calculate CRC16 (simplified - in production use proper CRC16-CCITT)
  const crc = calculateCRC16(payload);
  
  return payload + crc;
}

/**
 * Simplified CRC16 calculation
 * In production, use a proper CRC16-CCITT implementation
 */
function calculateCRC16(payload: string): string {
  // This is a placeholder - implement proper CRC16-CCITT
  // For now, return a mock CRC
  return 'ABCD';
}
