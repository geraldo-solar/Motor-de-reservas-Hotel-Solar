import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reservationId, approved } = req.body;

    if (!reservationId || typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Missing reservationId or approved status' });
    }

    // Get current reservation data
    const reservationResult = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `;

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const reservation = reservationResult.rows[0];
    const newStatus = approved ? 'CONFIRMED' : 'CANCELLED';

    // Update reservation status
    await sql`
      UPDATE reservations 
      SET status = ${newStatus}
      WHERE id = ${reservationId}
    `;

    // If credit card payment, sanitize card data after processing
    if (reservation.payment_method === 'CREDIT_CARD' && reservation.card_details) {
      const cardDetails = reservation.card_details;
      const sanitizedCardDetails = {
        ...cardDetails,
        number: cardDetails.number ? `**** **** **** ${cardDetails.number.slice(-4)}` : '****',
        cvv: '***',
      };

      await sql`
        UPDATE reservations 
        SET card_details = ${JSON.stringify(sanitizedCardDetails)}
        WHERE id = ${reservationId}
      `;
    }

    // Get updated reservation
    const updatedResult = await sql`
      SELECT * FROM reservations WHERE id = ${reservationId}
    `;

    const updatedReservation = updatedResult.rows[0];

    // Prepare reservation data for email
    const reservationData = {
      id: updatedReservation.id,
      createdAt: updatedReservation.created_at,
      checkIn: updatedReservation.check_in,
      checkOut: updatedReservation.check_out,
      nights: updatedReservation.nights,
      mainGuest: {
        name: updatedReservation.main_guest_name,
        cpf: updatedReservation.main_guest_cpf,
        age: updatedReservation.main_guest_age,
        email: updatedReservation.main_guest_email,
        phone: updatedReservation.main_guest_phone,
      },
      additionalGuests: updatedReservation.additional_guests,
      observations: updatedReservation.observations,
      rooms: updatedReservation.rooms,
      extras: updatedReservation.extras,
      totalPrice: parseFloat(updatedReservation.total_price),
      discountApplied: updatedReservation.discount_code ? {
        code: updatedReservation.discount_code,
        amount: parseFloat(updatedReservation.discount_amount),
      } : undefined,
      paymentMethod: updatedReservation.payment_method,
      status: updatedReservation.status,
    };

    // Send confirmation email to client (non-blocking)
    if (approved && reservationData.mainGuest.email) {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://motor-de-reservas-hotel-solar.vercel.app';

      fetch(`${baseUrl}/api/email/send-payment-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reservation: reservationData,
          approved: true 
        }),
      }).catch(err => console.error('Error sending confirmation email:', err));
    }

    return res.status(200).json({
      success: true,
      reservation: reservationData,
      message: approved ? 'Payment confirmed successfully' : 'Payment rejected',
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ 
      error: 'Failed to confirm payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
