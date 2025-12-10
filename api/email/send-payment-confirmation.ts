import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reservation, approved } = req.body;

    if (!reservation || !reservation.mainGuest?.email || typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Missing reservation data, guest email, or approval status' });
    }

    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
    const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

    // Format rooms
    const roomsList = reservation.rooms.map((room: any) => 
      `<tr>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${room.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${room.priceSnapshot.toFixed(2)}</td>
      </tr>`
    ).join('');

    // Format extras
    const extrasRows = reservation.extras && reservation.extras.length > 0
      ? reservation.extras.map((extra: any) => 
          `<tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${extra.name} (${extra.quantity}x)</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}</td>
          </tr>`
        ).join('')
      : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #6b7280;">Nenhum serviço extra</td></tr>';

    const htmlContent = `
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
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">✅ Pagamento Confirmado!</h1>
                      <p style="color: #dcfce7; margin: 0; font-size: 16px;">Sua reserva está confirmada</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Olá <strong>${reservation.mainGuest.name}</strong>,
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Ótimas notícias! Seu pagamento foi confirmado e sua reserva no Hotel Solar está <strong>CONFIRMADA</strong>! 🎉
                      </p>

                      <!-- Reservation Number -->
                      <div style="background-color: #16a34a; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="color: #dcfce7; margin: 0 0 8px 0; font-size: 14px;">Número da Reserva</p>
                        <p style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                          ${reservationNumber}
                        </p>
                      </div>

                      <!-- Reservation Details -->
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 18px;">📋 Detalhes da Reserva Confirmada</h2>
                        
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                          <tr>
                            <td style="color: #6b7280; padding: 4px 0;">Check-in:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${checkInDate}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 4px 0;">Check-out:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${checkOutDate}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 4px 0;">Noites:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${reservation.nights}</td>
                          </tr>
                        </table>

                        <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 16px;">🛏️ Acomodações</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                          ${roomsList}
                        </table>

                        <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 16px;">➕ Serviços Extras</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                          ${extrasRows}
                        </table>

                        <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #16a34a;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #111827; font-size: 18px; font-weight: bold;">Valor Total Pago:</td>
                              <td style="color: #16a34a; font-size: 24px; font-weight: bold; text-align: right;">R$ ${reservation.totalPrice.toFixed(2)}</td>
                            </tr>
                          </table>
                        </div>
                      </div>

                      <!-- Check-in Instructions -->
                      <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">📍 Informações Importantes</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                          <li style="margin-bottom: 8px;">Check-in a partir das 14h</li>
                          <li style="margin-bottom: 8px;">Check-out até às 12h</li>
                          <li style="margin-bottom: 8px;">Traga um documento de identidade com foto</li>
                          <li style="margin-bottom: 8px;">Em caso de dúvidas, entre em contato conosco</li>
                        </ul>
                      </div>

                      <!-- Contact Info -->
                      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="color: #166534; margin: 0; font-size: 14px;">
                          <strong>📧 Dúvidas?</strong> Entre em contato conosco:<br>
                          Email: <a href="mailto:reserva@hotelsolar.tur.br" style="color: #166534; font-weight: bold;">reserva@hotelsolar.tur.br</a><br>
                          Telefone: <strong>(91) 98100-0800</strong>
                        </p>
                      </div>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                        Estamos ansiosos para recebê-lo no Hotel Solar! 🏨
                      </p>

                    </td>
                  </tr>

                  <!-- Footer -->
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

    const emailResult = await resend.emails.send({
      from: 'Hotel Solar <reserva@hotelsolar.tur.br>',
      to: reservation.mainGuest.email,
      subject: `✅ Pagamento Confirmado - Reserva #${reservationNumber} - Hotel Solar`,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      emailId: emailResult.data?.id,
      message: 'Payment confirmation email sent to client',
    });
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
