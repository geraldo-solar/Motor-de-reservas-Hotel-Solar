import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function GerenciarReserva() {
  const router = useRouter();
  const { id } = router.query;
  
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('detalhes');

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/reservations?action=get&id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReservation(data.reservation);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciar Reserva</h1>
          <p className="text-gray-600 mt-1">Número: <span className="font-mono font-bold text-[#D4AF37]">{reservationNumber}</span></p>
        </div>

        <div className="bg-white rounded-lg shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['detalhes', 'editar', 'cancelar', 'regulamento'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === tab
                      ? 'border-[#D4AF37] text-[#2F3A2F]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'detalhes' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Detalhes da Reserva</h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p><strong>Check-in:</strong> {new Date(reservation.checkIn).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Check-out:</strong> {new Date(reservation.checkOut).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Total:</strong> R$ {reservation.totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'editar' && (
              <div>
                <p className="text-gray-600">Funcionalidade de edição em desenvolvimento.</p>
              </div>
            )}

            {activeTab === 'cancelar' && (
              <div>
                <p className="text-red-600 font-semibold">Atenção: O cancelamento é irreversível.</p>
              </div>
            )}

            {activeTab === 'regulamento' && (
              <div className="prose max-w-none">
                <h2>Regulamento de Hospedagem</h2>
                <p>Check-in: 14h | Check-out: 12h</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 font-semibold"
          >
            ← Voltar para o Início
          </button>
        </div>
      </div>
    </div>
  );
}
