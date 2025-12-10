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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #2F3A2F, #1a221a)' }}>
      {/* Header */}
      <nav style={{
        backgroundColor: '#0F2820',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 0'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div 
              onClick={onBackToHome}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              <img 
                src="/hotel-solar-logo.png" 
                alt="Hotel Solar" 
                style={{ 
                  height: '64px',
                  width: 'auto',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px'
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
          <h1 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: 'bold' }}>
            Reserva efetuada
          </h1>
          
          <p style={{ fontSize: '18px', marginBottom: '30px', color: '#9ca3af' }}>
            Você receberá um email com os dados da sua reserva.
          </p>
          
          <div style={{
            backgroundColor: 'rgba(47, 58, 47, 0.5)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '8px' }}>
              Número da Reserva:
            </p>
            <p style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#D4AF37',
              fontFamily: 'monospace',
              letterSpacing: '2px',
              margin: 0
            }}>
              {reservationId.substring(0, 8).toUpperCase()}
            </p>
          </div>
          
          <p style={{ fontSize: '16px', marginBottom: '12px' }}>
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
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#B8941F';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#D4AF37';
            }}
          >
            ← Voltar para Página Inicial
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPageSimple;
