import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import type { Reservation } from '../types';

interface CancelReservationPageProps {
  reservationId: string;
  onClose: () => void;
}

export default function CancelReservationPage({ reservationId, onClose }: CancelReservationPageProps) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(0);

  useEffect(() => {
    loadReservation();
  }, [reservationId]);

  const loadReservation = async () => {
    try {
      const response = await fetch(`/api/reservations?id=${reservationId}`);
      if (!response.ok) throw new Error('Reserva não encontrada');
      
      const data = await response.json();
      const reservations = data.reservations || [];
      const found = reservations.find((r: Reservation) => r.id === reservationId);
      
      if (!found) throw new Error('Reserva não encontrada');
      if (found.status === 'CANCELADO') throw new Error('Esta reserva já foi cancelada');
      
      setReservation(found);
      calculateRefund(found.checkInDate);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar reserva');
      setLoading(false);
    }
  };

  const calculateRefund = (checkInDate: string) => {
    const today = new Date();
    const checkIn = new Date(checkInDate);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilCheckIn > 30) {
      setRefundPercentage(100);
    } else if (daysUntilCheckIn >= 15) {
      setRefundPercentage(50);
    } else if (daysUntilCheckIn >= 7) {
      setRefundPercentage(25);
    } else {
      setRefundPercentage(0);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Por favor, informe o motivo do cancelamento');
      return;
    }

    if (!acceptedTerms) {
      alert('Você precisa aceitar as condições de cancelamento');
      return;
    }

    setCanceling(true);

    try {
      const response = await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId,
          reason: cancelReason,
          refundPercentage
        })
      });

      if (!response.ok) throw new Error('Erro ao cancelar reserva');

      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar reserva');
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 text-center">
          <Loader className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-gray-700">Carregando reserva...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <XCircle className="text-red-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded transition"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-md text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancelamento Confirmado</h2>
          <p className="text-gray-700 mb-4">
            Sua reserva foi cancelada com sucesso.
          </p>
          {refundPercentage > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 font-bold">
                Reembolso de {refundPercentage}%
              </p>
              <p className="text-green-700 text-sm mt-1">
                O valor será devolvido conforme nossa política de cancelamento.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-600 mb-6">
            Você receberá um email de confirmação em breve.
          </p>
          <button
            onClick={onClose}
            className="bg-[#0F2820] hover:bg-[#16A34A] text-white font-bold py-2 px-6 rounded transition"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) return null;

  const canCancel = cancelReason.trim().length > 0 && acceptedTerms;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <div className="bg-[#0F2820] text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-serif font-bold">Cancelar Reserva</h2>
          <p className="text-sm text-gray-300 mt-1">Reserva #{reservation.id}</p>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Alerta de Atenção */}
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <p className="font-bold text-yellow-800">Atenção!</p>
              <p className="text-yellow-700 text-sm mt-1">
                O cancelamento é irreversível. Certifique-se de que deseja prosseguir.
              </p>
            </div>
          </div>

          {/* Dados da Reserva */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-3">Dados da Reserva</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Hóspede:</p>
                <p className="font-bold text-gray-900">{reservation.guestName}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-bold text-gray-900">{reservation.guestEmail}</p>
              </div>
              <div>
                <p className="text-gray-600">Check-in:</p>
                <p className="font-bold text-gray-900">
                  {new Date(reservation.checkInDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Check-out:</p>
                <p className="font-bold text-gray-900">
                  {new Date(reservation.checkOutDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Valor Total:</p>
                <p className="font-bold text-gray-900">
                  R$ {reservation.totalPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-bold text-green-600">{reservation.status}</p>
              </div>
            </div>
          </div>

          {/* Política de Reembolso */}
          <div className={`border rounded-lg p-4 ${
            refundPercentage > 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}>
            <h3 className="font-bold mb-2" style={{ color: refundPercentage > 0 ? '#16A34A' : '#DC2626' }}>
              Política de Reembolso
            </h3>
            <p className="text-sm mb-2" style={{ color: refundPercentage > 0 ? '#15803D' : '#B91C1C' }}>
              {refundPercentage > 0 ? (
                <>
                  Você tem direito a <strong>{refundPercentage}% de reembolso</strong> do valor pago.
                  <br />
                  Valor do reembolso: <strong>R$ {(reservation.totalPrice * refundPercentage / 100).toFixed(2)}</strong>
                </>
              ) : (
                <>
                  <strong>Sem direito a reembolso.</strong>
                  <br />
                  Cancelamentos com menos de 7 dias de antecedência não são reembolsáveis.
                </>
              )}
            </p>
          </div>

          {/* Motivo do Cancelamento */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Motivo do Cancelamento *
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Por favor, informe o motivo do cancelamento..."
              className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-[#16A34A] focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Este campo é obrigatório e nos ajuda a melhorar nossos serviços.
            </p>
          </div>

          {/* Aceite das Condições */}
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-[#16A34A] border-gray-300 rounded focus:ring-[#16A34A]"
              />
              <span className="text-sm text-gray-700">
                <strong>Li e aceito as condições de cancelamento.</strong>
                <br />
                Estou ciente de que o reembolso será de {refundPercentage}% do valor pago
                {refundPercentage > 0 ? ' e será processado conforme a política do hotel' : ' (sem reembolso)'}.
                <br />
                Entendo que esta ação é irreversível.
              </span>
            </label>
          </div>

        </div>

        {/* Botões de Ação */}
        <div className="bg-gray-50 p-6 rounded-b-lg flex gap-3">
          <button
            onClick={onClose}
            disabled={canceling}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded transition"
          >
            Voltar
          </button>
          <button
            onClick={handleCancel}
            disabled={!canCancel || canceling}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded transition flex items-center justify-center gap-2"
          >
            {canceling ? (
              <>
                <Loader className="animate-spin" size={20} />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelamento'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
