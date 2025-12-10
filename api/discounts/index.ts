import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // List all discount codes
      const result = await sql`
        SELECT * FROM discount_codes 
        ORDER BY created_at DESC
      `;
      
      // Transform database rows to match frontend DiscountCode type
      const discounts = result.rows.map(row => ({
        code: row.code,
        percentage: row.percentage,
        active: row.active,
        startDate: row.start_date,
        endDate: row.end_date,
        minNights: row.min_nights,
        fullPeriodRequired: row.full_period_required
      }));

      return res.status(200).json(discounts);
    }

    if (req.method === 'POST') {
      // Create new discount code
      const { code, percentage, active, startDate, endDate, minNights, fullPeriodRequired } = req.body;

      await sql`
        INSERT INTO discount_codes (code, percentage, active, start_date, end_date, min_nights, full_period_required)
        VALUES (${code}, ${percentage}, ${active !== false}, ${startDate || null}, ${endDate || null}, 
                ${minNights || null}, ${fullPeriodRequired || false})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update discount code
      const { code, percentage, active, startDate, endDate, minNights, fullPeriodRequired } = req.body;

      await sql`
        UPDATE discount_codes 
        SET percentage = ${percentage},
            active = ${active !== false},
            start_date = ${startDate || null},
            end_date = ${endDate || null},
            min_nights = ${minNights || null},
            full_period_required = ${fullPeriodRequired || false},
            updated_at = CURRENT_TIMESTAMP
        WHERE code = ${code}
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Delete discount code
      const { code } = req.query;
      const discountCode = Array.isArray(code) ? code[0] : code;

      await sql`
        DELETE FROM discount_codes WHERE code = ${discountCode}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in discounts API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
