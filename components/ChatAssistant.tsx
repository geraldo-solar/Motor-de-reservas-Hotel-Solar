import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, User, Bot, Bell, ChevronDown } from 'lucide-react';
import { ChatMessage, Room, HolidayPackage, ViewState, ExtraService } from '../types';
import { sendMessageToAI } from '../services/geminiService';

interface ChatAssistantProps {
  rooms: Room[];
  packages: HolidayPackage[];
  extras: ExtraService[];
  currentView: ViewState;
  selectedRooms: Room[];
  checkIn: Date | null;
  checkOut: Date | null;
  hotelInfo: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ 
  rooms, 
  packages,
  extras,
  currentView,
  selectedRooms,
  checkIn,
  checkOut,
  hotelInfo
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou a Sol ☀️, sua assistente virtual. Estou aqui acompanhando sua visita. Se precisar de ajuda para encontrar o quarto perfeito ou um pacote especial, é só chamar!',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Track last triggered context to prevent spam
  const lastContextRef = useRef<{view: ViewState | null, roomId: string | null}>({ view: null, roomId: null });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Reset unread count when opened
  useEffect(() => {
    if (isOpen) setUnreadCount(0);
  }, [isOpen]);

  // --- PROACTIVE AI LOGIC ---
  useEffect(() => {
    const triggerProactiveMessage = (text: string) => {
        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            text: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
        if (!isOpen) {
            setUnreadCount(prev => prev + 1);
        }
    };

    // 1. User enters Booking View
    if (currentView === ViewState.BOOKING && lastContextRef.current.view !== ViewState.BOOKING) {
        if (selectedRooms.length > 0) {
            const names = selectedRooms.map(r => r.name).join(', ');
            triggerProactiveMessage(`Excelente escolha! ${names} ${selectedRooms.length > 1 ? 'são ótimas opções' : 'é uma ótima opção'}. Você tem algum cupom de desconto para usar?`);
        } else {
            triggerProactiveMessage("Para concluir sua reserva, não esqueça de selecionar as datas no calendário acima.");
        }
    }

    // 2. User Views Packages
    if (currentView === ViewState.PACKAGES && lastContextRef.current.view !== ViewState.PACKAGES) {
        triggerProactiveMessage("Nossos pacotes são limitados! Se gostar de algum, recomendo reservar logo. Os preços variam conforme o quarto escolhido.");
    }

    // 3. User selects a room (in Rooms view)
    const currentRoomId = selectedRooms.length > 0 ? selectedRooms[selectedRooms.length - 1].id : null;
    if (currentView === ViewState.ROOMS && currentRoomId !== lastContextRef.current.roomId && currentRoomId) {
         // Proactive logic for room selection can be re-enabled here if needed
    }

    // Update refs
    lastContextRef.current = { 
        view: currentView, 
        roomId: currentRoomId 
    };

  }, [currentView, selectedRooms, isOpen]);


  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history
      const historyForApi = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Pass FULL CONTEXT to AI
      const userContext = { currentView, selectedRooms, checkIn, checkOut };
      const responseText = await sendMessageToAI(historyForApi, userMsg.text, rooms, packages, extras, hotelInfo, userContext);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Desculpe, tive um erro técnico. Tente novamente.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[100] flex flex-col items-end pointer-events-none gap-3">
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 overflow-hidden border border-amber-100 flex flex-col h-[500px] max-h-[60vh] md:max-h-[70vh] transition-all animate-in fade-in slide-in-from-bottom-10 origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-bold text-sm">Assistente Solar</h3>
                <p className="text-xs opacity-90">Acompanhando sua reserva</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-white/20 rounded-full p-1.5 transition active:scale-90"
              title="Fechar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div
                    className={`p-3 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-gray-700 border border-gray-100 shadow-sm rounded-tl-none'
                    }`}
                  >
                   {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>
                   ))}
                   <span className="text-[10px] opacity-70 block text-right mt-1">
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce delay-200"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100 shrink-0">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ex: Qual o melhor quarto?"
                className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white p-4 rounded-full shadow-2xl hover:shadow-orange-500/50 flex items-center gap-2 group relative z-50 transition-all active:scale-95"
        title={isOpen ? "Minimizar Chat" : "Abrir Chat"}
      >
        {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce border-2 border-white">
                {unreadCount}
            </span>
        )}
        
        {isOpen ? <ChevronDown className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        
        {!isOpen && (
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-medium pr-0 group-hover:pr-2">
            {unreadCount > 0 ? 'Nova Dica da Sol!' : 'Ajuda com a reserva?'}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatAssistant;