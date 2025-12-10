import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      checkIn,
      checkOut,
      nights,
      mainGuest,
      additionalGuests,
      observations,
      rooms,
      extras,
      totalPrice,
      discountApplied,
      paymentMethod,
      cardDetails,
    } = req.body;

    // Validate required fields
    if (!checkIn || !checkOut || !nights || !mainGuest || !rooms || !totalPrice || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate reservation ID
    const reservationId = uuidv4();

    // Insert reservation into database
    await sql`
      INSERT INTO reservations (
        id,
        check_in,
        check_out,
        nights,
        main_guest_name,
        main_guest_cpf,
        main_guest_age,
        main_guest_email,
        main_guest_phone,
        additional_guests,
        observations,
        rooms,
        extras,
        total_price,
        discount_code,
        discount_amount,
        payment_method,
        card_details,
        status
      ) VALUES (
        ${reservationId},
        ${checkIn},
        ${checkOut},
        ${nights},
        ${mainGuest.name},
        ${mainGuest.cpf},
        ${mainGuest.age || null},
        ${mainGuest.email || null},
        ${mainGuest.phone || null},
        ${JSON.stringify(additionalGuests || [])},
        ${observations || ''},
        ${JSON.stringify(rooms)},
        ${JSON.stringify(extras || [])},
        ${totalPrice},
        ${discountApplied?.code || null},
        ${discountApplied?.amount || null},
        ${paymentMethod},
        ${cardDetails ? JSON.stringify(cardDetails) : null},
        'PENDING'
      )
    `;

    // Fetch the created reservation
    const result = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `;

    const reservation = result.rows[0];

    // Prepare reservation data for emails
    const reservationData = {
      id: reservation.id,
      createdAt: reservation.created_at,
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      nights: reservation.nights,
      mainGuest: {
        name: reservation.main_guest_name,
        cpf: reservation.main_guest_cpf,
        age: reservation.main_guest_age,
        email: reservation.main_guest_email,
        phone: reservation.main_guest_phone,
      },
      additionalGuests: reservation.additional_guests,
      observations: reservation.observations,
      rooms: reservation.rooms,
      extras: reservation.extras,
      totalPrice: parseFloat(reservation.total_price),
      discountApplied: reservation.discount_code ? {
        code: reservation.discount_code,
        amount: parseFloat(reservation.discount_amount),
      } : undefined,
      paymentMethod: reservation.payment_method,
      cardDetails: reservation.card_details,
      status: reservation.status,
    };

    // Send emails (non-blocking)
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://motor-de-reservas-hotel-solar.vercel.app';

    // Send client confirmation email
    if (reservationData.mainGuest.email) {
      fetch(`${baseUrl}/api/email/send-client-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation: reservationData }),
      }).catch(err => console.error('Error sending client email:', err));
    }

    // Send admin notification email
    fetch(`${baseUrl}/api/email/send-reservation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservation: reservationData }),
    }).catch(err => console.error('Error sending admin email:', err));

    // Return the created reservation
    return res.status(201).json({
      success: true,
      reservation: reservationData,
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({ 
      error: 'Failed to create reservation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
