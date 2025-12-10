import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
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
    const guestEmail = reservation.guest_email;
    const guestName = reservation.guest_name;
    const reservationNumber = reservationId.toUpperCase().substring(0, 8);
    const checkInDate = new Date(reservation.check_in_date).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservation.check_out_date).toLocaleDateString('pt-BR');
    const totalPrice = parseFloat(reservation.total_price);
    const refundAmount = (totalPrice * refundPercentage / 100).toFixed(2);

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
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 28px;">❌ Reserva Cancelada</h1>
                      <p style="color: #FEE2E2; margin: 0; font-size: 16px;">Hotel Solar</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Olá <strong>${guestName}</strong>,
                      </p>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Sua reserva no Hotel Solar foi cancelada conforme solicitado.
                      </p>

                      <!-- Reservation Number -->
                      <div style="background-color: #FEE2E2; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #DC2626;">
                        <p style="color: #991B1B; margin: 0 0 8px 0; font-size: 14px;">Reserva Cancelada</p>
                        <p style="color: #DC2626; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; font-family: 'Courier New', monospace;">
                          ${reservationNumber}
                        </p>
                      </div>

                      <!-- Cancellation Details -->
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h2 style="color: #2F3A2F; margin: 0 0 16px 0; font-size: 18px;">📋 Detalhes do Cancelamento</h2>
                        
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
                            <td style="color: #6b7280; padding: 4px 0;">Valor Total:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">R$ ${totalPrice.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; padding: 4px 0;">Data do Cancelamento:</td>
                            <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${new Date().toLocaleDateString('pt-BR')}</td>
                          </tr>
                        </table>
                      </div>

                      <!-- Refund Information -->
                      ${refundPercentage > 0 ? `
                        <div style="background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 16px; margin: 20px 0; border-radius: 4px;">
                          <h3 style="color: #065F46; margin: 0 0 12px 0; font-size: 16px;">💰 Informações de Reembolso</h3>
                          <p style="margin: 0; color: #047857;">
                            Você tem direito a <strong>${refundPercentage}% de reembolso</strong> do valor pago.<br />
                            <strong>Valor do reembolso: R$ ${refundAmount}</strong>
                          </p>
                          <p style="margin: 12px 0 0 0; color: #047857; font-size: 14px;">
                            O reembolso será processado em até 5 dias úteis para pagamentos via PIX, 
                            ou em até 2 faturas para pagamentos via cartão de crédito.
                          </p>
                        </div>
                      ` : `
                        <div style="background-color: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
                          <h3 style="color: #991B1B; margin: 0 0 12px 0; font-size: 16px;">❌ Sem Direito a Reembolso</h3>
                          <p style="margin: 0; color: #B91C1C;">
                            De acordo com nossa política de cancelamento, cancelamentos com menos de 7 dias 
                            de antecedência do check-in não são reembolsáveis.
                          </p>
                        </div>
                      `}

                      <!-- Important Notice -->}
                      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 4px; margin: 20px 0;">
                        <p style="color: #1e40af; margin: 0; font-size: 14px;">
                          <strong>📧 Dúvidas?</strong> Entre em contato conosco através do email 
                          <a href="mailto:reserva@hotelsolar.tur.br" style="color: #1e40af; font-weight: bold;">reserva@hotelsolar.tur.br</a> 
                          ou pelo telefone <strong>(91) 98100-0800</strong>.
                        </p>
                      </div>

                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
                        Esperamos recebê-lo em uma próxima oportunidade! 🏨
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

    // Send email to guest
    await resend.emails.send({
      from: 'Hotel Solar <reserva@hotelsolar.tur.br>',
      to: guestEmail,
      subject: `Cancelamento Confirmado #${reservationNumber} - Hotel Solar`,
      html: guestEmailHtml,
    });

    // Send notification email to admin
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif;">
          <h2 style="color: #DC2626;">❌ Reserva Cancelada</h2>
          <p><strong>Número da Reserva:</strong> ${reservationNumber}</p>
          <p><strong>Hóspede:</strong> ${guestName}</p>
          <p><strong>Email:</strong> ${guestEmail}</p>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Valor Total:</strong> R$ ${totalPrice.toFixed(2)}</p>
          <p><strong>Reembolso:</strong> ${refundPercentage}% (R$ ${refundAmount})</p>
          <p><strong>Motivo do Cancelamento:</strong></p>
          <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px;">${reason}</p>
          <p><strong>Data do Cancelamento:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: 'Hotel Solar <reserva@hotelsolar.tur.br>',
      to: 'reserva@hotelsolar.tur.br',
      subject: `🚨 Cancelamento: Reserva #${reservationNumber}`,
      html: adminEmailHtml,
    });

    return res.status(200).json({
      success: true,
      message: 'Reservation canceled successfully',
      refundPercentage,
      refundAmount: parseFloat(refundAmount)
    });
  } catch (error) {
    console.error('Error canceling reservation:', error);
    return res.status(500).json({ 
      error: 'Failed to cancel reservation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
