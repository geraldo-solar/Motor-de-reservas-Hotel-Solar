import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function CancelamentoConfirmado() {
  const router = useRouter();
  const { id, refund } = router.query;
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const reservationNumber = id ? String(id).toUpperCase().substring(0, 8) : '';
  const refundPercentage = refund ? parseInt(String(refund)) : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full text-center">
        {/* Success Icon */}
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">✓</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Cancelamento Confirmado
        </h1>

        {/* Reservation Number */}
        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Número da Reserva</p>
          <p className="text-2xl font-mono font-bold text-[#D4AF37]">{reservationNumber}</p>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-lg text-gray-700 mb-4">
            Sua reserva foi cancelada com sucesso.
          </p>

          {refundPercentage > 0 ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-left">
              <p className="text-blue-900 font-semibold mb-2">💰 Reembolso</p>
              <p className="text-blue-700">
                Você receberá <strong>{refundPercentage}%</strong> do valor pago de volta.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                O reembolso será processado em até <strong>10 dias úteis</strong> e será creditado na mesma forma de pagamento utilizada na reserva.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-left">
              <p className="text-red-900 font-semibold mb-2">⚠️ Sem Reembolso</p>
              <p className="text-red-700">
                Infelizmente, devido à proximidade da data de check-in, não será possível realizar o reembolso.
              </p>
              <p className="text-sm text-red-600 mt-2">
                Conforme nossa política de cancelamento, cancelamentos com menos de 7 dias de antecedência não são elegíveis para reembolso.
              </p>
            </div>
          )}
        </div>

        {/* Email Notification */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>📧 Email Enviado:</strong> Você receberá um email de confirmação do cancelamento em breve.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#2F3A2F] text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#1a221a] transition"
          >
            Voltar para o Início
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#16A34A] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#15803D] transition"
          >
            Fazer Nova Reserva
          </button>
        </div>

        {/* Auto Redirect */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Você será redirecionado automaticamente em <strong>{countdown}</strong> segundos...
          </p>
        </div>

        {/* Contact */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Dúvidas sobre o cancelamento?</p>
          <p className="text-sm">
            <a href="mailto:reserva@hotelsolar.tur.br" className="text-[#16A34A] font-semibold hover:underline">reserva@hotelsolar.tur.br</a>
            {' • '}
            <a href="https://wa.me/5591981000800" className="text-[#16A34A] font-semibold hover:underline">(91) 98100-0800</a>
          </p>
        </div>
      </div>
    </div>
  );
}
