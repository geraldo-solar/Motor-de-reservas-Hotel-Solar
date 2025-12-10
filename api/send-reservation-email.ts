import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateClientConfirmationEmail, generateAdminNotificationEmail } from './emailTemplates';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reservation } = req.body;

    if (!reservation || !reservation.id) {
      return res.status(400).json({ error: 'Missing reservation data' });
    }

    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
    const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

    const results = {
      clientEmail: { sent: false, error: null as string | null },
      adminEmail: { sent: false, error: null as string | null }
    };

    // Send client confirmation email
    if (reservation.mainGuest && reservation.mainGuest.email) {
      try {
        const clientEmailHtml = generateClientConfirmationEmail(reservation, checkInDate, checkOutDate, reservationNumber);
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
            to: [{ email: reservation.mainGuest.email, name: reservation.mainGuest.name }],
            subject: `Confirmação de Reserva #${reservationNumber} - Hotel Solar`,
            htmlContent: clientEmailHtml
          })
        });

        if (response.ok) {
          results.clientEmail.sent = true;
          console.log('[SEND EMAIL] Client email sent successfully');
        } else {
          const errorData = await response.json();
          results.clientEmail.error = JSON.stringify(errorData);
          console.error('[SEND EMAIL] Brevo API error (client):', errorData);
        }
      } catch (err) {
        results.clientEmail.error = err instanceof Error ? err.message : 'Unknown error';
        console.error('[SEND EMAIL] Error sending client email:', err);
      }
    }

    // Send admin notification email
    try {
      const adminEmailHtml = generateAdminNotificationEmail(reservation, checkInDate, checkOutDate, reservationNumber);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
          to: [{ email: 'geraldo@hotelsolar.tur.br', name: 'Geraldo - Hotel Solar' }],
          subject: `🔔 Nova Reserva #${reservationNumber} - Hotel Solar`,
          htmlContent: adminEmailHtml
        })
      });

      if (response.ok) {
        results.adminEmail.sent = true;
        console.log('[SEND EMAIL] Admin email sent successfully');
      } else {
        const errorData = await response.json();
        results.adminEmail.error = JSON.stringify(errorData);
        console.error('[SEND EMAIL] Brevo API error (admin):', errorData);
      }
    } catch (err) {
      results.adminEmail.error = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SEND EMAIL] Error sending admin email:', err);
    }

    return res.status(200).json({
      success: true,
      results
    });

  } catch (error) {
    console.error('[SEND EMAIL] API error:', error);
    return res.status(500).json({
      error: 'Failed to send emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
