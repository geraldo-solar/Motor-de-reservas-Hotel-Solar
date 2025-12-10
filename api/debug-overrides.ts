import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // Get all overrides
    const overrides = await sql`
      SELECT * FROM room_date_overrides 
      ORDER BY date DESC, room_id
      LIMIT 50
    `;

    // Get all rooms
    const rooms = await sql`
      SELECT id, name, total_quantity FROM rooms
    `;

    // Get recent reservations
    const reservations = await sql`
      SELECT id, check_in, check_out, rooms, created_at 
      FROM reservations 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    return res.status(200).json({
      overrides: overrides.rows,
      rooms: rooms.rows,
      reservations: reservations.rows.map(r => ({
        ...r,
        rooms: typeof r.rooms === 'string' ? JSON.parse(r.rooms) : r.rooms
      }))
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch debug data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
