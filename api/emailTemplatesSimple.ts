// Simplified email template generation functions

export function generateClientConfirmationEmail(
  reservation: any,
  checkInDate: string,
  checkOutDate: string,
  reservationNumber: string
): string {
  const guestName = reservation?.mainGuest?.name || 'Cliente';
  const totalPrice = reservation?.totalPrice || 0;
  const nights = reservation?.nights || 1;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px;">
          <h1 style="color: #2F3A2F;">✅ Reserva Solicitada!</h1>
          <p>Olá <strong>${guestName}</strong>,</p>
          <p>Recebemos sua solicitação de reserva no Hotel Solar!</p>
          
          <div style="background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h2 style="color: #2F3A2F;">Número da Reserva</h2>
            <p style="font-size: 24px; font-weight: bold; color: #D4AF37;">${reservationNumber}</p>
            
            <h3>Detalhes da Reserva</h3>
            <p><strong>Check-in:</strong> ${checkInDate}</p>
            <p><strong>Check-out:</strong> ${checkOutDate}</p>
            <p><strong>Noites:</strong> ${nights}</p>
            <p><strong>Valor Total:</strong> R$ ${totalPrice.toFixed(2)}</p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <h3>📱 Instruções de Pagamento</h3>
            <p>Envie o comprovante de pagamento para: <strong>reserva@hotelsolar.tur.br</strong></p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Hotel Solar - Belém, PA<br>
            Email: geraldo@hotelsolar.tur.br
          </p>
        </div>
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
  const guestName = reservation?.mainGuest?.name || 'N/A';
  const guestEmail = reservation?.mainGuest?.email || 'N/A';
  const guestPhone = reservation?.mainGuest?.phone || 'N/A';
  const totalPrice = reservation?.totalPrice || 0;
  const nights = reservation?.nights || 1;
  const paymentMethod = reservation?.paymentMethod || 'N/A';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
          <h1 style="color: #2F3A2F;">🔔 Nova Reserva</h1>
          <p><strong>Número da Reserva:</strong> ${reservationNumber}</p>
          
          <h2>Dados do Hóspede</h2>
          <p><strong>Nome:</strong> ${guestName}</p>
          <p><strong>Email:</strong> ${guestEmail}</p>
          <p><strong>Telefone:</strong> ${guestPhone}</p>
          
          <h2>Detalhes da Reserva</h2>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Noites:</strong> ${nights}</p>
          <p><strong>Valor Total:</strong> R$ ${totalPrice.toFixed(2)}</p>
          <p><strong>Forma de Pagamento:</strong> ${paymentMethod}</p>
          
          <div style="background-color: #fef3c7; padding: 16px; margin-top: 20px; border-radius: 4px;">
            <p><strong>⚠️ Ação Necessária:</strong> Confirme o pagamento no painel administrativo.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
