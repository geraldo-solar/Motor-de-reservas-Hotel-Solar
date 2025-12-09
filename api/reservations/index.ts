import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '../db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // List all reservations
      const result = await sql`
        SELECT * FROM reservations 
        ORDER BY created_at DESC
      `;
      
      // Transform database rows to match frontend Reservation type
      const reservations = result.rows.map(row => ({
        id: row.id,
        createdAt: row.created_at,
        checkIn: row.check_in,
        checkOut: row.check_out,
        nights: row.nights,
        mainGuest: {
          name: row.main_guest_name,
          cpf: row.main_guest_cpf,
          age: row.main_guest_age,
          email: row.main_guest_email,
          phone: row.main_guest_phone
        },
        additionalGuests: row.additional_guests || [],
        observations: row.observations,
        rooms: row.rooms,
        extras: row.extras || [],
        totalPrice: parseFloat(row.total_price),
        discountCode: row.discount_code,
        discountAmount: row.discount_amount ? parseFloat(row.discount_amount) : undefined,
        paymentMethod: row.payment_method,
        cardDetails: row.card_details,
        status: row.status
      }));

      return res.status(200).json(reservations);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in reservations API:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
