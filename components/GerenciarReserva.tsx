import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function GerenciarReserva() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('detalhes');
  
  // Edit states
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editGuests, setEditGuests] = useState<Array<{name: string; cpf?: string; age?: number}>>([]);
  const [saving, setSaving] = useState(false);
  
  // Cancel states
  const [cancelReason, setCancelReason] = useState('');
  const [cancelAccepted, setCancelAccepted] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState(0);

  useEffect(() => {
    if (!id) {
      setError('ID de reserva não fornecido');
      setLoading(false);
      return;
    }
    
    fetch(`/api/reservations?action=get&id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReservation(data.reservation);
          setEditCheckIn(data.reservation.checkIn.split('T')[0]);
          setEditCheckOut(data.reservation.checkOut.split('T')[0]);
          setEditGuests(data.reservation.additionalGuests || []);
          
          // Calculate refund
          const checkInDate = new Date(data.reservation.checkIn);
          const today = new Date();
          const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          let refund = 0;
          if (daysUntilCheckIn > 30) refund = 100;
          else if (daysUntilCheckIn > 15) refund = 50;
          else if (daysUntilCheckIn > 7) refund = 25;
          setRefundPercentage(refund);
        } else {
          setError('Reserva não encontrada');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar reserva');
        setLoading(false);
      });
  }, [id]);

  const handleSaveChanges = async () => {
    if (!reservation) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/reservations?action=update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          checkIn: editCheckIn,
          checkOut: editCheckOut,
          additionalGuests: editGuests,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('Alterações salvas com sucesso!');
        window.location.reload();
      } else {
        alert(data.error || 'Erro ao salvar alterações');
      }
    } catch (err) {
      alert('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation || !cancelAccepted) return;
    
    setCanceling(true);
    try {
      const response = await fetch('/api/reservations?action=cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          reason: cancelReason || 'Não informado',
          refundPercentage,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCancelSuccess(true);
        setTimeout(() => navigate('/'), 10000);
      } else {
        alert('Erro ao cancelar reserva');
      }
    } catch (err) {
      alert('Erro ao cancelar reserva');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F3A2F] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reserva Não Encontrada</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-[#2F3A2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#1a221a] transition"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  if (cancelSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">✓</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Cancelamento Confirmado</h1>
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Número da Reserva</p>
            <p className="text-2xl font-mono font-bold text-[#D4AF37]">
              {reservation.id.toUpperCase().substring(0, 8)}
            </p>
          </div>
          {refundPercentage > 0 ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-left mb-6">
              <p className="text-blue-900 font-semibold mb-2">💰 Reembolso</p>
              <p className="text-blue-700">
                Você receberá <strong>{refundPercentage}%</strong> do valor pago (R$ {(reservation.totalPrice * refundPercentage / 100).toFixed(2)}).
              </p>
              <p className="text-sm text-blue-600 mt-2">Processamento em até 10 dias úteis.</p>
            </div>
          ) : (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-left mb-6">
              <p className="text-red-900 font-semibold mb-2">⚠️ Sem Reembolso</p>
              <p className="text-red-700">Devido à proximidade da data, não haverá reembolso.</p>
            </div>
          )}
          <p className="text-gray-600 mb-6">Redirecionando em 10 segundos...</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#2F3A2F] text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#1a221a] transition"
          >
            Voltar para o Início
          </button>
        </div>
      </div>
    );
  }

  const reservationNumber = reservation.id.toUpperCase().substring(0, 8);
  const checkInDate = new Date(reservation.checkIn).toLocaleDateString('pt-BR');
  const checkOutDate = new Date(reservation.checkOut).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Reserva</h1>
          <p className="text-gray-600 mt-1">Número: <span className="font-mono font-bold text-[#D4AF37]">{reservationNumber}</span></p>
          {reservation.status === 'CANCELLED' && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-800 font-semibold">Esta reserva foi cancelada.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'detalhes', label: '📋 Detalhes' },
                ...(reservation.status !== 'CANCELLED' ? [
                  { id: 'editar', label: '✏️ Editar' },
                  { id: 'cancelar', label: '❌ Cancelar' }
                ] : []),
                { id: 'regulamento', label: '📜 Regulamento' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#D4AF37] text-[#2F3A2F]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'detalhes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">👤 Hóspede Principal</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Nome:</strong> {reservation.mainGuest.name}</p>
                    <p><strong>CPF:</strong> {reservation.mainGuest.cpf}</p>
                    <p><strong>Email:</strong> {reservation.mainGuest.email}</p>
                    <p><strong>Telefone:</strong> {reservation.mainGuest.phone}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">📅 Estadia</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Check-in:</strong> {checkInDate}</p>
                    <p><strong>Check-out:</strong> {checkOutDate}</p>
                    <p><strong>Noites:</strong> {reservation.nights}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">🛏️ Acomodações</h2>
                  <div className="space-y-3">
                    {reservation.rooms.map((room: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between">
                        <div>
                          <p className="font-semibold">{room.name}</p>
                          <p className="text-sm text-gray-600">Quantidade: {room.quantity}</p>
                        </div>
                        <p className="font-bold text-[#D4AF37]">R$ {room.priceSnapshot.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {reservation.additionalGuests && reservation.additionalGuests.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">👥 Acompanhantes</h2>
                    <div className="space-y-2">
                      {reservation.additionalGuests.map((guest: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-semibold">{guest.name}</p>
                          {guest.cpf && <p className="text-sm text-gray-600">CPF: {guest.cpf}</p>}
                          {guest.age && <p className="text-sm text-gray-600">Idade: {guest.age} anos</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reservation.extras && reservation.extras.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">🎁 Serviços Extras</h2>
                    <div className="space-y-3">
                      {reservation.extras.map((extra: any, index: number) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 flex justify-between">
                          <div>
                            <p className="font-semibold">{extra.name}</p>
                            <p className="text-sm text-gray-600">Quantidade: {extra.quantity}</p>
                          </div>
                          <p className="font-bold text-[#D4AF37]">
                            R$ {(extra.priceSnapshot * extra.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reservation.observations && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">📝 Observações</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{reservation.observations}</p>
                    </div>
                  </div>
                )}

                <div className="border-t-2 border-[#D4AF37] pt-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xl font-bold">Valor Total:</p>
                    <p className="text-3xl font-bold text-[#D4AF37]">R$ {reservation.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editar' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-800">
                    <strong>ℹ️ Atenção:</strong> Alterações estão sujeitas à disponibilidade e podem resultar em ajuste de valores.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">📅 Alterar Datas</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                      <input
                        type="date"
                        value={editCheckIn}
                        onChange={(e) => setEditCheckIn(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                      <input
                        type="date"
                        value={editCheckOut}
                        onChange={(e) => setEditCheckOut(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">👥 Editar Acompanhantes</h2>
                  <div className="space-y-4">
                    {editGuests.map((guest, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                            <input
                              type="text"
                              value={guest.name}
                              onChange={(e) => {
                                const newGuests = [...editGuests];
                                newGuests[index].name = e.target.value;
                                setEditGuests(newGuests);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">CPF (opcional)</label>
                            <input
                              type="text"
                              value={guest.cpf || ''}
                              onChange={(e) => {
                                const newGuests = [...editGuests];
                                newGuests[index].cpf = e.target.value;
                                setEditGuests(newGuests);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Idade (opcional)</label>
                            <input
                              type="number"
                              value={guest.age || ''}
                              onChange={(e) => {
                                const newGuests = [...editGuests];
                                newGuests[index].age = parseInt(e.target.value) || undefined;
                                setEditGuests(newGuests);
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="w-full bg-[#16A34A] text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#15803D] transition disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : '💾 Salvar Alterações'}
                </button>
              </div>
            )}

            {activeTab === 'cancelar' && (
              <div className="space-y-6">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-800 font-semibold mb-2">⚠️ Atenção</p>
                  <p className="text-red-700">O cancelamento é irreversível.</p>
                </div>

                <div>
                  <h2 className="text-xl font-bold mb-4">💰 Política de Reembolso</h2>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between pb-2 border-b">
                      <span>Mais de 30 dias</span>
                      <span className="font-bold text-green-600">100%</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span>15 a 30 dias</span>
                      <span className="font-bold text-yellow-600">50%</span>
                    </div>
                    <div className="flex justify-between pb-2 border-b">
                      <span>7 a 15 dias</span>
                      <span className="font-bold text-orange-600">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Menos de 7 dias</span>
                      <span className="font-bold text-red-600">0%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-blue-900 font-semibold mb-2">Seu Reembolso</p>
                  <p className="text-blue-800">
                    Você receberá <strong>{refundPercentage}%</strong> do valor total.
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">
                    R$ {(reservation.totalPrice * refundPercentage / 100).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo do Cancelamento (opcional)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="Conte-nos o motivo..."
                  />
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="cancel-accept"
                    checked={cancelAccepted}
                    onChange={(e) => setCancelAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-[#2F3A2F] focus:ring-[#D4AF37] border-gray-300 rounded"
                  />
                  <label htmlFor="cancel-accept" className="ml-3 text-sm text-gray-700">
                    Confirmo que aceito a política de cancelamento e estou ciente de que esta ação é irreversível.
                  </label>
                </div>

                <button
                  onClick={handleCancelReservation}
                  disabled={!cancelAccepted || canceling}
                  className="w-full bg-[#EF4444] text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#DC2626] transition disabled:opacity-50"
                >
                  {canceling ? 'Cancelando...' : '❌ Confirmar Cancelamento'}
                </button>
              </div>
            )}

            {activeTab === 'regulamento' && (
              <div className="space-y-6 prose prose-sm max-w-none">
                <h2 className="text-2xl font-bold text-gray-900">📜 Regulamento de Hospedagem</h2>
                
                <section>
                  <h3 className="text-lg font-bold">1. Check-in e Check-out</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Check-in: a partir das 14h</li>
                    <li>Check-out: até as 12h</li>
                    <li>Check-out tardio sujeito à disponibilidade</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold">2. Política de Cancelamento</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Mais de 30 dias: 100% de reembolso</li>
                    <li>15 a 30 dias: 50% de reembolso</li>
                    <li>7 a 15 dias: 25% de reembolso</li>
                    <li>Menos de 7 dias: sem reembolso</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold">3. Normas de Convivência</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Respeitar o silêncio após as 22h</li>
                    <li>Proibido fumar nas acomodações</li>
                    <li>Danos serão cobrados</li>
                    <li>Visitantes devem ser autorizados</li>
                  </ul>
                </section>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
                  <p className="text-yellow-800">
                    <strong>📞 Dúvidas?</strong> Entre em contato: {' '}
                    <a href="mailto:reserva@hotelsolar.tur.br" className="font-bold underline">
                      reserva@hotelsolar.tur.br
                    </a> ou <strong>(91) 98100-0800</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            ← Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
}
