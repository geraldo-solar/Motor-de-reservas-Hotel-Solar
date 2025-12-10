import React from 'react';

interface ThankYouPageProps {
  reservationId: string;
  guestEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  onBackToHome: () => void;
}

const ThankYouPageSimple: React.FC<ThankYouPageProps> = ({ 
  reservationId, 
  guestEmail, 
  paymentMethod,
  onBackToHome 
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #2F3A2F, #1a221a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '40px',
        textAlign: 'center',
        color: '#E5D3B3'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>
          ✅ Reserva Confirmada!
        </h1>
        
        <p style={{ fontSize: '18px', marginBottom: '20px' }}>
          Número da Reserva: <strong>{reservationId.substring(0, 8).toUpperCase()}</strong>
        </p>
        
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Email: <strong>{guestEmail}</strong>
        </p>
        
        <p style={{ fontSize: '16px', marginBottom: '30px' }}>
          Forma de Pagamento: <strong>{paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</strong>
        </p>
        
        <button
          onClick={onBackToHome}
          style={{
            backgroundColor: '#D4AF37',
            color: '#2F3A2F',
            padding: '15px 30px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          ← Voltar para Página Inicial
        </button>
      </div>
    </div>
  );
};

export default ThankYouPageSimple;
