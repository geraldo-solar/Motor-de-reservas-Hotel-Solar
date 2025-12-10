import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    // Simple email HTML
    const guestName = reservation?.mainGuest?.name || 'Cliente';
    const guestEmail = reservation?.mainGuest?.email || '';
    const reservationNumber = reservation.id.toUpperCase().substring(0, 8);
    const totalPrice = reservation?.totalPrice || 0;

    const clientEmailHtml = `
      <h1>Reserva Confirmada!</h1>
      <p>Olá ${guestName},</p>
      <p>Sua reserva #${reservationNumber} foi recebida.</p>
      <p>Valor Total: R$ ${totalPrice.toFixed(2)}</p>
      <p>Hotel Solar - Belém, PA</p>
    `;

    const adminEmailHtml = `
      <h1>Nova Reserva</h1>
      <p>Reserva #${reservationNumber}</p>
      <p>Hóspede: ${guestName}</p>
      <p>Email: ${guestEmail}</p>
      <p>Valor: R$ ${totalPrice.toFixed(2)}</p>
    `;

    const results = {
      clientEmail: { sent: false, error: null as string | null },
      adminEmail: { sent: false, error: null as string | null }
    };

    // Send client email
    if (guestEmail) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
            to: [{ email: guestEmail, name: guestName }],
            subject: `Confirmação de Reserva #${reservationNumber} - Hotel Solar`,
            htmlContent: clientEmailHtml
          })
        });

        if (response.ok) {
          results.clientEmail.sent = true;
        } else {
          const errorData = await response.json();
          results.clientEmail.error = JSON.stringify(errorData);
        }
      } catch (err) {
        results.clientEmail.error = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Send admin email
    try {
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
      } else {
        const errorData = await response.json();
        results.adminEmail.error = JSON.stringify(errorData);
      }
    } catch (err) {
      results.adminEmail.error = err instanceof Error ? err.message : 'Unknown error';
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
