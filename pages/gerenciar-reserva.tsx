import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Reservation } from '../types';

export default function GerenciarReserva() {
  const router = useRouter();
  const { id } = router.query;
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      setReservation(data.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar reserva');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva Não Encontrada</h1>
          <p className="text-gray-600 mb-6">{error || 'Não foi possível encontrar esta reserva.'}</p>
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
  const canCancel = reservation.status !== 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#2F3A2F] mb-2">Minha Reserva</h1>
              <p className="text-gray-600">Número da Reserva: <span className="font-mono font-bold text-[#D4AF37]">{reservationNumber}</span></p>
            </div>
            {getStatusBadge(reservation.status)}
          </div>
        </div>

        {/* Guest Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">👤 Dados do Hóspede</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-semibold">{reservation.mainGuest.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPF</p>
              <p className="font-semibold">{reservation.mainGuest.cpf}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">E-mail</p>
              <p className="font-semibold">{reservation.mainGuest.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-semibold">{reservation.mainGuest.phone}</p>
            </div>
          </div>
        </div>

        {/* Stay Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">📅 Detalhes da Estadia</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Check-in</p>
              <p className="font-semibold text-lg">{formatDate(reservation.checkIn)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Check-out</p>
              <p className="font-semibold text-lg">{formatDate(reservation.checkOut)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Noites</p>
              <p className="font-semibold text-lg">{reservation.nights}</p>
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">🛏️ Acomodações</h2>
          <div className="space-y-3">
            {reservation.rooms.map((room, index) => (
              <div key={index} className="border-l-4 border-[#D4AF37] bg-gray-50 p-4 rounded">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg">{room.name}</p>
                  <p className="text-[#D4AF37] font-bold">R$ {room.priceSnapshot.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extras */}
        {reservation.extras && reservation.extras.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">🎁 Serviços Extras</h2>
            <div className="space-y-3">
              {reservation.extras.map((extra, index) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <div>
                    <p className="font-semibold">{extra.name}</p>
                    <p className="text-sm text-gray-500">Quantidade: {extra.quantity}</p>
                  </div>
                  <p className="text-[#D4AF37] font-bold">R$ {(extra.priceSnapshot * extra.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">💰 Pagamento</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-gray-600">Forma de Pagamento</p>
              <p className="font-semibold">{reservation.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}</p>
            </div>
            {reservation.discountApplied && (
              <div className="flex justify-between items-center text-green-600">
                <p>Desconto ({reservation.discountApplied.code})</p>
                <p className="font-semibold">- R$ {reservation.discountApplied.amount.toFixed(2)}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t-2 border-[#D4AF37]">
              <p className="text-xl font-bold">Valor Total</p>
              <p className="text-2xl font-bold text-[#D4AF37]">R$ {reservation.totalPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Observations */}
        {reservation.observations && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">📝 Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{reservation.observations}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#2F3A2F] mb-4">⚙️ Ações</h2>
          <div className="space-y-3">
            {canCancel && (
              <button
                onClick={() => router.push(`/cancelar-reserva?id=${reservation.id}`)}
                className="w-full bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition"
              >
                ❌ Cancelar Reserva
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              🏠 Voltar para o Início
            </button>
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Precisa de ajuda?</p>
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
