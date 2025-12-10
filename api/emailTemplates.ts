// Email template generation functions

export function generateClientConfirmationEmail(
  reservation: any,
  checkInDate: string,
  checkOutDate: string,
  reservationNumber: string
): string {
  // Parse rooms and extras if they are JSON strings
  let rooms = [];
  let extras = [];
  
  try {
    rooms = typeof reservation.rooms === 'string' ? JSON.parse(reservation.rooms) : (reservation.rooms || []);
  } catch (e) {
    console.error('Error parsing rooms:', e);
    rooms = [];
  }
  
  try {
    extras = typeof reservation.extras === 'string' ? JSON.parse(reservation.extras) : (reservation.extras || []);
  } catch (e) {
    console.error('Error parsing extras:', e);
    extras = [];
  }
  
  const roomsList = rooms && rooms.length > 0 
    ? rooms.map((room: any) => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${room.name || 'Acomodação'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(room.priceSnapshot || 0).toFixed(2)}</td>
        </tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding: 8px; text-align: center;">Nenhuma acomodação</td></tr>';

  const extrasRows = extras && extras.length > 0
    ? extras.map((extra: any) => 
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${extra.name} (${extra.quantity}x)</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}</td>
        </tr>`
      ).join('')
    : '<tr><td colspan="2" style="padding: 8px; text-align: center; color: #6b7280;">Nenhum serviço extra</td></tr>';

  const paymentInstructions = (reservation.paymentMethod || '').toUpperCase() === 'PIX' 
    ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #92400e; margin: 0 0 12px 0; font-size: 16px;">📱 Instruções de Pagamento via PIX</h3>
        <ol style="margin: 0; padding-left: 20px; color: #78350f;">
          <li style="margin-bottom: 8px;">Realize o pagamento via PIX no valor de <strong>R$ ${(reservation.totalPrice || 0).toFixed(2)}</strong></li>
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
        </p>
      </div>
    `;

  return `
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
                      Olá <strong>${reservation.mainGuest?.name || 'Cliente'}</strong>,
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
                          <td style="color: #111827; font-weight: bold; text-align: right; padding: 4px 0;">${reservation.nights || 1}</td>
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
                            <td style="color: #D4AF37; font-size: 24px; font-weight: bold; text-align: right;">R$ ${(reservation.totalPrice || 0).toFixed(2)}</td>
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
}

export function generateAdminNotificationEmail(
  reservation: any,
  checkInDate: string,
  checkOutDate: string,
  reservationNumber: string
): string {
  // Parse rooms and extras if they are JSON strings
  let rooms = [];
  let extras = [];
  
  try {
    rooms = typeof reservation.rooms === 'string' ? JSON.parse(reservation.rooms) : (reservation.rooms || []);
  } catch (e) {
    console.error('Error parsing rooms:', e);
    rooms = [];
  }
  
  try {
    extras = typeof reservation.extras === 'string' ? JSON.parse(reservation.extras) : (reservation.extras || []);
  } catch (e) {
    console.error('Error parsing extras:', e);
    extras = [];
  }
  
  const roomsList = rooms && rooms.length > 0
    ? rooms.map((room: any) => 
        `<li>${room.name || 'Acomodação'} - R$ ${(room.priceSnapshot || 0).toFixed(2)}</li>`
      ).join('')
    : '<li>Nenhuma acomodação</li>';

  const extrasList = extras && extras.length > 0
    ? extras.map((extra: any) => 
        `<li>${extra.name} (${extra.quantity}x) - R$ ${(extra.priceSnapshot * extra.quantity).toFixed(2)}</li>`
      ).join('')
    : '<li>Nenhum serviço extra</li>';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px;">
          <h1 style="color: #D4AF37; margin-bottom: 20px;">🔔 Nova Reserva Recebida!</h1>
          
          <p><strong>Número da Reserva:</strong> ${reservationNumber}</p>
          
          <h2 style="color: #2F3A2F; margin-top: 30px;">Dados do Hóspede</h2>
          <p><strong>Hóspede:</strong> ${reservation.mainGuest?.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${reservation.mainGuest?.email || 'N/A'}</p>
          <p><strong>Telefone:</strong> ${reservation.mainGuest?.phone || 'N/A'}</p>
          <p><strong>CPF:</strong> ${reservation.mainGuest?.cpf || 'N/A'}</p>
          
          <h2 style="color: #2F3A2F; margin-top: 30px;">Detalhes da Reserva</h2>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Noites:</strong> ${reservation.nights || 1}</p>
          
          <h3 style="color: #2F3A2F; margin-top: 20px;">Acomodações:</h3>
          <ul>${roomsList}</ul>
          
          <h3 style="color: #2F3A2F; margin-top: 20px;">Serviços Extras:</h3>
          <ul>${extrasList}</ul>
          
          <p style="font-size: 18px; margin-top: 20px;"><strong>Valor Total:</strong> R$ ${(reservation.totalPrice || 0).toFixed(2)}</p>
          <p><strong>Forma de Pagamento:</strong> ${reservation.paymentMethod || 'N/A'}</p>
          
          ${reservation.observations ? `<p><strong>Observações:</strong> ${reservation.observations}</p>` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e;">
              <strong>⚠️ Ação Necessária:</strong> Aguarde o comprovante de pagamento do cliente para confirmar a reserva no painel administrativo.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
