import type { VercelRequest, VercelResponse } from '@vercel/node';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'send-client-confirmation':
        return await sendClientConfirmation(req, res);
      case 'send-payment-confirmation':
        return await sendPaymentConfirmation(req, res);
      case 'send-payment-denied':
        return await sendPaymentDenied(req, res);
      case 'send-reservation':
        return await sendReservationToAdmin(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process email request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function sendClientConfirmation(req: VercelRequest, res: VercelResponse) {
  const { reservation } = req.body;

  if (!reservation || !reservation.mainGuest?.email) {
    return res.status(400).json({ error: 'Missing reservation data or guest email' });
  }

  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

  const roomsList = reservation.rooms.map((room: any) => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${room.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${room.priceSnapshot.toFixed(2)}</td>
    </tr>`
  ).join('');

  const extrasRows = reservation.extras && reservation.extras.length > 0
    ? reservation.extras.map((extra: any) => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${extra.name} (${extra.quantity}x)</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}</td>
        </tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #6b7280;">Nenhum serviço extra</td></tr>';

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
                
                <tr>
                  <td style="background: linear-gradient(135deg, #2F3A2F 0%, #1a221a 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #E5D3B3; margin: 0 0 10px 0; font-size: 28px;">✅ Reserva Solicitada!</h1>
                    <p style="color: #D4AF37; margin: 0; font-size: 16px;">Hotel Solar</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px;">
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Olá <strong>${reservation.mainGuest.name}</strong>,
                    </p>

                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Recebemos sua solicitação de reserva no Hotel Solar! Obrigado por nos escolher.
                    </p>

                    <div style="background-color: #2F3A2F; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                      <p style="color: #9ca3af; margin: 0 0 8px 0; font-size: 14px;">Número da Reserva</p>
                      <p style="color: #D4AF37; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                        ${reservationNumber}
                      </p>
                    </div>

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

                    ${paymentInstructions}

                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                      <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>📧 Importante:</strong> Guarde este email para referência futura. 
                        Para qualquer dúvida, entre em contato conosco através do email 
                        <a href="mailto:reserva@hotelsolar.tur.br" style="color: #1e40af; font-weight: bold;">reserva@hotelsolar.tur.br</a> 
                        ou pelo telefone <strong>(91) 98100-0800</strong>.
                      </p>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
                      <tr>
                        <td style="text-align: center; padding-bottom: 15px;">
                          <p style="margin: 0; font-size: 14px; color: #6B7280;">
                            <a href="https://motor-de-reservas-hotel-solar.vercel.app/regulamento" style="color: #16A34A; text-decoration: none; font-weight: 600;">📋 Regulamento de Hospedagem e Cancelamento</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 15px;">
                          <p style="margin: 0 0 10px 0; font-size: 12px; color: #9CA3AF;">Precisa cancelar sua reserva?</p>
                          <a href="https://motor-de-reservas-hotel-solar.vercel.app/cancelar-reserva?id=${reservation.id}" style="display: inline-block; padding: 8px 16px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600;">Cancelar Reserva</a>
                        </td>
                      </tr>
                    </table>

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
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
        to: [{ email: reservation.mainGuest.email, name: reservation.mainGuest.name }],
        subject: `Confirmação de Reserva #${reservationNumber} - Hotel Solar`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EMAIL] Brevo API error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email', details: error });
    }

    const result = await response.json();
    return res.status(200).json({
      success: true,
      emailId: result.messageId,
      message: 'Email de confirmação enviado ao cliente',
    });
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

async function sendPaymentConfirmation(req: VercelRequest, res: VercelResponse) {
  const { reservation } = req.body;

  if (!reservation || !reservation.mainGuest?.email) {
    return res.status(400).json({ error: 'Missing reservation data or guest email' });
  }

  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

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
                
                <tr>
                  <td style="background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">🎉 Pagamento Confirmado!</h1>
                    <p style="color: #D4F4DD; margin: 0; font-size: 16px;">Sua reserva está confirmada</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px;">
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Olá <strong>${reservation.mainGuest.name}</strong>,
                    </p>

                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Ótimas notícias! Seu pagamento foi confirmado e sua reserva no Hotel Solar está <strong>100% garantida</strong>! 🎊
                    </p>

                    <div style="background-color: #16A34A; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
                      <p style="color: #D4F4DD; margin: 0 0 8px 0; font-size: 14px;">Número da Reserva</p>
                      <p style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                        ${reservationNumber}
                      </p>
                    </div>

                    <div style="background-color: #f0fdf4; border: 2px solid #16A34A; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #15803D; margin: 0 0 16px 0; font-size: 18px;">✅ Confirmação da Estadia</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #166534; padding: 8px 0; font-weight: 600;">Check-in:</td>
                          <td style="color: #15803D; font-weight: bold; text-align: right; padding: 8px 0; font-size: 18px;">${checkInDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #166534; padding: 8px 0; font-weight: 600;">Check-out:</td>
                          <td style="color: #15803D; font-weight: bold; text-align: right; padding: 8px 0; font-size: 18px;">${checkOutDate}</td>
                        </tr>
                        <tr>
                          <td style="color: #166534; padding: 8px 0; font-weight: 600;">Valor Pago:</td>
                          <td style="color: #16A34A; font-weight: bold; text-align: right; padding: 8px 0; font-size: 20px;">R$ ${reservation.totalPrice.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">📋 Próximos Passos</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                        <li style="margin-bottom: 8px;">Guarde este email como comprovante da reserva</li>
                        <li style="margin-bottom: 8px;">Apresente o número da reserva no check-in</li>
                        <li style="margin-bottom: 8px;">Check-in a partir das 14h00</li>
                        <li style="margin-bottom: 8px;">Check-out até às 12h00</li>
                      </ul>
                    </div>

                    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                      <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>📧 Dúvidas?</strong> Entre em contato conosco através do email 
                        <a href="mailto:reserva@hotelsolar.tur.br" style="color: #1e40af; font-weight: bold;">reserva@hotelsolar.tur.br</a> 
                        ou pelo telefone <strong>(91) 98100-0800</strong>.
                      </p>
                    </div>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px; padding: 20px; background-color: #F9FAFB; border-radius: 8px;">
                      <tr>
                        <td style="text-align: center; padding-bottom: 15px;">
                          <p style="margin: 0; font-size: 14px; color: #6B7280;">
                            <a href="https://motor-de-reservas-hotel-solar.vercel.app/regulamento" style="color: #16A34A; text-decoration: none; font-weight: 600;">📋 Regulamento de Hospedagem</a>
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="text-align: center; border-top: 1px solid #E5E7EB; padding-top: 15px;">
                          <p style="margin: 0 0 10px 0; font-size: 12px; color: #9CA3AF;">Precisa cancelar?</p>
                          <a href="https://motor-de-reservas-hotel-solar.vercel.app/cancelar-reserva?id=${reservation.id}" style="display: inline-block; padding: 8px 16px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 600;">Cancelar Reserva</a>
                        </td>
                      </tr>
                    </table>

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
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
        to: [{ email: reservation.mainGuest.email, name: reservation.mainGuest.name }],
        subject: `✅ Pagamento Confirmado - Reserva #${reservationNumber} - Hotel Solar`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EMAIL] Brevo API error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email', details: error });
    }

    const result = await response.json();
    return res.status(200).json({
      success: true,
      emailId: result.messageId,
      message: 'Email de confirmação de pagamento enviado',
    });
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

async function sendReservationToAdmin(req: VercelRequest, res: VercelResponse) {
  const { reservation } = req.body;

  if (!reservation) {
    return res.status(400).json({ error: 'Missing reservation data' });
  }

  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

  const roomsList = reservation.rooms.map((room: any) => 
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${room.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${room.priceSnapshot.toFixed(2)}</td>
    </tr>`
  ).join('');

  const extrasRows = reservation.extras && reservation.extras.length > 0
    ? reservation.extras.map((extra: any) => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${extra.name} (${extra.quantity}x)</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}</td>
        </tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #6b7280;">Nenhum serviço extra</td></tr>';

  const guestsList = reservation.additionalGuests && reservation.additionalGuests.length > 0
    ? reservation.additionalGuests.map((guest: any, index: number) => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${index + 2}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${guest.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${guest.cpf || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${guest.age || 'N/A'}</td>
        </tr>`
      ).join('')
    : '';

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
              <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #2F3A2F 0%, #1a221a 100%); padding: 30px; text-align: center;">
                    <h1 style="color: #E5D3B3; margin: 0 0 10px 0; font-size: 24px;">🔔 Nova Reserva Recebida</h1>
                    <p style="color: #D4AF37; margin: 0; font-size: 14px;">Sistema de Reservas - Hotel Solar</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px;">
                    
                    <div style="background-color: #2F3A2F; padding: 15px; border-radius: 8px; text-align: center; margin: 0 0 20px 0;">
                      <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px;">Número da Reserva</p>
                      <p style="color: #D4AF37; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                        ${reservationNumber}
                      </p>
                    </div>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 16px;">👤 Dados do Hóspede Principal</h2>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; width: 30%;">Nome:</td>
                          <td style="color: #111827; font-weight: bold; padding: 4px 0;">${reservation.mainGuest.name}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0;">CPF:</td>
                          <td style="color: #111827; font-weight: bold; padding: 4px 0;">${reservation.mainGuest.cpf}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0;">E-mail:</td>
                          <td style="color: #111827; font-weight: bold; padding: 4px 0;">${reservation.mainGuest.email}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0;">WhatsApp:</td>
                          <td style="color: #111827; font-weight: bold; padding: 4px 0;">${reservation.mainGuest.phone}</td>
                        </tr>
                      </table>

                      ${guestsList ? `
                        <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 14px;">👥 Acompanhantes</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 13px;">
                          <tr style="background-color: #e5e7eb;">
                            <th style="padding: 6px; text-align: left; color: #374151;">#</th>
                            <th style="padding: 6px; text-align: left; color: #374151;">Nome</th>
                            <th style="padding: 6px; text-align: left; color: #374151;">CPF</th>
                            <th style="padding: 6px; text-align: left; color: #374151;">Idade</th>
                          </tr>
                          ${guestsList}
                        </table>
                      ` : ''}
                    </div>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 16px;">📋 Detalhes da Reserva</h2>
                      
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
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0;">Forma de Pagamento:</td>
                          <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${reservation.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</td>
                        </tr>
                      </table>

                      <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 14px;">🛏️ Acomodações</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        ${roomsList}
                      </table>

                      <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 14px;">➕ Serviços Extras</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                        ${extrasRows}
                      </table>

                      <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #D4AF37;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="color: #111827; font-size: 16px; font-weight: bold;">Valor Total:</td>
                            <td style="color: #D4AF37; font-size: 20px; font-weight: bold; text-align: right;">R$ ${reservation.totalPrice.toFixed(2)}</td>
                          </tr>
                        </table>
                      </div>
                    </div>

                    ${reservation.specialRequests ? `
                      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                        <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 14px;">💬 Pedidos Especiais</h3>
                        <p style="color: #78350f; margin: 0; font-size: 13px;">${reservation.specialRequests}</p>
                      </div>
                    ` : ''}

                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; margin: 0; font-size: 12px;">
                      Email automático do Sistema de Reservas - Hotel Solar<br>
                      ${new Date().toLocaleString('pt-BR')}
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
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Sistema de Reservas', email: 'geraldo@hotelsolar.tur.br' },
        to: [{ email: 'reserva@hotelsolar.tur.br', name: 'Reservas Hotel Solar' }],
        subject: `🔔 Nova Reserva #${reservationNumber} - ${reservation.mainGuest.name}`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EMAIL] Brevo API error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email', details: error });
    }

    const result = await response.json();
    return res.status(200).json({
      success: true,
      emailId: result.messageId,
      message: 'Email enviado para administração',
    });
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}

async function sendPaymentDenied(req: VercelRequest, res: VercelResponse) {
  const { reservation } = req.body;

  if (!reservation || !reservation.mainGuest?.email) {
    return res.status(400).json({ error: 'Missing reservation data or guest email' });
  }

  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);

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
                
                <tr>
                  <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0 0 10px 0; font-size: 28px;">⚠️ Pagamento Não Aprovado</h1>
                    <p style="color: #FEE2E2; margin: 0; font-size: 16px;">Reserva #${reservationNumber}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px;">
                    
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Olá <strong>${reservation.mainGuest.name}</strong>,
                    </p>

                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Infelizmente, não conseguimos processar o pagamento da sua reserva no Hotel Solar.
                    </p>

                    <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #991B1B; margin: 0 0 12px 0; font-size: 16px;">❌ Motivos Comuns para Recusa</h3>
                      <ul style="margin: 0; padding-left: 20px; color: #7F1D1D;">
                        <li style="margin-bottom: 8px;">Saldo insuficiente no cartão</li>
                        <li style="margin-bottom: 8px;">Limite de crédito excedido</li>
                        <li style="margin-bottom: 8px;">Dados do cartão incorretos</li>
                        <li style="margin-bottom: 8px;">Cartão bloqueado ou vencido</li>
                        <li style="margin-bottom: 8px;">Restrição do banco emissor</li>
                      </ul>
                    </div>

                    <div style="background-color: #DBEAFE; border-left: 4px solid #3B82F6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                      <h3 style="color: #1E40AF; margin: 0 0 12px 0; font-size: 16px;">💡 O Que Fazer Agora?</h3>
                      <p style="margin: 0 0 12px 0; color: #1E3A8A;">
                        <strong>Opção 1:</strong> Entre em contato com seu banco para verificar o motivo da recusa e tente novamente.
                      </p>
                      <p style="margin: 0 0 12px 0; color: #1E3A8A;">
                        <strong>Opção 2:</strong> Faça uma nova reserva utilizando outro cartão de crédito ou PIX.
                      </p>
                      <p style="margin: 0; color: #1E3A8A;">
                        <strong>Opção 3:</strong> Entre em contato conosco pelo WhatsApp <strong>(91) 98100-0800</strong> para tentarmos processar o pagamento novamente.
                      </p>
                    </div>

                    <div style="background-color: #F9FAFB; border: 2px solid #E5E7EB; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 16px;">📋 Dados da Reserva Cancelada</h3>
                      
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0;">Número da Reserva:</td>
                          <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${reservationNumber}</td>
                        </tr>
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
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; padding-top: 12px; border-top: 1px solid #E5E7EB;">Valor Total:</td>
                          <td style="color: #DC2626; font-size: 18px; font-weight: bold; text-align: right; padding: 4px 0; padding-top: 12px; border-top: 1px solid #E5E7EB;">R$ ${reservation.totalPrice.toFixed(2)}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://motor-de-reservas-hotel-solar.vercel.app" style="display: inline-block; padding: 14px 28px; background-color: #16A34A; color: white; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                        Fazer Nova Reserva
                      </a>
                    </div>

                    <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; padding: 16px; border-radius: 4px; margin: 20px 0;">
                      <p style="color: #92400E; margin: 0; font-size: 14px; text-align: center;">
                        <strong>💬 Precisa de Ajuda?</strong><br>
                        Entre em contato conosco:<br>
                        WhatsApp: <strong>(91) 98100-0800</strong><br>
                        E-mail: <a href="mailto:reserva@hotelsolar.tur.br" style="color: #92400E; font-weight: bold;">reserva@hotelsolar.tur.br</a>
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
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Hotel Solar', email: 'geraldo@hotelsolar.tur.br' },
        to: [{ email: reservation.mainGuest.email, name: reservation.mainGuest.name }],
        subject: `⚠️ Pagamento Não Aprovado - Reserva #${reservationNumber}`,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[EMAIL] Brevo API error:', error);
      return res.status(500).json({ success: false, error: 'Failed to send email', details: error });
    }

    const result = await response.json();
    return res.status(200).json({
      success: true,
      emailId: result.messageId,
      message: 'Email de pagamento negado enviado ao cliente',
    });
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return res.status(500).json({ success: false, error: 'Failed to send email' });
  }
}
