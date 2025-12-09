import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reservation } = req.body;

    if (!reservation) {
      return res.status(400).json({ error: 'Missing reservation data' });
    }

    // Format dates
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');
    const createdDate = new Date(reservation.createdAt).toLocaleString('pt-BR');

    // Format rooms
    const roomsList = reservation.rooms.map((room: any) => 
      `- ${room.name}: R$ ${room.priceSnapshot.toFixed(2)}`
    ).join('\n');

    // Format extras
    const extrasList = reservation.extras && reservation.extras.length > 0
      ? reservation.extras.map((extra: any) => 
          `- ${extra.name} (${extra.quantity}x): R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}`
        ).join('\n')
      : 'Nenhum serviço extra';

    // Format additional guests
    const additionalGuestsList = reservation.additionalGuests && reservation.additionalGuests.length > 0
      ? reservation.additionalGuests.map((guest: any, index: number) => 
          `${index + 1}. ${guest.name} - CPF: ${guest.cpf}${guest.age ? ` - Idade: ${guest.age}` : ''}`
        ).join('\n')
      : 'Nenhum hóspede adicional';

    // Format discount
    const discountInfo = reservation.discountApplied
      ? `Código: ${reservation.discountApplied.code} - Desconto: R$ ${reservation.discountApplied.amount.toFixed(2)}`
      : 'Nenhum desconto aplicado';

    // Format payment method
    const paymentInfo = reservation.paymentMethod === 'PIX' 
      ? 'PIX'
      : `Cartão de Crédito\nTitular: ${reservation.cardDetails?.holderName || 'N/A'}\nNúmero: **** **** **** ${reservation.cardDetails?.number?.slice(-4) || '****'}\nValidade: ${reservation.cardDetails?.expiry || 'N/A'}`;

    // Admin panel link
    const adminPanelUrl = `${process.env.VERCEL_URL || 'https://motor-de-reservas-hotel-solar.vercel.app'}/?view=admin`;

    // Email HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .section { margin-bottom: 20px; }
            .section-title { font-weight: bold; color: #f97316; margin-bottom: 10px; font-size: 16px; }
            .info-row { margin: 5px 0; }
            .total { font-size: 20px; font-weight: bold; color: #f97316; margin-top: 15px; }
            .button { display: inline-block; background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
            pre { background-color: #f3f4f6; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏨 Nova Reserva - Hotel Solar</h1>
            </div>
            <div class="content">
              <div class="section">
                <div class="section-title">📋 Informações da Reserva</div>
                <div class="info-row"><strong>ID:</strong> ${reservation.id}</div>
                <div class="info-row"><strong>Data da Reserva:</strong> ${createdDate}</div>
                <div class="info-row"><strong>Check-in:</strong> ${checkInDate}</div>
                <div class="info-row"><strong>Check-out:</strong> ${checkOutDate}</div>
                <div class="info-row"><strong>Noites:</strong> ${reservation.nights}</div>
                <div class="info-row"><strong>Status:</strong> ${reservation.status}</div>
              </div>

              <div class="section">
                <div class="section-title">👤 Hóspede Principal</div>
                <div class="info-row"><strong>Nome:</strong> ${reservation.mainGuest.name}</div>
                <div class="info-row"><strong>CPF:</strong> ${reservation.mainGuest.cpf}</div>
                ${reservation.mainGuest.age ? `<div class="info-row"><strong>Idade:</strong> ${reservation.mainGuest.age}</div>` : ''}
                ${reservation.mainGuest.email ? `<div class="info-row"><strong>E-mail:</strong> ${reservation.mainGuest.email}</div>` : ''}
                ${reservation.mainGuest.phone ? `<div class="info-row"><strong>Telefone:</strong> ${reservation.mainGuest.phone}</div>` : ''}
              </div>

              <div class="section">
                <div class="section-title">👥 Hóspedes Adicionais</div>
                <pre>${additionalGuestsList}</pre>
              </div>

              ${reservation.observations ? `
              <div class="section">
                <div class="section-title">📝 Observações</div>
                <pre>${reservation.observations}</pre>
              </div>
              ` : ''}

              <div class="section">
                <div class="section-title">🛏️ Quartos</div>
                <pre>${roomsList}</pre>
              </div>

              <div class="section">
                <div class="section-title">➕ Serviços Extras</div>
                <pre>${extrasList}</pre>
              </div>

              <div class="section">
                <div class="section-title">💰 Informações Financeiras</div>
                <div class="info-row"><strong>Desconto:</strong> ${discountInfo}</div>
                <div class="total">Total: R$ ${reservation.totalPrice.toFixed(2)}</div>
              </div>

              <div class="section">
                <div class="section-title">💳 Forma de Pagamento</div>
                <pre>${paymentInfo}</pre>
              </div>

              <div style="text-align: center;">
                <a href="${adminPanelUrl}" class="button">Acessar Painel Administrativo</a>
              </div>
            </div>
            <div class="footer">
              <p>Hotel Solar - Sistema de Reservas</p>
              <p>Este é um e-mail automático, não responda.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const emailResult = await resend.emails.send({
      from: 'Hotel Solar <reservas@hotelsolar.tur.br>',
      to: 'reserva@hotelsolar.tur.br',
      subject: `Nova Reserva #${reservation.id.slice(0, 8)} - ${reservation.mainGuest.name}`,
      html: htmlContent,
    });

    return res.status(200).json({
      success: true,
      emailId: emailResult.data?.id,
      message: 'E-mail enviado com sucesso',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
