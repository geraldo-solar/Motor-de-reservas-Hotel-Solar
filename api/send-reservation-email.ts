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

    // Extract data safely
    const guestName = reservation?.mainGuest?.name || 'Cliente';
    const guestEmail = reservation?.mainGuest?.email || '';
    const guestPhone = reservation?.mainGuest?.phone || '';
    const guestCPF = reservation?.mainGuest?.cpf || '';
    const reservationNumber = reservation.id.toUpperCase().substring(0, 8);
    const totalPrice = reservation?.totalPrice || 0;
    const nights = reservation?.nights || 1;
    const paymentMethod = reservation?.paymentMethod || 'N/A';
    
    const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
    const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');

    // Parse rooms and extras safely
    let rooms = [];
    let extras = [];
    
    try {
      rooms = typeof reservation.rooms === 'string' ? JSON.parse(reservation.rooms) : (reservation.rooms || []);
    } catch (e) {
      rooms = [];
    }
    
    try {
      extras = typeof reservation.extras === 'string' ? JSON.parse(reservation.extras) : (reservation.extras || []);
    } catch (e) {
      extras = [];
    }

    // Generate rooms list HTML
    let roomsListHtml = '';
    if (rooms && rooms.length > 0) {
      roomsListHtml = rooms.map((room: any) => 
        `<li>${room.name || 'Acomodação'} - R$ ${(room.priceSnapshot || 0).toFixed(2)}</li>`
      ).join('');
    } else {
      roomsListHtml = '<li>Nenhuma acomodação especificada</li>';
    }

    // Generate extras list HTML
    let extrasListHtml = '';
    if (extras && extras.length > 0) {
      extrasListHtml = extras.map((extra: any) => 
        `<li>${extra.name} (${extra.quantity}x) - R$ ${((extra.priceSnapshot || 0) * (extra.quantity || 1)).toFixed(2)}</li>`
      ).join('');
    } else {
      extrasListHtml = '<li>Nenhum serviço extra</li>';
    }

    // Payment instructions based on method
    let paymentInstructions = '';
    if (paymentMethod.toUpperCase() === 'PIX') {
      paymentInstructions = `
        <div style="background-color: #fef3c7; padding: 16px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin: 0 0 12px 0;">📱 Instruções de Pagamento via PIX</h3>
          <ol style="margin: 0; padding-left: 20px; color: #78350f;">
            <li>Realize o pagamento via PIX no valor de <strong>R$ ${totalPrice.toFixed(2)}</strong></li>
            <li>Envie o comprovante para: <strong>reserva@hotelsolar.tur.br</strong></li>
            <li>Após recebermos o comprovante, enviaremos a confirmação</li>
          </ol>
        </div>
      `;
    } else {
      paymentInstructions = `
        <div style="background-color: #dbeafe; padding: 16px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 12px 0;">💳 Pagamento via Cartão de Crédito</h3>
          <p style="margin: 0; color: #1e3a8a;">Estamos processando o pagamento. Você receberá a confirmação em breve.</p>
        </div>
      `;
    }

    const clientEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #2F3A2F 0%, #1a221a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #E5D3B3; margin: 0 0 10px 0; font-size: 28px;">✅ Reserva Solicitada!</h1>
              <p style="color: #D4AF37; margin: 0; font-size: 16px;">Hotel Solar</p>
            </div>
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${guestName}</strong>,
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
                <p style="margin: 8px 0;"><strong>Check-in:</strong> ${checkInDate}</p>
                <p style="margin: 8px 0;"><strong>Check-out:</strong> ${checkOutDate}</p>
                <p style="margin: 8px 0;"><strong>Noites:</strong> ${nights}</p>
                <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 16px;">🛏️ Acomodações</h3>
                <ul style="margin: 0; padding-left: 20px;">${roomsListHtml}</ul>
                <h3 style="color: #2F3A2F; margin: 20px 0 12px 0; font-size: 16px;">➕ Serviços Extras</h3>
                <ul style="margin: 0; padding-left: 20px;">${extrasListHtml}</ul>
                <div style="margin-top: 20px; padding-top: 16px; border-top: 2px solid #D4AF37;">
                  <p style="font-size: 18px; margin: 0;"><strong>Valor Total:</strong> <span style="color: #D4AF37; font-size: 24px; font-weight: bold;">R$ ${totalPrice.toFixed(2)}</span></p>
                </div>
              </div>
              ${paymentInstructions}
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
                Hotel Solar - Belém, PA<br>
                Email: geraldo@hotelsolar.tur.br
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h1 style="color: #2F3A2F; margin: 0 0 20px 0;">🔔 Nova Reserva</h1>
            <p style="font-size: 18px; margin: 0 0 20px 0;"><strong>Número da Reserva:</strong> ${reservationNumber}</p>
            
            <h2 style="color: #2F3A2F; margin: 30px 0 12px 0;">Dados do Hóspede</h2>
            <p style="margin: 8px 0;"><strong>Nome:</strong> ${guestName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${guestEmail}</p>
            <p style="margin: 8px 0;"><strong>Telefone:</strong> ${guestPhone}</p>
            <p style="margin: 8px 0;"><strong>CPF:</strong> ${guestCPF}</p>
            
            <h2 style="color: #2F3A2F; margin: 30px 0 12px 0;">Detalhes da Reserva</h2>
            <p style="margin: 8px 0;"><strong>Check-in:</strong> ${checkInDate}</p>
            <p style="margin: 8px 0;"><strong>Check-out:</strong> ${checkOutDate}</p>
            <p style="margin: 8px 0;"><strong>Noites:</strong> ${nights}</p>
            
            <h3 style="color: #2F3A2F; margin: 20px 0 12px 0;">Acomodações:</h3>
            <ul style="margin: 0; padding-left: 20px;">${roomsListHtml}</ul>
            
            <h3 style="color: #2F3A2F; margin: 20px 0 12px 0;">Serviços Extras:</h3>
            <ul style="margin: 0; padding-left: 20px;">${extrasListHtml}</ul>
            
            <p style="font-size: 18px; margin: 20px 0;"><strong>Valor Total:</strong> R$ ${totalPrice.toFixed(2)}</p>
            <p style="margin: 8px 0;"><strong>Forma de Pagamento:</strong> ${paymentMethod}</p>
            
            <div style="background-color: #fef3c7; padding: 16px; margin-top: 20px; border-radius: 4px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;"><strong>⚠️ Ação Necessária:</strong> Confirme o pagamento no painel administrativo.</p>
            </div>
          </div>
        </body>
      </html>
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
