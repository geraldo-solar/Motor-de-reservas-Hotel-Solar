import React from 'react';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

interface ThankYouPageProps {
  reservationId: string;
  guestEmail: string;
  paymentMethod: 'pix' | 'credit_card';
  onBackToHome: () => void;
}

const ThankYouPage: React.FC<ThankYouPageProps> = ({ 
  reservationId, 
  guestEmail, 
  paymentMethod,
  onBackToHome 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2F3A2F] to-[#1a221a]">
      {/* Header */}
      <nav className="bg-solar-green shadow-lg border-b border-white/10 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center cursor-pointer mb-3 md:mb-4 group" onClick={onBackToHome}>
              <img 
                src="/hotel-solar-logo.png" 
                alt="Hotel Solar" 
                className="h-16 md:h-20 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <div className="flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#E5D3B3] mb-2">
            Reserva efetuada
          </h1>
          <p className="text-lg text-gray-300">
            Você receberá um email com os dados da sua reserva.
          </p>
        </div>

        {/* Reservation Details Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 mb-6 border border-[#D4AF37]/30">
          <div className="flex items-start gap-3 mb-6">
            <Mail className="w-6 h-6 text-[#D4AF37] flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold text-[#E5D3B3] mb-2">
                Email de Confirmação Enviado
              </h2>
              <p className="text-gray-300 mb-4">
                Enviamos um email para <span className="font-semibold text-[#D4AF37]">{guestEmail}</span> com os detalhes da sua reserva.
              </p>
            </div>
          </div>

          {/* Reservation Number */}
          <div className="bg-[#2F3A2F]/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-1">Número da Reserva:</p>
            <p className="text-2xl font-bold text-[#D4AF37] font-mono tracking-wider">
              {reservationId.toUpperCase().substring(0, 8)}
            </p>
          </div>

          {/* Payment Instructions */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-[#E5D3B3] mb-3">
              Próximos Passos:
            </h3>
            
            {paymentMethod === 'pix' ? (
              <div className="space-y-3 text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">1.</span>
                  <span>Realize o pagamento via PIX conforme as instruções enviadas no email</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">2.</span>
                  <span>
                    Envie o comprovante de pagamento para:{' '}
                    <a 
                      href="mailto:reserva@hotelsolar.tur.br" 
                      className="text-[#D4AF37] hover:underline font-semibold"
                    >
                      reserva@hotelsolar.tur.br
                    </a>
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">3.</span>
                  <span>Após recebermos o comprovante, enviaremos um email de confirmação da reserva</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">1.</span>
                  <span>Estamos processando o pagamento no cartão informado</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">2.</span>
                  <span>Você receberá um email com a confirmação do pagamento em breve</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#D4AF37] font-bold flex-shrink-0">3.</span>
                  <span>Após a aprovação, enviaremos a confirmação final da reserva</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            <strong>Importante:</strong> Verifique sua caixa de spam caso não encontre nosso email. 
            Para qualquer dúvida, entre em contato conosco através do email{' '}
            <a href="mailto:reserva@hotelsolar.tur.br" className="underline font-semibold">
              reserva@hotelsolar.tur.br
            </a>
            {' '}ou pelo telefone (91) 98100-0800.
          </p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBackToHome}
          className="w-full bg-[#D4AF37] hover:bg-[#B8941F] text-[#2F3A2F] font-semibold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Página Inicial
        </button>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>Hotel Solar</p>
          <p>Av. Atlântica • CEP 68721-000 • Salinópolis - PA</p>
          <p>Tel: (91) 98100-0800</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
