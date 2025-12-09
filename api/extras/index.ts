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
      // List all extra services
      const result = await sql`
        SELECT * FROM extra_services 
        ORDER BY created_at DESC
      `;
      
      // Transform database rows to match frontend ExtraService type
      const extras = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: parseFloat(row.price),
        imageUrl: row.image_url || '',
        active: row.active
      }));

      return res.status(200).json(extras);
    }

    if (req.method === 'POST') {
      // Create new extra service
      const { id, name, description, price, imageUrl, active } = req.body;

      await sql`
        INSERT INTO extra_services (id, name, description, price, image_url, active)
        VALUES (${id}, ${name}, ${description || ''}, ${price}, ${imageUrl || ''}, ${active !== false})
      `;

      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      // Update extra service
      const { id, name, description, price, imageUrl, active } = req.body;

      await sql`
        UPDATE extra_services 
        SET name = ${name},
            description = ${description || ''},
            price = ${price},
            image_url = ${imageUrl || ''},
            active = ${active !== false},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      // Delete extra service
      const { id } = req.query;

      await sql`
        DELETE FROM extra_services WHERE id = ${id}
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in extras API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
