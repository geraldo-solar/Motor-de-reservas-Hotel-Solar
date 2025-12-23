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
      // List all packages
      const result = await sql`
        SELECT * FROM packages 
        ORDER BY start_iso_date ASC
      `;
      
      // Transform database rows to match frontend HolidayPackage type
      const packages = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        imageUrl: row.image_url || '',
        includes: row.includes || [],
        active: row.active,
        startIsoDate: row.start_iso_date,
        endIsoDate: row.end_iso_date,
        roomPrices: row.room_prices || [],
        noCheckoutDates: row.no_checkout_dates || [],
        noCheckInDates: row.no_checkin_dates || []
      }));

      return res.status(200).json(packages);
    }

    if (req.method === 'POST') {
      // Create new package
      const { id, name, description, imageUrl, includes, active, startIsoDate, endIsoDate, roomPrices, noCheckoutDates, noCheckInDates } = req.body;
      
      // Validate required fields
      if (!id || !name) {
        return res.status(400).json({ error: 'Missing required fields: id, name' });
      }
      
      if (!startIsoDate || !endIsoDate) {
        return res.status(400).json({ error: 'Missing required date fields: startIsoDate, endIsoDate' });
      }
      
      // Extract date part if timestamp is included (YYYY-MM-DDTHH:mm:ss.sssZ -> YYYY-MM-DD)
      const cleanStartDate = startIsoDate.split('T')[0];
      const cleanEndDate = endIsoDate.split('T')[0];
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cleanStartDate) || !dateRegex.test(cleanEndDate)) {
        return res.status(400).json({ error: `Invalid date format. Expected YYYY-MM-DD, got: ${cleanStartDate}, ${cleanEndDate}` });
      }

      await sql`
        INSERT INTO packages (id, name, description, image_url, includes, active, start_iso_date, end_iso_date, room_prices, no_checkout_dates, no_checkin_dates)
        VALUES (${id}, ${name}, ${description || ''}, ${imageUrl || ''}, 
                ${JSON.stringify(includes || [])}, ${active !== false},
                ${cleanStartDate}, ${cleanEndDate},
                ${JSON.stringify(roomPrices || [])},
                ${JSON.stringify(noCheckoutDates || [])},
                ${JSON.stringify(noCheckInDates || [])})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update package
      const { id, name, description, imageUrl, includes, active, startIsoDate, endIsoDate, roomPrices, noCheckoutDates, noCheckInDates } = req.body;
      
      // Validate required fields
      if (!id || !name) {
        return res.status(400).json({ error: 'Missing required fields: id, name' });
      }
      
      if (!startIsoDate || !endIsoDate) {
        return res.status(400).json({ error: 'Missing required date fields: startIsoDate, endIsoDate' });
      }
      
      // Extract date part if timestamp is included (YYYY-MM-DDTHH:mm:ss.sssZ -> YYYY-MM-DD)
      const cleanStartDate = startIsoDate.split('T')[0];
      const cleanEndDate = endIsoDate.split('T')[0];
      
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(cleanStartDate) || !dateRegex.test(cleanEndDate)) {
        return res.status(400).json({ error: `Invalid date format. Expected YYYY-MM-DD, got: ${cleanStartDate}, ${cleanEndDate}` });
      }

      await sql`
        UPDATE packages 
        SET name = ${name},
            description = ${description || ''},
            image_url = ${imageUrl || ''},
            includes = ${JSON.stringify(includes || [])},
            active = ${active !== false},
            start_iso_date = ${cleanStartDate},
            end_iso_date = ${cleanEndDate},
            room_prices = ${JSON.stringify(roomPrices || [])},
            no_checkout_dates = ${JSON.stringify(noCheckoutDates || [])},
            no_checkin_dates = ${JSON.stringify(noCheckInDates || [])},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Delete package
      const { id } = req.query;
      const packageId = Array.isArray(id) ? id[0] : id;
      
      console.log('[PACKAGES API] DELETE request for package:', packageId);

      const result = await sql`
        DELETE FROM packages WHERE id = ${packageId}
      `;
      
      console.log('[PACKAGES API] Delete result:', result.rowCount, 'rows affected');

      return res.status(200).json({ success: true, rowCount: result.rowCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in packages API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
