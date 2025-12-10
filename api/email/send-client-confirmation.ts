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
    const { reservation } = req.body;

    if (!reservation || !reservation.mainGuest?.email) {
      return res.status(400).json({ error: 'Missing reservation data or guest email' });
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

    // Payment instructions based on method
    const paymentInstructions = reservation.paymentMethod === 'pix' 
      ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">📱 Instruções de Pagamento via PIX</h3>
          <ol style="margin: 0; padding-left: 20px; color: #78350f;">
            <li style="margin-bottom: 8px;">Realize o pagamento via PIX no valor de <strong>R$ ${reservation.totalPrice.toFixed(2)}</strong></li>
            <li style="margin-bottom: 8px;">Envie o comprovante de pagamento para: <a href="mailto:reserva@hotelsolar.tur.br" style="color: #92400e; font-weight: bold;">reserva@hotelsolar.tur.br</a></li>
            <li style="margin-bottom: 8px;">Após recebermos o comprovante, enviaremos um email de confirmação da reserva</li>
          </ol>
        </div>
      `
      : `
        <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">💳 Pagamento via Cartão de Crédito</h3>
          <p style="margin: 0; color: #1e3a8a;">
            Estamos processando o pagamento no cartão informado. Você receberá um email com a confirmação do pagamento em breve. 
            Após a aprovação, enviaremos a confirmação final da reserva.
          </p>
        </div>
      `;

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
                    <td style="background: linear-gradient(135deg, #2F3A2F 0%, #1a221a 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #E5D3B3; margin: 0 0 10px 0; font-size: 28px;">✅ Reserva Solicitada!</h1>
                      <p style="color: #D4AF37; margin: 0; font-size: 16px;">Hotel Solar</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Olá <strong>${reservation.mainGuest.name}</strong>,
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Recebemos sua solicitação de reserva no Hotel Solar! Obrigado por nos escolher.
                      </p>

                      <!-- Reservation Number -->
                      <div style="background-color: #2F3A2F; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                        <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">Número da Reserva</p>
                        <p style="color: #D4AF37; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                          ${reservationNumber}
                        </p>
                      </div>

                      <!-- Reservation Details -->
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 18px;">📋 Detalhes da Reserva</h2>
                        
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

                        <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #D4AF37;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #111827; font-size: 18px; font-weight: bold;">Valor Total:</td>
                              <td style="color: #D4AF37; font-size: 24px; font-weight: bold; text-align: right;">R$ ${reservation.totalPrice.toFixed(2)}</td>
                            </tr>
                          </table>
                        </div>
                      </div>

                      <!-- Payment Instructions -->
                      ${paymentInstructions}

                      <!-- Important Notice -->
                      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="color: #1e40af; margin: 0; font-size: 14px;">
                          <strong>📧 Importante:</strong> Guarde este email para referência futura. 
                          Para qualquer dúvida, entre em contato conosco através do email 
                          <a href="mailto:reserva@hotelsolar.tur.br" style="color: #1e40af; font-weight: bold;">reserva@hotelsolar.tur.br</a> 
                          ou pelo telefone <strong>(91) 98100-0800</strong>.
                        </p>
                      </div>

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
      subject: `Confirmação de Reserva #${reservationNumber} - Hotel Solar`,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      emailId: emailResult.data?.id,
      message: 'Email de confirmação enviado ao cliente',
    });
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
