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
      // List all rooms
      const result = await sql`
        SELECT * FROM rooms 
        ORDER BY created_at DESC
      `;
      
      // Transform database rows to match frontend Room type
      const rooms = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price),
        capacity: row.capacity,
        imageUrl: row.image_url || '',
        features: row.features || [],
        totalQuantity: row.total_quantity,
        active: row.active,
        overrides: row.overrides || []
      }));

      return res.status(200).json(rooms);
    }

    if (req.method === 'POST') {
      // Create new room
      const { id, name, description, price, capacity, imageUrl, features, totalQuantity, active } = req.body;

      await sql`
        INSERT INTO rooms (id, name, description, price, capacity, image_url, features, total_quantity, active)
        VALUES (${id}, ${name}, ${description || ''}, ${price}, ${capacity}, ${imageUrl || ''}, 
                ${JSON.stringify(features || [])}, ${totalQuantity}, ${active !== false})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update room
      const { id, name, description, price, capacity, imageUrl, features, totalQuantity, active, overrides } = req.body;

      await sql`
        UPDATE rooms 
        SET name = ${name},
            description = ${description || ''},
            price = ${price},
            capacity = ${capacity},
            image_url = ${imageUrl || ''},
            features = ${JSON.stringify(features || [])},
            total_quantity = ${totalQuantity},
            active = ${active !== false},
            overrides = ${JSON.stringify(overrides || [])},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Delete room
      const { id } = req.query;
      const roomId = Array.isArray(id) ? id[0] : id;

      await sql`
        DELETE FROM rooms WHERE id = ${roomId}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in rooms API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
