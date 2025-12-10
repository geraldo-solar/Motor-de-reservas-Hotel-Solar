import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';
import { generateClientConfirmationEmail, generateAdminNotificationEmail } from './emailTemplates';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { action } = req.query;

  try {
    // GET requests without action = list all
    if (req.method === 'GET' && !action) {
      return await listReservations(req, res);
    }

    // Route based on action parameter
    switch (action) {
      case 'create':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await createReservation(req, res);
      
      case 'confirm-payment':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await confirmPayment(req, res);
      
      case 'cancel':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return await cancelReservation(req, res);
      
      case 'list':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return await listReservations(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Reservations API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process reservation request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function createReservation(req: VercelRequest, res: VercelResponse) {
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

  // TEMPORARILY DISABLED: Send emails in background (non-blocking) - don't let email errors break reservation creation
  console.log('[CREATE RESERVATION] Email sending is temporarily disabled for debugging');
  /*
  try {
    const checkInDate = new Date(reservationData.checkIn).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservationData.checkOut).toLocaleDateString('pt-BR');
    const reservationNumber = reservationData.id.toUpperCase().substring(0, 8);
    
    console.log('[CREATE RESERVATION] About to send emails for reservation:', reservationData.id);
    
    // Send client confirmation email
    if (reservationData.mainGuest.email) {
      console.log('[CREATE RESERVATION] Sending client email to:', reservationData.mainGuest.email);
      try {
        const clientEmailHtml = generateClientConfirmationEmail(reservationData, checkInDate, checkOutDate, reservationNumber);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Hotel Solar', email: 'reserva@hotelsolar.tur.br' },
            to: [{ email: reservationData.mainGuest.email, name: reservationData.mainGuest.name }],
            subject: `Confirmação de Reserva #${reservationNumber} - Hotel Solar`,
            htmlContent: clientEmailHtml
          })
        });
        if (response.ok) {
          console.log('[CREATE RESERVATION] Client email sent successfully via Brevo');
        } else {
          const errorData = await response.json();
          console.error('[CREATE RESERVATION] Brevo API error:', errorData);
        }
      } catch (err) {
        console.error('[CREATE RESERVATION] Error sending client email:', err);
      }
    }

    // Send admin notification email
    console.log('[CREATE RESERVATION] Sending admin email');
    try {
      const adminEmailHtml = generateAdminNotificationEmail(reservationData, checkInDate, checkOutDate, reservationNumber);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Hotel Solar', email: 'reserva@hotelsolar.tur.br' },
          to: [{ email: 'geraldo@hotelsolar.tur.br', name: 'Administrador Hotel Solar' }],
          subject: `🔔 Nova Reserva #${reservationNumber} - Hotel Solar`,
          htmlContent: adminEmailHtml
        })
      });
      if (response.ok) {
        console.log('[CREATE RESERVATION] Admin email sent successfully via Brevo');
      } else {
        const errorData = await response.json();
        console.error('[CREATE RESERVATION] Brevo API error:', errorData);
      }
    } catch (err) {
      console.error('[CREATE RESERVATION] Error sending admin email:', err);
    }
  } catch (emailError) {
    // Don't let email errors break the reservation creation
    console.error('[CREATE RESERVATION] Email sending failed, but reservation was created:', emailError);
  }
  */

  // Return the created reservation
  return res.status(201).json({
    success: true,
    reservation: reservationData,
  });
}

async function confirmPayment(req: VercelRequest, res: VercelResponse) {
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

    fetch(`${baseUrl}/api/email?action=send-payment-confirmation`, {
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
}

async function cancelReservation(req: VercelRequest, res: VercelResponse) {
  const { reservationId, reason, refundPercentage } = req.body;

  if (!reservationId || !reason || typeof refundPercentage !== 'number') {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Get reservation details before canceling
  const reservationResult = await sql`
    SELECT * FROM reservations WHERE id = ${reservationId}
  `;

  if (reservationResult.rows.length === 0) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const reservation = reservationResult.rows[0];

  if (reservation.status === 'CANCELADO') {
    return res.status(400).json({ error: 'Reservation already canceled' });
  }

  // Update reservation status to CANCELADO
  await sql`
    UPDATE reservations 
    SET 
      status = 'CANCELADO',
      cancellation_reason = ${reason},
      cancellation_date = NOW(),
      refund_percentage = ${refundPercentage}
    WHERE id = ${reservationId}
  `;

  // Send cancellation confirmation email to guest
  const guestEmail = reservation.main_guest_email;
  const guestName = reservation.main_guest_name;
  const reservationNumber = reservationId.toUpperCase().substring(0, 8);
  const checkInDate = new Date(reservation.check_in).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.check_out).toLocaleDateString('pt-BR');
  const totalPrice = parseFloat(reservation.total_price);
  const refundAmount = (totalPrice * refundPercentage / 100).toFixed(2);

  if (guestEmail) {
    const guestEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 28px;">❌ Reserva Cancelada</h1>
                      <p style="color: #FEE2E2; margin: 0; font-size: 16px;">Hotel Solar</p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 30px;">
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Olá <strong>${guestName}</strong>,
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Sua reserva no Hotel Solar foi cancelada conforme solicitado.
                      </p>

                      <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #DC2626;">
                        <p style="color: #991B1B; margin: 0 0 8px 0; font-size: 14px;">Reserva Cancelada</p>
                        <p style="color: #DC2626; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                          ${reservationNumber}
                        </p>
                      </div>

                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 18px;">📋 Detalhes do Cancelamento</h2>
                        
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Check-in:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 8px 0;">${checkInDate}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Check-out:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 8px 0;">${checkOutDate}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Valor Total:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 8px 0;">R$ ${totalPrice.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 8px 0;">Reembolso (${refundPercentage}%):</td>
                            <td style="color: #16A34A; font-weight: bold; text-align: right; padding: 8px 0; font-size: 18px;">R$ ${refundAmount}</td>
                          </tr>
                        </table>
                      </div>

                      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="color: #1e40af; margin: 0; font-size: 14px;">
                          <strong>💰 Reembolso:</strong> O valor de R$ ${refundAmount} será estornado na mesma forma de pagamento utilizada na reserva em até 7 dias úteis.
                        </p>
                      </div>

                      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <p style="color: #78350f; margin: 0; font-size: 14px;">
                          <strong>📧 Dúvidas?</strong> Entre em contato conosco através do email 
                          <a href="mailto:reserva@hotelsolar.tur.br" style="color: #92400e; font-weight: bold;">reserva@hotelsolar.tur.br</a> 
                          ou pelo telefone <strong>(91) 98100-0800</strong>.
                        </p>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td style="background-color: #2F3A2F; padding: 30px; text-align: center;">
                      <img src="https://www.hotelsolar.tur.br/hotel-solar-logo.png" alt="Hotel Solar" style="height: 60px; margin-bottom: 16px;" />
                      <p style="color: #9ca3af; margin: 0; font-size: 14px; line-height: 1.6;">
                        <strong style="color: #E5D3B3;">Hotel Solar</strong><br>
                        Av. Atlântica • CEP 68721-000 • Salinópolis - PA<br>
                        Tel: (91) 98100-0800<br>
                        E-mail: <a href="mailto:reserva@hotelsolar.tur.br" style="color: #D4AF37;">reserva@hotelsolar.tur.br</a>
                      </p>
                      <p style="color: #6b7280; margin: 16px 0 0 0; font-size: 12px;">
                        © ${new Date().getFullYear()} Hotel Solar. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    try {
      await resend.emails.send({
        from: 'Hotel Solar <reserva@hotelsolar.tur.br>',
        to: guestEmail,
        subject: `Cancelamento Confirmado - Reserva #${reservationNumber} - Hotel Solar`,
        html: guestEmailHtml,
      });
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Reservation canceled successfully',
    refundAmount: parseFloat(refundAmount),
    refundPercentage,
  });
}

async function listReservations(req: VercelRequest, res: VercelResponse) {
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
}
