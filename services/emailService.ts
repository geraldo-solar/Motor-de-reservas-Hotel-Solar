import { Reservation } from '../types';

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const ADMIN_EMAIL = 'reservas@hotelsolar.com.br'; // Alterar para o e-mail do admin

interface EmailParams {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  sender?: { email: string; name: string };
}

/**
 * Send email via Brevo API
 */
async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error('[EMAIL] BREVO_API_KEY not configured');
    return false;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: params.sender || { email: 'noreply@hotelsolar.com.br', name: 'Hotel Solar' },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[EMAIL] Failed to send email:', error);
      return false;
    }

    console.log('[EMAIL] Email sent successfully to:', params.to.map(t => t.email).join(', '));
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
}

/**
 * Generate HTML template for customer confirmation email
 */
function generateCustomerEmailHTML(reservation: Reservation): string {
  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const roomsList = reservation.rooms.map(room => 
    `<li><strong>${room.name}</strong> - R$ ${room.priceSnapshot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>`
  ).join('');

  const extrasList = reservation.extras.length > 0 
    ? `<h3>Produtos Extras</h3><ul>${reservation.extras.map(extra => 
        `<li><strong>${extra.name}</strong> (${extra.quantity}x) - R$ ${(extra.priceSnapshot * extra.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>`
      ).join('')}</ul>`
    : '';

  const discountInfo = reservation.discountApplied 
    ? `<p><strong>Desconto Aplicado:</strong> ${reservation.discountApplied.code} (-R$ ${reservation.discountApplied.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0F2820; color: #D4AF37; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background-color: #f9f9f9; padding: 30px; }
    .section { margin-bottom: 25px; }
    .section h2 { color: #0F2820; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
    .info-box { background-color: white; padding: 15px; border-left: 4px solid #D4AF37; margin: 10px 0; }
    .total { font-size: 24px; color: #0F2820; font-weight: bold; }
    .footer { background-color: #0F2820; color: white; padding: 20px; text-align: center; font-size: 12px; }
    ul { list-style: none; padding: 0; }
    li { padding: 8px 0; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Reserva Confirmada!</h1>
      <p>Hotel Solar - Sua experiência exclusiva começa aqui</p>
    </div>
    
    <div class="content">
      <div class="section">
        <h2>Olá, ${reservation.mainGuest.name}!</h2>
        <p>Sua reserva foi confirmada com sucesso! Estamos ansiosos para recebê-lo(a).</p>
      </div>

      <div class="section">
        <h2>📋 Detalhes da Reserva</h2>
        <div class="info-box">
          <p><strong>Código da Reserva:</strong> ${reservation.id}</p>
          <p><strong>Check-in:</strong> ${checkInDate}</p>
          <p><strong>Check-out:</strong> ${checkOutDate}</p>
          <p><strong>Noites:</strong> ${reservation.nights}</p>
          <p><strong>Status:</strong> ${reservation.status === 'CONFIRMED' ? 'Confirmada' : 'Pendente'}</p>
        </div>
      </div>

      <div class="section">
        <h2>🏨 Acomodações</h2>
        <ul>${roomsList}</ul>
      </div>

      ${extrasList}

      <div class="section">
        <h2>💰 Resumo Financeiro</h2>
        ${discountInfo}
        <div class="info-box">
          <p class="total">Total: R$ ${reservation.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Forma de Pagamento:</strong> ${reservation.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}</p>
        </div>
      </div>

      ${reservation.observations ? `
      <div class="section">
        <h2>📝 Observações</h2>
        <div class="info-box">
          <p>${reservation.observations}</p>
        </div>
      </div>
      ` : ''}

      <div class="section">
        <h2>📞 Contato</h2>
        <p>Em caso de dúvidas, entre em contato conosco:</p>
        <p>📧 E-mail: reservas@hotelsolar.com.br</p>
        <p>📱 WhatsApp: (XX) XXXXX-XXXX</p>
      </div>
    </div>

    <div class="footer">
      <p>Hotel Solar - Experiências Exclusivas</p>
      <p>Este é um e-mail automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate HTML template for admin notification email
 */
function generateAdminEmailHTML(reservation: Reservation): string {
  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');

  const roomsList = reservation.rooms.map(room => 
    `<li>${room.name} - R$ ${room.priceSnapshot.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>`
  ).join('');

  const extrasList = reservation.extras.length > 0 
    ? `<h3>Extras</h3><ul>${reservation.extras.map(extra => 
        `<li>${extra.name} (${extra.quantity}x) - R$ ${(extra.priceSnapshot * extra.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>`
      ).join('')}</ul>`
    : '';

  const guestsList = reservation.additionalGuests.length > 0
    ? `<h3>Hóspedes Adicionais</h3><ul>${reservation.additionalGuests.map(guest => 
        `<li>${guest.name} - CPF: ${guest.cpf}${guest.age ? ` - Idade: ${guest.age}` : ''}</li>`
      ).join('')}</ul>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background-color: #D4AF37; color: #0F2820; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; }
    .section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 5px; }
    .section h3 { color: #0F2820; margin-top: 0; }
    .highlight { background-color: #fff3cd; padding: 10px; border-left: 4px solid #D4AF37; }
    ul { list-style: none; padding: 0; }
    li { padding: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🔔 Nova Reserva Recebida!</h2>
    </div>
    
    <div class="content">
      <div class="section highlight">
        <p><strong>Código:</strong> ${reservation.id}</p>
        <p><strong>Data da Reserva:</strong> ${new Date(reservation.createdAt).toLocaleString('pt-BR')}</p>
        <p><strong>Status:</strong> ${reservation.status}</p>
      </div>

      <div class="section">
        <h3>👤 Hóspede Principal</h3>
        <p><strong>Nome:</strong> ${reservation.mainGuest.name}</p>
        <p><strong>CPF:</strong> ${reservation.mainGuest.cpf}</p>
        <p><strong>E-mail:</strong> ${reservation.mainGuest.email || 'Não informado'}</p>
        <p><strong>Telefone:</strong> ${reservation.mainGuest.phone || 'Não informado'}</p>
      </div>

      ${guestsList}

      <div class="section">
        <h3>📅 Período da Estadia</h3>
        <p><strong>Check-in:</strong> ${checkInDate}</p>
        <p><strong>Check-out:</strong> ${checkOutDate}</p>
        <p><strong>Noites:</strong> ${reservation.nights}</p>
      </div>

      <div class="section">
        <h3>🏨 Acomodações</h3>
        <ul>${roomsList}</ul>
      </div>

      ${extrasList}

      <div class="section">
        <h3>💰 Financeiro</h3>
        <p><strong>Total:</strong> R$ ${reservation.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p><strong>Pagamento:</strong> ${reservation.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}</p>
        ${reservation.discountApplied ? `<p><strong>Desconto:</strong> ${reservation.discountApplied.code} (-R$ ${reservation.discountApplied.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</p>` : ''}
      </div>

      ${reservation.observations ? `
      <div class="section">
        <h3>📝 Observações</h3>
        <p>${reservation.observations}</p>
      </div>
      ` : ''}

      <div class="section">
        <p style="text-align: center;">
          <a href="https://motor-de-reservas-hotel-solar.vercel.app/?view=admin&reservation=${reservation.id}" 
             style="background-color: #0F2820; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Ver Reserva no Sistema
          </a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send confirmation email to customer
 */
export async function sendCustomerConfirmationEmail(reservation: Reservation): Promise<boolean> {
  if (!reservation.mainGuest.email) {
    console.warn('[EMAIL] Customer email not provided, skipping confirmation email');
    return false;
  }

  return sendEmail({
    to: [{ email: reservation.mainGuest.email, name: reservation.mainGuest.name }],
    subject: `✨ Reserva Confirmada - Hotel Solar #${reservation.id}`,
    htmlContent: generateCustomerEmailHTML(reservation),
  });
}

/**
 * Send notification email to admin
 */
export async function sendAdminNotificationEmail(reservation: Reservation): Promise<boolean> {
  return sendEmail({
    to: [{ email: ADMIN_EMAIL, name: 'Administração Hotel Solar' }],
    subject: `🔔 Nova Reserva #${reservation.id} - ${reservation.mainGuest.name}`,
    htmlContent: generateAdminEmailHTML(reservation),
  });
}
