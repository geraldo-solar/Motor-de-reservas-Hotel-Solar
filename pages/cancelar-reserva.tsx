import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Reservation } from '../types';

export default function CancelarReserva() {
  const router = useRouter();
  const { id } = router.query;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReservation();
    }
  }, [id]);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reservations?action=get&id=${id}`);
      
      if (!response.ok) {
        throw new Error('Reserva não encontrada');
      }

      const data = await response.json();
      
      if (data.reservation.status === 'CANCELLED') {
        setError('Esta reserva já foi cancelada');
      }
      
      setReservation(data.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reserva');
    } finally {
      setLoading(false);
    }
  };

  const calculateRefundPercentage = () => {
    if (!reservation) return 0;

    const checkInDate = new Date(reservation.checkIn);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilCheckIn > 30) return 100;
    if (daysUntilCheckIn > 15) return 50;
    if (daysUntilCheckIn > 7) return 25;
    return 0;
  };

  const handleCancelReservation = async () => {
    if (!reservation || !acceptedTerms) return;

    try {
      setCancelling(true);
      const refundPercentage = calculateRefundPercentage();

      const response = await fetch('/api/reservations?action=cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          reason: reason || 'Cliente solicitou cancelamento',
          refundPercentage,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar reserva');
      }

      // Redirect to confirmation page
      router.push(`/cancelamento-confirmado?id=${reservation.id}&refund=${refundPercentage}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar reserva');
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F3A2F] mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando reserva...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {reservation?.status === 'CANCELLED' ? 'Reserva Já Cancelada' : 'Erro'}
          </h1>
          <p className="text-gray-600 mb-6">{error || 'Não foi possível processar sua solicitação.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-[#2F3A2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a221a] transition"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);
  const refundPercentage = calculateRefundPercentage();
  const refundAmount = (reservation.totalPrice * refundPercentage) / 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Warning Header */}
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-3xl mr-3">⚠️</span>
            <h1 className="text-2xl font-bold text-red-900">Cancelar Reserva</h1>
          </div>
          <p className="text-red-700">
            Você está prestes a cancelar sua reserva. Esta ação não pode ser desfeita.
          </p>
        </div>

        {/* Reservation Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">📋 Detalhes da Reserva</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Número da Reserva:</span>
              <span className="font-mono font-bold text-[#D4AF37]">{reservationNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hóspede:</span>
              <span className="font-semibold">{reservation.mainGuest.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-in:</span>
              <span className="font-semibold">{formatDate(reservation.checkIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Check-out:</span>
              <span className="font-semibold">{formatDate(reservation.checkOut)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-gray-600">Valor Total:</span>
              <span className="font-bold text-lg">R$ {reservation.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Refund Policy */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">💰 Política de Reembolso</h2>
          
          <div className="mb-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-900 font-semibold mb-2">Seu Reembolso:</p>
              <p className="text-3xl font-bold text-blue-600">{refundPercentage}%</p>
              <p className="text-blue-700 mt-1">
                Valor a receber: <span className="font-bold">R$ {refundAmount.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              <p><strong>Mais de 30 dias antes:</strong> Reembolso de 100%</p>
            </div>
            <div className="flex items-start">
              <span className="text-yellow-500 mr-2">✓</span>
              <p><strong>15 a 30 dias antes:</strong> Reembolso de 50%</p>
            </div>
            <div className="flex items-start">
              <span className="text-orange-500 mr-2">✓</span>
              <p><strong>7 a 15 dias antes:</strong> Reembolso de 25%</p>
            </div>
            <div className="flex items-start">
              <span className="text-red-500 mr-2">✗</span>
              <p><strong>Menos de 7 dias:</strong> Sem reembolso</p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>⏱️ Prazo:</strong> O reembolso será processado em até 10 dias úteis após o cancelamento.
            </p>
          </div>
        </div>

        {/* Cancellation Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">📝 Motivo do Cancelamento</h2>
          
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Por favor, nos conte o motivo do cancelamento (opcional)"
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F3A2F] focus:border-transparent resize-none"
            rows={4}
          />

          <div className="mt-4">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 mr-3 h-5 w-5 text-[#2F3A2F] focus:ring-[#2F3A2F] border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Eu li e concordo com a política de cancelamento e entendo que receberei {refundPercentage}% de reembolso (R$ {refundAmount.toFixed(2)}).
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-3">
            <button
              onClick={handleCancelReservation}
              disabled={!acceptedTerms || cancelling}
              className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition ${
                acceptedTerms && !cancelling
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {cancelling ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  Processando Cancelamento...
                </>
              ) : (
                <>❌ Confirmar Cancelamento</>
              )}
            </button>

            <button
              onClick={() => router.push(`/gerenciar-reserva?id=${reservation.id}`)}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              ← Voltar para Gerenciar Reserva
            </button>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Mudou de ideia? Entre em contato conosco!</p>
              <p className="text-sm">
                <a href="mailto:reserva@hotelsolar.tur.br" className="text-[#16A34A] font-semibold hover:underline">reserva@hotelsolar.tur.br</a>
                {' • '}
                <a href="https://wa.me/5591981000800" className="text-[#16A34A] font-semibold hover:underline">(91) 98100-0800</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
