import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status } = req.query;

    let result;
    if (status && typeof status === 'string') {
      result = await sql`
        SELECT * FROM reservations 
        WHERE status = ${status}
        ORDER BY created_at DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM reservations 
        ORDER BY created_at DESC
      `;
    }

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
        phone: row.main_guest_phone,
      },
      additionalGuests: row.additional_guests,
      observations: row.observations,
      rooms: row.rooms,
      extras: row.extras,
      totalPrice: parseFloat(row.total_price),
      discountApplied: row.discount_code ? {
        code: row.discount_code,
        amount: parseFloat(row.discount_amount),
      } : undefined,
      paymentMethod: row.payment_method,
      cardDetails: row.card_details,
      status: row.status,
    }));

    return res.status(200).json({
      success: true,
      reservations,
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch reservations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
