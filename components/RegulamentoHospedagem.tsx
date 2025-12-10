import React from 'react';
import { X } from 'lucide-react';

interface RegulamentoHospedagemProps {
  onClose: () => void;
}

export default function RegulamentoHospedagem({ onClose }: RegulamentoHospedagemProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-lg">
          <h2 className="text-2xl font-serif font-bold text-[#0F2820]">
            Regulamento de Hospedagem e Cancelamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Seção 1: Check-in e Check-out */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">1. Check-in e Check-out</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Check-in:</strong> A partir das 14h00</li>
              <li><strong>Check-out:</strong> Até às 12h00</li>
              <li>Check-in antecipado ou check-out tardio estão sujeitos à disponibilidade e podem ter custo adicional</li>
              <li>É obrigatória a apresentação de documento de identidade com foto no check-in</li>
              <li>Menores de 18 anos devem estar acompanhados de responsável legal</li>
            </ul>
          </section>

          {/* Seção 2: Reservas e Pagamento */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">2. Reservas e Pagamento</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>A reserva é confirmada mediante pagamento ou envio de comprovante</li>
              <li>Pagamentos via PIX: enviar comprovante para reserva@hotelsolar.tur.br</li>
              <li>Pagamentos via cartão: processados em até 48 horas úteis</li>
              <li>Valores e disponibilidade estão sujeitos a alterações sem aviso prévio</li>
              <li>Descontos e promoções não são cumulativos, salvo indicação contrária</li>
            </ul>
          </section>

          {/* Seção 3: Política de Cancelamento */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3 text-red-700">
              3. Política de Cancelamento
            </h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="font-bold text-red-800 mb-2">IMPORTANTE: Leia atentamente</p>
              <p className="text-red-700">
                O cancelamento de reservas está sujeito às condições abaixo. 
                Ao confirmar sua reserva, você concorda com estas condições.
              </p>
            </div>
            
            <h4 className="font-bold text-[#0F2820] mt-4 mb-2">3.1. Cancelamento com Reembolso</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Mais de 30 dias antes do check-in:</strong> Reembolso de 100% do valor pago</li>
              <li><strong>Entre 15 e 30 dias antes:</strong> Reembolso de 50% do valor pago</li>
              <li><strong>Entre 7 e 14 dias antes:</strong> Reembolso de 25% do valor pago</li>
            </ul>

            <h4 className="font-bold text-[#0F2820] mt-4 mb-2">3.2. Cancelamento sem Reembolso</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
              <li><strong>Menos de 7 dias antes do check-in:</strong> Sem reembolso</li>
              <li><strong>No-show (não comparecimento):</strong> Sem reembolso</li>
              <li><strong>Check-out antecipado:</strong> Sem reembolso das diárias não utilizadas</li>
            </ul>

            <h4 className="font-bold text-[#0F2820] mt-4 mb-2">3.3. Prazo de Reembolso</h4>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Pagamentos via PIX: até 5 dias úteis</li>
              <li>Pagamentos via cartão: até 2 faturas (conforme operadora)</li>
              <li>O reembolso será feito na mesma forma de pagamento utilizada</li>
            </ul>
          </section>

          {/* Seção 4: Normas de Conduta */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">4. Normas de Conduta</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>É proibido fumar nas acomodações (áreas externas designadas disponíveis)</li>
              <li>Animais de estimação não são permitidos, salvo acordo prévio</li>
              <li>Respeite o silêncio entre 22h e 8h</li>
              <li>Visitantes devem ser registrados na recepção</li>
              <li>O hóspede é responsável por danos causados às instalações</li>
              <li>Comportamento inadequado pode resultar em expulsão sem reembolso</li>
            </ul>
          </section>

          {/* Seção 5: Responsabilidades */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">5. Responsabilidades</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>O hotel não se responsabiliza por objetos de valor deixados nas acomodações</li>
              <li>Utilize o cofre disponível para guardar pertences valiosos</li>
              <li>Comunique imediatamente qualquer dano ou problema encontrado</li>
              <li>O hotel não se responsabiliza por interrupções de serviços públicos (energia, água, internet)</li>
            </ul>
          </section>

          {/* Seção 6: Serviços e Comodidades */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">6. Serviços e Comodidades</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Wi-Fi gratuito em todas as áreas</li>
              <li>Piscina disponível das 8h às 20h</li>
              <li>Café da manhã servido das 7h às 10h (se incluído na tarifa)</li>
              <li>Serviços extras podem ser contratados na recepção</li>
            </ul>
          </section>

          {/* Seção 7: Força Maior */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">7. Casos de Força Maior</h3>
            <p className="text-gray-700 mb-2">
              Em casos de força maior (desastres naturais, pandemias, greves, etc.), o hotel se reserva o direito de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Cancelar reservas com reembolso integral</li>
              <li>Realocar hóspedes para acomodações equivalentes</li>
              <li>Suspender temporariamente serviços sem compensação</li>
            </ul>
          </section>

          {/* Seção 8: Alterações no Regulamento */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">8. Alterações no Regulamento</h3>
            <p className="text-gray-700">
              O Hotel Solar se reserva o direito de alterar este regulamento a qualquer momento. 
              As alterações entram em vigor imediatamente após publicação no site. 
              Reservas confirmadas antes da alteração mantêm as condições originais.
            </p>
          </section>

          {/* Seção 9: Contato */}
          <section>
            <h3 className="text-xl font-bold text-[#0F2820] mb-3">9. Contato</h3>
            <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-lg p-4">
              <p className="text-gray-700 mb-2">
                <strong>Dúvidas sobre o regulamento?</strong>
              </p>
              <p className="text-gray-700">
                📧 Email: <a href="mailto:reserva@hotelsolar.tur.br" className="text-[#16A34A] font-bold">reserva@hotelsolar.tur.br</a><br />
                📞 Telefone: <strong>(91) 98100-0800</strong><br />
                📍 Endereço: Av. Atlântica, CEP 68721-000, Salinópolis - PA
              </p>
            </div>
          </section>

          {/* Data de Vigência */}
          <section className="border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-500 text-center">
              Regulamento vigente a partir de 10 de dezembro de 2025<br />
              Última atualização: 10/12/2025
            </p>
          </section>

        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full bg-[#0F2820] hover:bg-[#16A34A] text-white font-bold py-3 px-6 rounded transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
