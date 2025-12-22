
import React, { useState, useMemo, useRef } from 'react';
import { Lock, Settings, Package, BedDouble, Tag, Save, LogOut, Plus, Trash2, AlertTriangle, X, Image as ImageIcon, Sparkles, Wand2, Loader2, CheckSquare, Square, ChevronLeft, ChevronRight, LogIn, Pencil, Calendar as CalendarIcon, BrainCircuit, ShoppingBag, Grid, DollarSign, Users, Ban, RotateCcw, RotateCw, Upload, Layers, ArrowRight, ArrowLeft, RefreshCcw, Percent, FileText, CheckCircle, XCircle, Info, CreditCard, Menu, Edit } from 'lucide-react';
import { Room, HolidayPackage, DiscountCode, HotelConfig, ExtraService, RoomDateOverride, Reservation, ReservationStatus } from '../types';
import { ADMIN_CREDENTIALS } from '../constants';
import { processAdminCommand } from '../services/geminiService';

interface AdminPanelProps {
  rooms: Room[];
  packages: HolidayPackage[];
  discounts: DiscountCode[];
  extras: ExtraService[];
  config: HotelConfig;
  reservations: Reservation[];
  onUpdateRooms: (rooms: Room[]) => void;
  onUpdatePackages: (packages: HolidayPackage[]) => void;
  onUpdateDiscounts: (discounts: DiscountCode[]) => void;
  onUpdateExtras: (extras: ExtraService[]) => void;
  onUpdateConfig: (config: HotelConfig) => void;
  onUpdateReservationStatus: (id: string, status: ReservationStatus) => void;
  onLogout: () => void;
  // History Props
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

// --- HELPER: Consistent Date Key Generator (Local YYYY-MM-DD) ---
const toLocalISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- HELPER: Format date string to DD/MM/YYYY without timezone conversion ---
const formatDateLocal = (dateString: string) => {
  // Handle both "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM:SS.SSSZ" formats
  const dateOnly = dateString.split('T')[0]; // Get only the date part
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
};

export const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      onLogin();
    } else {
      setError('Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F2820] flex items-center justify-center p-4">
      <div className="bg-[#F9F8F6] p-8 rounded-sm shadow-2xl w-full max-w-md border border-[#D4AF37]">
        <div className="text-center mb-8">
          <div className="bg-[#0F2820] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#D4AF37]">
            <Lock className="text-[#D4AF37] h-8 w-8" />
          </div>
          <h2 className="text-2xl font-serif text-[#0F2820]">Acesso Administrativo</h2>
          <p className="text-[#4A5D43]">Hotel Solar Management</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] p-3 rounded-sm outline-none focus:border-[#D4AF37] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] p-3 rounded-sm outline-none focus:border-[#D4AF37] transition"
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center font-bold bg-red-100 py-2 rounded">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#D4AF37] hover:bg-[#b8952b] text-[#0F2820] font-bold py-3 rounded-sm shadow-lg transition flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            <LogIn size={18} /> Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

// --- HELPER: Admin General Map Calendar ---
const GeneralMapCalendar: React.FC<{
  rooms: Room[];
  onUpdateRoomOverride: (roomId: string, override: RoomDateOverride) => void;
  onBulkUpdate: (
      startIso: string, 
      endIso: string, 
      roomId: string, 
      updates: Partial<RoomDateOverride> | null, // null means Reset
      priceOp?: { mode: 'fixed' | 'inc_pct' | 'dec_pct' | 'inc_val' | 'dec_val', value: number },
      weekdays?: number[]
  ) => void;
}> = ({ rooms, onUpdateRoomOverride, onBulkUpdate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Ref for Auto Scroll
  const mapGridRef = useRef<HTMLDivElement>(null);

  // Bulk Edit State
  const [bulkStart, setBulkStart] = useState('');
  const [bulkEnd, setBulkEnd] = useState('');
  const [bulkRoomId, setBulkRoomId] = useState('all');
  
  // Price Logic
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkPriceMode, setBulkPriceMode] = useState<'fixed' | 'inc_pct' | 'dec_pct' | 'inc_val' | 'dec_val'>('fixed');

  const [bulkQty, setBulkQty] = useState<string>('');
  const [bulkIsClosed, setBulkIsClosed] = useState<string>('no_change'); // no_change, true, false
  const [bulkNoCheckIn, setBulkNoCheckIn] = useState<string>('no_change');
  const [bulkNoCheckOut, setBulkNoCheckOut] = useState<string>('no_change');
  const [bulkWeekdays, setBulkWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 0=Dom, 1=Seg, ..., 6=Sáb

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  // Filter out past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const daysArray = allDays.filter(day => {
    const dateObj = new Date(year, month, day);
    return dateObj >= today;
  });

  const handlePrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleBulkApply = () => {
     if (!bulkStart || !bulkEnd) {
         alert("Selecione a data de início e fim.");
         return;
     }
     
     const updates: Partial<RoomDateOverride> = {};
     const priceValue = Number(bulkPrice);
     
     if (bulkQty !== '') updates.availableQuantity = Number(bulkQty);
     if (bulkIsClosed !== 'no_change') updates.isClosed = bulkIsClosed === 'true';
     if (bulkNoCheckIn !== 'no_change') updates.noCheckIn = bulkNoCheckIn === 'true';
     if (bulkNoCheckOut !== 'no_change') updates.noCheckOut = bulkNoCheckOut === 'true';

     const hasPriceUpdate = bulkPrice !== '';
     const hasOtherUpdate = Object.keys(updates).length > 0;

     if (!hasPriceUpdate && !hasOtherUpdate) {
         alert("Preencha pelo menos um campo para atualizar.");
         return;
     }

     const confirmMsg = bulkPriceMode === 'fixed' 
        ? "Aplicar alterações em massa? Isso substituirá os valores existentes no período selecionado."
        : "Aplicar AJUSTE MATEMÁTICO em massa? Isso alterará os preços atuais baseados na fórmula selecionada.";

      if (window.confirm(confirmMsg)) {
          onBulkUpdate(
              bulkStart, 
              bulkEnd, 
              bulkRoomId, 
              updates,
              hasPriceUpdate ? { mode: bulkPriceMode, value: priceValue } : undefined,
              bulkWeekdays
          );
         
         // Scroll to map
         setTimeout(() => {
            mapGridRef.current?.scrollIntoView({ behavior: 'smooth' });
         }, 100);

         // Reset mostly used fields
         setBulkPrice('');
         setBulkQty('');
     }
  };

  const handleBulkReset = () => {
      // Limpar todos os campos do formulário de edição em massa
      setBulkStart('');
      setBulkEnd('');
      setBulkRoomId('all');
      setBulkPrice('');
      setBulkPriceMode('fixed');
      setBulkQty('');
      setBulkIsClosed('no_change');
      setBulkNoCheckIn('no_change');
      setBulkNoCheckOut('no_change');
  };

  // Style constants
  const cellStyle = "min-w-[65px] md:min-w-[120px] p-1 md:p-2 border-r border-b border-[#4A5D43] relative flex flex-col justify-between gap-1 transition-all hover:bg-[#354235]";
  const headerCellStyle = "min-w-[65px] md:min-w-[120px] p-1 md:p-3 border-r border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] font-bold text-center uppercase text-xs tracking-wider sticky top-0 z-10 flex flex-col items-center justify-center";
  const stickyColStyle = "sticky left-0 bg-[#2F3A2F] border-r border-[#D4AF37] z-20 shadow-lg";
  const inputStyle = "w-full border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] placeholder-[#E5D3B3]/50 rounded p-2 text-xs focus:ring-1 focus:ring-amber-500 outline-none [color-scheme:dark]";

  return (
    <div className="flex flex-col gap-6">
      {/* Mass Edit Panel */}
      <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
              <Layers size={100} className="text-[#D4AF37]" />
          </div>

          <div className="flex items-center gap-2 mb-4 text-[#0F2820] relative z-10">
              <Layers size={20} className="text-[#D4AF37]" />
              <h3 className="font-bold text-lg font-serif">Edição em Massa Avançada</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative z-10">
              {/* Range */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Início</label>
                 <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} className={inputStyle} />
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Fim</label>
                 <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className={inputStyle} />
              </div>
              
              {/* Weekday Selector */}
              <div className="col-span-1 md:col-span-2 space-y-2">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Dias da Semana</label>
                 <div className="flex flex-wrap gap-2">
                    {[
                       { label: 'Dom', value: 0 },
                       { label: 'Seg', value: 1 },
                       { label: 'Ter', value: 2 },
                       { label: 'Qua', value: 3 },
                       { label: 'Qui', value: 4 },
                       { label: 'Sex', value: 5 },
                       { label: 'Sáb', value: 6 }
                    ].map(day => (
                       <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                             setBulkWeekdays(prev => 
                                prev.includes(day.value) 
                                   ? prev.filter(d => d !== day.value)
                                   : [...prev, day.value].sort()
                             );
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                             bulkWeekdays.includes(day.value)
                                ? 'bg-[#D4AF37] text-[#0F2820] shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                       >
                          {day.label}
                       </button>
                    ))}
                    <button
                       type="button"
                       onClick={() => setBulkWeekdays([0, 1, 2, 3, 4, 5, 6])}
                       className="px-3 py-1.5 text-xs font-medium rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition border border-gray-300"
                    >
                       Todos
                    </button>
                 </div>
              </div>
              
              {/* Target */}
              <div className="space-y-1 lg:col-span-2">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Acomodação Alvo</label>
                 <select value={bulkRoomId} onChange={e => setBulkRoomId(e.target.value)} className={inputStyle}>
                    <option value="all">Todas as Acomodações</option>
                    {rooms.filter(r => r.active).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                 </select>
              </div>

              <div className="col-span-1 md:col-span-2 lg:col-span-4 border-t border-gray-100 my-2"></div>

              {/* Price Advanced */}
              <div className="space-y-1 md:col-span-2">
                 <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1"><DollarSign size={10}/> Ajuste de Preço</label>
                 <div className="flex flex-col md:flex-row gap-2">
                     <select 
                        value={bulkPriceMode} 
                        onChange={e => setBulkPriceMode(e.target.value as any)} 
                        className="w-full md:w-1/2 border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] rounded p-2 text-xs outline-none"
                     >
                        <option value="fixed">Definir Valor Fixo</option>
                        <option value="inc_pct">Aumentar % (ex: +10%)</option>
                        <option value="dec_pct">Diminuir % (ex: -10%)</option>
                        <option value="inc_val">Somar Valor (+R$)</option>
                        <option value="dec_val">Subtrair Valor (-R$)</option>
                     </select>
                     <input 
                        type="number" 
                        placeholder={bulkPriceMode === 'fixed' ? "Valor R$" : "Porcentagem/Valor"}
                        value={bulkPrice} 
                        onChange={e => setBulkPrice(e.target.value)} 
                        className="w-full md:w-1/2 border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] placeholder-[#E5D3B3]/50 rounded p-2 text-xs outline-none"
                     />
                 </div>
              </div>

              {/* Values */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Qtd. Estoque</label>
                 <input 
                    type="number" 
                    placeholder="Manter Atual" 
                    value={bulkQty} 
                    onChange={e => setBulkQty(e.target.value)} 
                    className={inputStyle} 
                 />
              </div>

              {/* Toggles */}
              <div className="space-y-1">
                 <label className="text-[10px] font-bold uppercase text-gray-500">Status Venda</label>
                 <select value={bulkIsClosed} onChange={e => setBulkIsClosed(e.target.value)} className={inputStyle}>
                    <option value="no_change">Manter Atual</option>
                    <option value="false">Aberta (Venda)</option>
                    <option value="true">Fechada (Indisponível)</option>
                 </select>
              </div>

              <div className="space-y-1 flex gap-2">
                 <button 
                   onClick={handleBulkApply}
                   className="flex-1 bg-[#0F2820] text-[#D4AF37] h-[36px] rounded font-bold text-xs uppercase tracking-wider hover:bg-[#1a3c30] transition border border-[#D4AF37] shadow-md flex items-center justify-center gap-2"
                   type="button"
                 >
                    <Save size={14}/> Aplicar
                 </button>
                 <button 
                   onClick={handleBulkReset}
                   className="w-10 bg-red-100 text-red-700 h-[36px] rounded font-bold text-xs hover:bg-red-200 transition border border-red-200 flex items-center justify-center"
                   title="Limpar Formulário"
                   type="button"
                 >
                    <RefreshCcw size={16}/>
                 </button>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-gray-400">
             <div className="flex items-center gap-1">
                <span className="font-bold uppercase">Check-in:</span>
                <select value={bulkNoCheckIn} onChange={e => setBulkNoCheckIn(e.target.value)} className="bg-gray-100 rounded px-1 py-0.5 border border-gray-300">
                    <option value="no_change">--</option>
                    <option value="true">Bloquear</option>
                    <option value="false">Liberar</option>
                </select>
             </div>
             <div className="flex items-center gap-1">
                <span className="font-bold uppercase">Check-out:</span>
                <select value={bulkNoCheckOut} onChange={e => setBulkNoCheckOut(e.target.value)} className="bg-gray-100 rounded px-1 py-0.5 border border-gray-300">
                    <option value="no_change">--</option>
                    <option value="true">Bloquear</option>
                    <option value="false">Liberar</option>
                </select>
             </div>
          </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#1F291F] rounded-xl border border-[#4A5D43] overflow-hidden shadow-2xl flex flex-col h-[700px]" ref={mapGridRef}>
        {/* Header Controls */}
        <div className="bg-[#0F2820] p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[#D4AF37]">
          <div className="flex items-center gap-4 text-[#D4AF37]">
            <Grid size={24} />
            <h3 className="text-sm md:text-lg font-serif font-bold tracking-widest text-center md:text-left">MAPA GERAL DE DISPONIBILIDADE</h3>
          </div>
          <div className="flex items-center gap-6 bg-[#2F3A2F] px-4 py-2 rounded-full border border-[#4A5D43]">
            <button onClick={handlePrev} className="text-[#E5D3B3] hover:text-white transition" type="button"><ChevronLeft/></button>
            <span className="text-[#E5D3B3] font-bold uppercase min-w-[120px] md:min-w-[150px] text-center text-xs md:text-sm">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
            <button onClick={handleNext} className="text-[#E5D3B3] hover:text-white transition" type="button"><ChevronRight/></button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-[#2F3A2F] py-2 px-4 flex gap-x-6 gap-y-2 text-[10px] text-[#E5D3B3] border-b border-[#4A5D43] flex-wrap justify-center md:justify-start">
            <span className="flex items-center gap-1"><DollarSign size={10} className="text-green-400"/> Preço</span>
            <span className="flex items-center gap-1"><Users size={10} className="text-blue-400"/> Qtd.</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-500 rounded-sm"></div> No In</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm"></div> No Out</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900 border border-red-500 rounded-sm"></div> Fechado</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-900/30 border border-red-800/50 rounded-sm"></div> Esgotado (Qtd. 0 ou Preço 0)</span>
        </div>

        {/* Scrollable Grid */}
        <div className="overflow-auto flex-1 bg-[#1F291F] scrollbar-thin scrollbar-thumb-[#4A5D43] scrollbar-track-[#1F291F]">
          <div className="inline-block min-w-full">
              {/* Table Header */}
              <div className="flex">
                <div className={`${headerCellStyle} ${stickyColStyle} w-24 md:w-48 min-w-[100px] md:min-w-[180px] z-30 flex items-center justify-center text-[10px] md:text-xs`}>
                    QUARTO
                </div>
                {daysArray.map(day => {
                  const date = new Date(year, month, day);
                  // Highlight Friday (5) and Saturday (6)
                  const isWeekend = date.getDay() === 5 || date.getDay() === 6;
                  return (
                    <div key={day} className={`${headerCellStyle} ${isWeekend ? 'bg-[#3d4b3d] text-[#D4AF37]' : ''}`}>
                        <span className="text-sm md:text-base">{day}</span>
                        <span className="text-[8px] md:text-[9px] opacity-60 block uppercase">{['D','S','T','Q','Q','S','S'][date.getDay()]}</span>
                    </div>
                  );
                })}
              </div>

              {/* Table Body */}
              {rooms.filter(r => r.active).map(room => (
                <div key={room.id} className="flex border-b border-[#4A5D43]">
                  {/* Room Name Column */}
                  <div className={`${stickyColStyle} w-24 md:w-48 min-w-[100px] md:min-w-[180px] p-1 md:p-3 flex flex-col justify-center`}>
                      <span className="font-serif font-bold text-[#D4AF37] text-[10px] md:text-sm leading-tight md:leading-normal truncate md:whitespace-normal">{room.name}</span>
                      <span className="text-[9px] text-gray-400 hidden md:block">Cap: {room.capacity}</span>
                  </div>
                  
                  {/* Days Columns */}
                  {daysArray.map(day => {
                      const dateObj = new Date(year, month, day);
                      const isoDate = toLocalISO(dateObj);
                      
                      const override = room.overrides?.find(o => o.dateIso === isoDate);
                      
                      const displayPrice = override?.price !== undefined ? override.price : room.price;
                      const displayQty = override?.availableQuantity !== undefined ? override.availableQuantity : room.totalQuantity;
                      const noCheckIn = override?.noCheckIn || false;
                      const noCheckOut = override?.noCheckOut || false;
                      
                      const isClosed = override?.isClosed || (displayPrice === 0) || (displayQty === 0);

                      const handleUpdate = (updates: Partial<RoomDateOverride>) => {
                          onUpdateRoomOverride(room.id, {
                            dateIso: isoDate,
                            price: override?.price ?? room.price,
                            availableQuantity: override?.availableQuantity ?? room.totalQuantity,
                            noCheckIn: override?.noCheckIn ?? false,
                            noCheckOut: override?.noCheckOut ?? false,
                            isClosed: override?.isClosed ?? false,
                            ...updates
                          });
                      };

                      return (
                        <div 
                          key={`${room.id}-${day}`} 
                          className={`${cellStyle} ${isClosed ? 'bg-red-900/30 border-red-800/50' : ''}`}
                        >
                          {/* Price Input */}
                          <div className={`flex items-center gap-0.5 md:gap-1 bg-[#2F3A2F] rounded px-0.5 md:px-1 border border-[#4A5D43] ${isClosed ? 'opacity-50' : ''}`}>
                              <span className="text-[8px] md:text-[9px] text-green-400 font-bold hidden md:inline">R$</span>
                              <input 
                                type="number"
                                disabled={override?.isClosed === true}
                                className="w-full bg-transparent text-[#E5D3B3] text-[10px] md:text-xs font-mono outline-none p-0 md:p-0.5 text-center md:text-left"
                                value={displayPrice || ''}
                                onChange={(e) => handleUpdate({ price: Number(e.target.value) })}
                                placeholder="0"
                              />
                          </div>
                          
                          {/* Quantity Input */}
                          <div className={`flex items-center gap-0.5 md:gap-1 bg-[#2F3A2F] rounded px-0.5 md:px-1 border border-[#4A5D43] ${isClosed ? 'opacity-50' : ''}`}>
                              <span className="text-[8px] md:text-[9px] text-blue-400 font-bold hidden md:inline">QTD</span>
                              <input 
                                type="number"
                                disabled={override?.isClosed === true}
                                className="w-full bg-transparent text-[#E5D3B3] text-[10px] md:text-xs font-mono outline-none p-0 md:p-0.5 text-center md:text-left"
                                value={displayQty || ''}
                                onChange={(e) => handleUpdate({ availableQuantity: Number(e.target.value) })}
                              />
                          </div>

                          {/* Restrictions Toggles */}
                          <div className="flex gap-0.5 md:gap-1 mt-0.5 md:mt-1">
                              <button 
                                onClick={() => handleUpdate({ isClosed: !override?.isClosed })}
                                className={`flex-1 h-4 md:h-5 rounded flex items-center justify-center text-[7px] md:text-[8px] font-bold uppercase transition ${override?.isClosed ? 'bg-red-600 text-white' : 'bg-[#2F3A2F] text-green-500 hover:bg-green-900'}`}
                                title={override?.isClosed ? "Abrir Vendas" : "Fechar Vendas"}
                                type="button"
                              >
                                {override?.isClosed ? <Ban size={10} /> : (displayPrice === 0 ? 'X' : (displayQty === 0 ? '0' : 'OK'))}
                              </button>

                              {!isClosed && (
                                  <>
                                      <button 
                                      onClick={() => handleUpdate({ noCheckIn: !noCheckIn })}
                                      className={`w-4 md:w-5 h-4 md:h-5 rounded flex items-center justify-center text-[7px] md:text-[8px] font-bold transition ${noCheckIn ? 'bg-orange-500 text-white' : 'bg-[#2F3A2F] text-gray-500 hover:bg-gray-700'}`}
                                      title="Restringir Entrada"
                                      type="button"
                                      >
                                      I
                                      </button>
                                      <button 
                                      onClick={() => handleUpdate({ noCheckOut: !noCheckOut })}
                                      className={`w-4 md:w-5 h-4 md:h-5 rounded flex items-center justify-center text-[7px] md:text-[8px] font-bold transition ${noCheckOut ? 'bg-red-500 text-white' : 'bg-[#2F3A2F] text-gray-500 hover:bg-gray-700'}`}
                                      title="Restringir Saída"
                                      type="button"
                                      >
                                      O
                                      </button>
                                  </>
                              )}
                          </div>
                        </div>
                      );
                  })}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCalendarSelector: React.FC<{
  startIso: string;
  endIso: string;
  noCheckoutDates: string[];
  noCheckInDates: string[];
  onChange: (start: string, end: string, noCheckout: string[], noCheckIn: string[]) => void;
}> = ({ startIso, endIso, noCheckoutDates, noCheckInDates, onChange }) => {
  const [tempDate, setTempDate] = useState('');

  const addRestriction = (type: 'in' | 'out') => {
    if (!tempDate) return;
    if (type === 'in' && !noCheckInDates.includes(tempDate)) {
      onChange(startIso, endIso, noCheckoutDates, [...noCheckInDates, tempDate]);
    }
    if (type === 'out' && !noCheckoutDates.includes(tempDate)) {
      onChange(startIso, endIso, [...noCheckoutDates, tempDate], noCheckInDates);
    }
    setTempDate('');
  };

  const removeRestriction = (type: 'in' | 'out', date: string) => {
    if (type === 'in') {
      onChange(startIso, endIso, noCheckoutDates, noCheckInDates.filter(d => d !== date));
    } else {
      onChange(startIso, endIso, noCheckoutDates.filter(d => d !== date), noCheckInDates);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Início do Pacote</label>
          <input 
            type="date" 
            value={startIso} 
            onChange={(e) => onChange(e.target.value, endIso, noCheckoutDates, noCheckInDates)} 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fim do Pacote</label>
          <input 
            type="date" 
            value={endIso} 
            onChange={(e) => onChange(startIso, e.target.value, noCheckoutDates, noCheckInDates)} 
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Restrições de Check-in/Check-out</label>
        <div className="flex flex-col md:flex-row gap-2 mb-3">
           <input 
             type="date" 
             value={tempDate} 
             onChange={(e) => setTempDate(e.target.value)} 
             className="border border-gray-300 rounded-lg p-2 text-sm flex-1"
           />
           <div className="flex gap-2">
            <button 
                type="button" 
                onClick={() => addRestriction('in')} 
                className="flex-1 bg-orange-100 text-orange-700 px-3 py-2 md:py-1 rounded-lg text-xs font-bold border border-orange-200 hover:bg-orange-200"
            >
                Bloquear Entrada
            </button>
            <button 
                type="button" 
                onClick={() => addRestriction('out')} 
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 md:py-1 rounded-lg text-xs font-bold border border-red-200 hover:bg-red-200"
            >
                Bloquear Saída
            </button>
           </div>
        </div>

        <div className="flex flex-wrap gap-2">
           {noCheckInDates.map(d => (
              <span key={`in-${d}`} className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                 No In: {d}
                 <button onClick={() => removeRestriction('in', d)} className="hover:text-red-600"><X size={12}/></button>
              </span>
           ))}
           {noCheckoutDates.map(d => (
              <span key={`out-${d}`} className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                 No Out: {d}
                 <button onClick={() => removeRestriction('out', d)} className="hover:text-red-600"><X size={12}/></button>
              </span>
           ))}
           {noCheckInDates.length === 0 && noCheckoutDates.length === 0 && (
              <span className="text-xs text-gray-400 italic">Sem restrições de data.</span>
           )}
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  rooms, packages, discounts, extras, config, reservations,
  onUpdateRooms, onUpdatePackages, onUpdateDiscounts, onUpdateExtras, onUpdateConfig, onUpdateReservationStatus, onLogout,
  onUndo, onRedo, canUndo, canRedo
}) => {
  type AdminTab = 'map' | 'reservations' | 'rooms' | 'packages' | 'extras' | 'discounts' | 'ai' | 'config';
  
  const [activeTab, setActiveTab] = useState<AdminTab>('map');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ---- AI Command State ----
  const [aiCommand, setAiCommand] = useState('');
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // ---- State for Creation Forms ----
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<Room>>({
    name: '', description: '', price: 0, capacity: 2, totalQuantity: 1, active: true, imageUrl: 'https://picsum.photos/800/600'
  });
  const [newRoomFeatures, setNewRoomFeatures] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const [isAddingPackage, setIsAddingPackage] = useState(false);
  
  const [newPackage, setNewPackage] = useState<Partial<HolidayPackage>>({
    name: '', description: '', active: true, imageUrl: 'https://picsum.photos/800/600', 
    startIsoDate: '', endIsoDate: '', noCheckoutDates: [], noCheckInDates: [],
    roomPrices: []
  });
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);

  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [newExtra, setNewExtra] = useState<Partial<ExtraService>>({
     name: '', description: '', price: 0, imageUrl: 'https://picsum.photos/400/300', active: true
  });
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);

  const [newDiscountCode, setNewDiscountCode] = useState('');
  const [newDiscountPercent, setNewDiscountPercent] = useState(10);
  const [newDiscountStartDate, setNewDiscountStartDate] = useState('');
  const [newDiscountEndDate, setNewDiscountEndDate] = useState('');
  const [newDiscountMinNights, setNewDiscountMinNights] = useState<number | ''>('');
  const [newDiscountFullPeriod, setNewDiscountFullPeriod] = useState(false);
  const [editingDiscountCode, setEditingDiscountCode] = useState<string | null>(null);
  
  // Styles
  const inputStyle = "w-full border border-[#4A5D43] bg-[#2F3A2F] text-[#E5D3B3] placeholder-[#E5D3B3]/50 rounded-lg p-2 text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition [color-scheme:dark]";
  const labelStyle = "block text-xs font-semibold text-gray-500 uppercase mb-1";

  // ---- Helpers ----
  const handleFileUpload = (file: File, callback: (result: string) => void) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (typeof reader.result === 'string') callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // ---- AI Handler ----
  const handleAiCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCommand.trim()) return;

    setIsProcessingAi(true);
    setAiMessage(null);

    try {
      const response = await processAdminCommand(aiCommand, { rooms, packages, discounts, extras });
      
      let changed = false;
      if (response.rooms) {
        onUpdateRooms(response.rooms);
        changed = true;
      }
      if (response.packages) {
        onUpdatePackages(response.packages);
        changed = true;
      }
      if (response.discounts) {
        onUpdateDiscounts(response.discounts);
        changed = true;
      }
      if (response.extras) {
        onUpdateExtras(response.extras);
        changed = true;
      }

      setAiMessage({ 
        text: response.message || (changed ? 'Alterações realizadas com sucesso!' : 'Nenhuma alteração feita.'),
        type: 'success'
      });
      setAiCommand('');
    } catch (error) {
      const errorMessage = error instanceof Error && error.message === 'API key not configured'
        ? '⚠️ Assistente IA não configurado. Para ativar, adicione a variável GEMINI_API_KEY no Vercel (Settings > Environment Variables). Obtenha sua chave em: https://aistudio.google.com/apikey'
        : 'Erro ao processar comando. Verifique sua conexão ou tente novamente.';
      setAiMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsProcessingAi(false);
    }
  };

  // ---- Handlers for Rooms ----
  const handleRoomChange = (id: string, field: keyof Room, value: any) => {
    const updated = rooms.map(r => r.id === id ? { ...r, [field]: value } : r);
    onUpdateRooms(updated);
  };

  const handleCreateRoom = () => {
    if (!newRoom.name) return;
    const imageUrls = (newRoom as any).imageUrls || [newRoom.imageUrl || ''];
    const room: Room = {
      id: newRoom.name.toLowerCase().replace(/\s+/g, '-'),
      name: newRoom.name || 'Nova Acomodação',
      description: newRoom.description || '',
      price: newRoom.price || 0,
      capacity: newRoom.capacity || 2,
      imageUrl: imageUrls[0] || '',
      imageUrls: imageUrls.filter((img: string) => img),
      features: newRoomFeatures.split(',').map(f => f.trim()).filter(f => f),
      totalQuantity: newRoom.totalQuantity || 1,
      active: true,
      overrides: []
    };
    onUpdateRooms([...rooms, room]);
    setIsAddingRoom(false);
    setNewRoom({ name: '', description: '', price: 0, capacity: 2, totalQuantity: 1, active: true, imageUrl: 'https://picsum.photos/800/600' });
    setNewRoomFeatures('');
  };

  const handleDeleteRoom = (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir esta acomodação?')) {
      onUpdateRooms(rooms.filter(r => r.id !== id));
    }
  };

  const handleEditRoom = (id: string) => {
      const room = rooms.find(r => r.id === id);
      if (room) {
          setNewRoom({
              name: room.name,
              description: room.description,
              price: room.price,
              capacity: room.capacity,
              totalQuantity: room.totalQuantity,
              active: room.active,
              imageUrl: room.imageUrl,
              imageUrls: room.imageUrls || [room.imageUrl]
          } as any);
          setNewRoomFeatures(room.features.join(', '));
          setEditingRoomId(id);
          setIsAddingRoom(true);
      }
  };

  const handleUpdateRoom = () => {
      if (!newRoom.name || !editingRoomId) return;
      const imageUrls = (newRoom as any).imageUrls || [newRoom.imageUrl || ''];
      const updatedRooms = rooms.map(r => 
          r.id === editingRoomId 
              ? { 
                  ...r, 
                  name: newRoom.name!, 
                  description: newRoom.description || '', 
                  price: newRoom.price || 0, 
                  capacity: newRoom.capacity || 2,
                  totalQuantity: newRoom.totalQuantity || 1,
                  imageUrl: imageUrls[0] || '',
                  imageUrls: imageUrls.filter((img: string) => img),
                  features: newRoomFeatures.split(',').map(f => f.trim()).filter(f => f)
                }
              : r
      );
      onUpdateRooms(updatedRooms);
      setIsAddingRoom(false);
      setEditingRoomId(null);
      setNewRoom({ name: '', description: '', price: 0, capacity: 2, totalQuantity: 1, active: true, imageUrl: 'https://picsum.photos/800/600' });
      setNewRoomFeatures('');
  };

  const handleCancelEditRoom = () => {
      setIsAddingRoom(false);
      setEditingRoomId(null);
      setNewRoom({ name: '', description: '', price: 0, capacity: 2, totalQuantity: 1, active: true, imageUrl: 'https://picsum.photos/800/600' });
      setNewRoomFeatures('');
  };

  // ---- Handlers for Packages ----
  const handleUpdatePackage = (id: string, updates: Partial<HolidayPackage>) => {
      onUpdatePackages(packages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleCreatePackage = () => {
      if (!newPackage.name || !newPackage.startIsoDate || !newPackage.endIsoDate) return;
      
      const pkg: HolidayPackage = {
          id: Math.random().toString(36).substr(2, 9),
          name: newPackage.name,
          description: newPackage.description || '',
          imageUrl: newPackage.imageUrl || '',
          includes: (newPackage.includes as unknown as string || '').split(',').map((s:string) => s.trim()).filter((s:string) => s),
          active: true,
          startIsoDate: newPackage.startIsoDate,
          endIsoDate: newPackage.endIsoDate,
          roomPrices: newPackage.roomPrices || [],
          noCheckoutDates: newPackage.noCheckoutDates || [],
          noCheckInDates: newPackage.noCheckInDates || []
      };
      onUpdatePackages([...packages, pkg]);
      setIsAddingPackage(false);
      setNewPackage({ name: '', description: '', active: true, imageUrl: 'https://picsum.photos/800/600', startIsoDate: '', endIsoDate: '', roomPrices: [] });
  };

  const handleDeletePackage = (id: string) => {
      if(window.confirm('Excluir este pacote?')) {
          onUpdatePackages(packages.filter(p => p.id !== id));
      }
  };

  const handleEditPackage = (id: string) => {
      const pkg = packages.find(p => p.id === id);
      if (pkg) {
          setNewPackage({
              name: pkg.name,
              description: pkg.description,
              imageUrl: pkg.imageUrl,
              includes: pkg.includes.join(', ') as any,
              active: pkg.active,
              startIsoDate: pkg.startIsoDate,
              endIsoDate: pkg.endIsoDate,
              roomPrices: pkg.roomPrices,
              noCheckoutDates: pkg.noCheckoutDates,
              noCheckInDates: pkg.noCheckInDates
          });
          setEditingPackageId(id);
          setIsAddingPackage(true);
      }
  };

  const handleUpdatePackage2 = () => {
      if (!newPackage.name || !newPackage.startIsoDate || !newPackage.endIsoDate || !editingPackageId) return;
      const updatedPackages = packages.map(p => 
          p.id === editingPackageId 
              ? { 
                  ...p, 
                  name: newPackage.name!, 
                  description: newPackage.description || '', 
                  imageUrl: newPackage.imageUrl || '',
                  includes: (newPackage.includes as unknown as string || '').split(',').map((s:string) => s.trim()).filter((s:string) => s),
                  startIsoDate: newPackage.startIsoDate!,
                  endIsoDate: newPackage.endIsoDate!,
                  roomPrices: newPackage.roomPrices || [],
                  noCheckoutDates: newPackage.noCheckoutDates || [],
                  noCheckInDates: newPackage.noCheckInDates || []
                }
              : p
      );
      onUpdatePackages(updatedPackages);
      setIsAddingPackage(false);
      setEditingPackageId(null);
      setNewPackage({ name: '', description: '', active: true, imageUrl: 'https://picsum.photos/800/600', startIsoDate: '', endIsoDate: '', roomPrices: [] });
  };

  const handleCancelEditPackage = () => {
      setIsAddingPackage(false);
      setEditingPackageId(null);
      setNewPackage({ name: '', description: '', active: true, imageUrl: 'https://picsum.photos/800/600', startIsoDate: '', endIsoDate: '', roomPrices: [] });
  };

  // Auto-fill room prices from map when dates are set
  const autoFillRoomPricesFromMap = (startDate: string, endDate: string) => {
      if (!startDate || !endDate) return;
      
      console.log('[AUTO-FILL] Filling room prices from map for dates:', startDate, 'to', endDate);
      
      const roomPrices: { roomId: string; price: number }[] = [];
      
      // Calculate average price for each room during the package period
      for (const room of rooms) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          let totalPrice = 0;
          let nights = 0;
          
          const currentDate = new Date(start);
          while (currentDate < end) {
              const dateStr = currentDate.toISOString().split('T')[0];
              
              // Find override for this date
              const override = room.overrides?.find(o => o.dateIso === dateStr);
              const dailyPrice = override?.price !== undefined ? override.price : room.price;
              
              totalPrice += dailyPrice;
              nights++;
              
              currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Total price for the entire package period
          roomPrices.push({
              roomId: room.id,
              price: Math.round(totalPrice)
          });
      }
      
      console.log('[AUTO-FILL] Room prices filled:', roomPrices);
      setNewPackage(prev => ({ ...prev, roomPrices }));
  };

  // ---- Handlers for Extras ----
  const handleCreateExtra = () => {
      if (!newExtra.name) return;
      const extra: ExtraService = {
          id: Math.random().toString(36).substr(2, 9),
          name: newExtra.name,
          description: newExtra.description || '',
          price: newExtra.price || 0,
          imageUrl: newExtra.imageUrl || '',
          active: true
      };
      onUpdateExtras([...extras, extra]);
      setIsAddingExtra(false);
      setNewExtra({ name: '', description: '', price: 0, imageUrl: 'https://picsum.photos/400/300', active: true });
  };

  const handleDeleteExtra = (id: string) => {
      if(window.confirm('Excluir este item extra?')) {
          onUpdateExtras(extras.filter(e => e.id !== id));
      }
  };

  const handleEditExtra = (id: string) => {
      const extra = extras.find(e => e.id === id);
      if (extra) {
          setNewExtra({
              name: extra.name,
              description: extra.description,
              price: extra.price,
              imageUrl: extra.imageUrl,
              active: extra.active
          });
          setEditingExtraId(id);
          setIsAddingExtra(true);
      }
  };

  const handleUpdateExtra = () => {
      if (!newExtra.name || !editingExtraId) return;
      const updatedExtras = extras.map(e => 
          e.id === editingExtraId 
              ? { ...e, name: newExtra.name!, description: newExtra.description || '', price: newExtra.price || 0, imageUrl: newExtra.imageUrl || '' }
              : e
      );
      onUpdateExtras(updatedExtras);
      setIsAddingExtra(false);
      setEditingExtraId(null);
      setNewExtra({ name: '', description: '', price: 0, imageUrl: 'https://picsum.photos/400/300', active: true });
  };

  const handleCancelEditExtra = () => {
      setIsAddingExtra(false);
      setEditingExtraId(null);
      setNewExtra({ name: '', description: '', price: 0, imageUrl: 'https://picsum.photos/400/300', active: true });
  };

  // ---- Handlers for Discounts ----
  const handleCreateDiscount = () => {
      if (!newDiscountCode) return;
      const discount: DiscountCode = {
          code: newDiscountCode.toUpperCase(),
          percentage: newDiscountPercent,
          active: true,
          startDate: newDiscountStartDate || undefined,
          endDate: newDiscountEndDate || undefined,
          minNights: typeof newDiscountMinNights === 'number' ? newDiscountMinNights : undefined,
          fullPeriodRequired: newDiscountFullPeriod
      };
      onUpdateDiscounts([...discounts, discount]);
      setNewDiscountCode('');
      setNewDiscountPercent(10);
      setNewDiscountStartDate('');
      setNewDiscountEndDate('');
      setNewDiscountMinNights('');
      setNewDiscountFullPeriod(false);
  };

  const handleDeleteDiscount = (code: string) => {
      onUpdateDiscounts(discounts.filter(d => d.code !== code));
  };

  const handleEditDiscount = (code: string) => {
      const discount = discounts.find(d => d.code === code);
      if (!discount) return;
      setEditingDiscountCode(code);
      setNewDiscountCode(discount.code);
      setNewDiscountPercent(discount.percentage);
      setNewDiscountStartDate(discount.startDate || '');
      setNewDiscountEndDate(discount.endDate || '');
      setNewDiscountMinNights(discount.minNights || '');
      setNewDiscountFullPeriod(discount.fullPeriodRequired || false);
  };

  const handleUpdateDiscount = () => {
      if (!newDiscountCode || !editingDiscountCode) return;
      const updatedDiscounts = discounts.map(d => 
          d.code === editingDiscountCode
              ? {
                  code: newDiscountCode.toUpperCase(),
                  percentage: newDiscountPercent,
                  active: d.active,
                  startDate: newDiscountStartDate || undefined,
                  endDate: newDiscountEndDate || undefined,
                  minNights: typeof newDiscountMinNights === 'number' ? newDiscountMinNights : undefined,
                  fullPeriodRequired: newDiscountFullPeriod
              }
              : d
      );
      onUpdateDiscounts(updatedDiscounts);
      setEditingDiscountCode(null);
      setNewDiscountCode('');
      setNewDiscountPercent(10);
      setNewDiscountStartDate('');
      setNewDiscountEndDate('');
      setNewDiscountMinNights('');
      setNewDiscountFullPeriod(false);
  };

  const handleCancelEdit = () => {
      setEditingDiscountCode(null);
      setNewDiscountCode('');
      setNewDiscountPercent(10);
      setNewDiscountStartDate('');
      setNewDiscountEndDate('');
      setNewDiscountMinNights('');
      setNewDiscountFullPeriod(false);
  };

  // ---- Handlers for Calendar/Overrides ----
  const handleUpdateRoomOverride = (roomId: string, override: RoomDateOverride) => {
     const room = rooms.find(r => r.id === roomId);
     if (!room) return;

     const existingIndex = room.overrides?.findIndex(o => o.dateIso === override.dateIso) ?? -1;
     let newOverrides = room.overrides ? [...room.overrides] : [];

     if (existingIndex >= 0) {
         newOverrides[existingIndex] = override;
     } else {
         newOverrides.push(override);
     }
     
     handleRoomChange(roomId, 'overrides', newOverrides);
  };

  const handleBulkUpdate = (startIso: string, endIso: string, roomId: string, updates: Partial<RoomDateOverride> | null, priceOp?: { mode: 'fixed' | 'inc_pct' | 'dec_pct' | 'inc_val' | 'dec_val', value: number }, weekdays?: number[]) => {
     let targets = roomId === 'all' ? rooms : rooms.filter(r => r.id === roomId);
     
     // Generate dates
     let dates: string[] = [];
     let curr = new Date(startIso);
     curr.setUTCHours(12);
     const endD = new Date(endIso);
     endD.setUTCHours(12);

     while (curr <= endD) {
         const dayOfWeek = curr.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
         // Se weekdays foi fornecido, filtrar por dia da semana
         if (!weekdays || weekdays.includes(dayOfWeek)) {
             dates.push(curr.toISOString().split('T')[0]);
         }
         curr.setDate(curr.getDate() + 1);
     }

     const newRooms = rooms.map(room => {
        if (roomId !== 'all' && room.id !== roomId) return room;
        
        let newOverrides = room.overrides ? [...room.overrides] : [];

        dates.forEach(date => {
            if (updates === null) {
                // Delete override
                newOverrides = newOverrides.filter(o => o.dateIso !== date);
            } else {
                const existingIndex = newOverrides.findIndex(o => o.dateIso === date);
                let currentOverride = existingIndex >= 0 ? newOverrides[existingIndex] : {
                    dateIso: date,
                };
                
                const basePrice = existingIndex >= 0 && currentOverride.price !== undefined ? currentOverride.price : room.price;
                
                let finalPrice = updates.price;
                
                if (priceOp) {
                    if (priceOp.mode === 'fixed') finalPrice = priceOp.value;
                    else if (priceOp.mode === 'inc_pct') finalPrice = Math.round(basePrice * (1 + priceOp.value / 100));
                    else if (priceOp.mode === 'dec_pct') finalPrice = Math.round(basePrice * (1 - priceOp.value / 100));
                    else if (priceOp.mode === 'inc_val') finalPrice = basePrice + priceOp.value;
                    else if (priceOp.mode === 'dec_val') finalPrice = Math.max(0, basePrice - priceOp.value);
                }

                const merged: RoomDateOverride = {
                    dateIso: date,
                    price: finalPrice !== undefined ? finalPrice : (currentOverride.price ?? room.price),
                    availableQuantity: updates.availableQuantity !== undefined ? updates.availableQuantity : (currentOverride.availableQuantity ?? room.totalQuantity),
                    noCheckIn: updates.noCheckIn !== undefined ? updates.noCheckIn : (currentOverride.noCheckIn ?? false),
                    noCheckOut: updates.noCheckOut !== undefined ? updates.noCheckOut : (currentOverride.noCheckOut ?? false),
                    isClosed: updates.isClosed !== undefined ? updates.isClosed : (currentOverride.isClosed ?? false),
                };

                if (existingIndex >= 0) newOverrides[existingIndex] = merged;
                else newOverrides.push(merged);
            }
        });
        
        return { ...room, overrides: newOverrides };
     });

     onUpdateRooms(newRooms);
  };

  const navItemClass = (tab: AdminTab) => 
    `flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${activeTab === tab 
      ? 'bg-[#D4AF37] text-[#0F2820] font-bold shadow-lg' 
      : 'text-[#E5D3B3] hover:bg-[#2F3A2F]'}`;

  const handleMobileNav = (tab: AdminTab) => {
      setActiveTab(tab);
      setIsMobileMenuOpen(false);
  };

  const renderReservations = () => (
    <div className="space-y-4">
       <h2 className="text-2xl font-serif text-[#0F2820]">Gestão de Reservas</h2>
       <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-[#0F2820] text-[#D4AF37] uppercase text-xs">
                    <tr>
                    <th className="p-3">ID / Data</th>
                    <th className="p-3">Hóspede</th>
                    <th className="p-3">Detalhes</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {reservations.map(res => (
                    <tr key={res.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                            <div className="font-bold">{res.id}</div>
                            <div className="text-xs text-gray-500">{new Date(res.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="p-3">
                            <div className="font-bold">{res.mainGuest.name}</div>
                            <div className="text-xs text-gray-500">{res.mainGuest.phone}</div>
                            <div className="text-xs text-gray-500">{res.mainGuest.email}</div>
                        </td>
                        <td className="p-3">
                            <div>In: {formatDateLocal(res.checkIn)}</div>
                            <div>Out: {formatDateLocal(res.checkOut)}</div>
                            <div className="text-xs font-bold text-gray-600">{res.rooms.length} Quarto(s)</div>
                        </td>
                        <td className="p-3 font-bold text-[#0F2820]">
                            R$ {res.totalPrice.toLocaleString('pt-BR')}
                            <div className="text-xs font-normal text-gray-500">{res.paymentMethod === 'PIX' ? 'PIX' : 'Cartão'}</div>
                        </td>
                        <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                ${res.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                                res.status === 'CANCELED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {res.status === 'CONFIRMED' ? 'Confirmada' : res.status === 'CANCELED' ? 'Cancelada' : 'Pendente'}
                            </span>
                        </td>
                        <td className="p-3">
                            <select 
                            value={res.status}
                            onChange={(e) => onUpdateReservationStatus(res.id, e.target.value as ReservationStatus)}
                            className="border rounded p-1 text-xs"
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="CONFIRMED">Confirmar</option>
                                <option value="CANCELED">Cancelar</option>
                            </select>
                            <button 
                                onClick={() => setSelectedReservation(res)}
                                className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                                Ver
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
       </div>

       {/* Modal for Details */}
       {selectedReservation && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Detalhes da Reserva {selectedReservation.id}</h3>
                    <button onClick={() => setSelectedReservation(null)}><X/></button>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                           <p className="font-bold text-xs uppercase text-gray-500">Hóspede</p>
                           <p>{selectedReservation.mainGuest.name}</p>
                           <p className="text-sm">{selectedReservation.mainGuest.cpf}</p>
                           <p className="text-sm">{selectedReservation.mainGuest.email}</p>
                           <p className="text-sm">{selectedReservation.mainGuest.phone}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                           <p className="font-bold text-xs uppercase text-gray-500">Pagamento</p>
                           <p>{selectedReservation.paymentMethod === 'PIX' ? 'PIX' : 'Cartão de Crédito'}</p>
                           <p className="text-xl font-bold text-[#0F2820]">R$ {selectedReservation.totalPrice.toLocaleString('pt-BR')}</p>
                           {selectedReservation.discountApplied && (
                              <p className="text-green-600 text-sm">Desconto: {selectedReservation.discountApplied.code} (-R$ {selectedReservation.discountApplied.amount})</p>
                           )}
                           {selectedReservation.cardDetails && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <p className="text-xs font-bold text-gray-500">Dados do Cartão:</p>
                                    <p className="text-xs">Titular: {selectedReservation.cardDetails.holderName}</p>
                                    {selectedReservation.status === 'PENDING' ? (
                                      <>
                                        <p className="text-xs">Número: {selectedReservation.cardDetails.number}</p>
                                        <p className="text-xs">CVV: {selectedReservation.cardDetails.cvv}</p>
                                        <p className="text-xs">Validade: {selectedReservation.cardDetails.expiry}</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-xs">Final: **** {selectedReservation.cardDetails.number.slice(-4)}</p>
                                        <p className="text-xs">Val: {selectedReservation.cardDetails.expiry}</p>
                                      </>
                                    )}
                                </div>
                           )}
                        </div>
                    </div>

                    <div>
                       <p className="font-bold text-xs uppercase text-gray-500 mb-2">Itens</p>
                       <ul className="list-disc pl-5 text-sm">
                          {selectedReservation.rooms.map((r, i) => (
                             <li key={i}>{r.name} - R$ {r.priceSnapshot}</li>
                          ))}
                          {selectedReservation.extras.map((e, i) => (
                             <li key={i}>{e.quantity}x {e.name} - R$ {e.priceSnapshot * e.quantity}</li>
                          ))}
                       </ul>
                    </div>

                   {selectedReservation.observations && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                         <p className="font-bold text-xs uppercase text-yellow-700">Observações</p>
                         <p className="text-sm text-yellow-900">{selectedReservation.observations}</p>
                      </div>
                   )}

                   {/* Payment Confirmation Buttons */}
                   {selectedReservation.status === 'PENDING' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                         <button
                            onClick={async () => {
                              if (confirm('Confirmar pagamento desta reserva? Um email será enviado ao cliente.')) {
                                try {
                                  await fetch('/api/reservations?action=confirm-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ reservationId: selectedReservation.id, approved: true }),
                                  });
                                  alert('Pagamento confirmado! Email enviado ao cliente.');
                                  setSelectedReservation(null);
                                  window.location.reload();
                                } catch (error) {
                                  alert('Erro ao confirmar pagamento.');
                                }
                              }
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                         >
                            <CheckCircle size={18} /> Confirmar Pagamento
                         </button>
                         <button
                            onClick={async () => {
                              if (confirm('Reprovar pagamento desta reserva? A reserva será cancelada.')) {
                                try {
                                  await fetch('/api/reservations?action=confirm-payment', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ reservationId: selectedReservation.id, approved: false }),
                                  });
                                  alert('Pagamento reprovado. Reserva cancelada.');
                                  setSelectedReservation(null);
                                  window.location.reload();
                                } catch (error) {
                                  alert('Erro ao reprovar pagamento.');
                                }
                              }
                            }}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition flex items-center justify-center gap-2"
                         >
                            <X size={18} /> Reprovar Pagamento
                         </button>
                      </div>
                   )}
                </div>
             </div>
          </div>
      )}
   </div>
 );

  return (
    <div className="flex min-h-screen bg-[#F9F8F6] relative">
      
      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-[#0F2820] text-[#E5D3B3] z-50 p-4 flex justify-between items-center shadow-lg">
         <div className="flex items-center gap-2">
             <Lock className="text-[#D4AF37]" size={20} />
             <h1 className="font-serif font-bold tracking-widest text-lg">SOLAR ADMIN</h1>
         </div>
         <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-[#2F3A2F] rounded text-[#D4AF37]">
             {isMobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
         </button>
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isMobileMenuOpen && (
          <div 
             className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
             onClick={() => setIsMobileMenuOpen(false)}
          />
      )}

      {/* Sidebar (Responsive) */}
      <aside 
         className={`
           w-64 bg-[#0F2820] text-[#E5D3B3] flex flex-col fixed h-full z-50 shadow-2xl transition-transform duration-300 ease-in-out
           ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 top-0 left-0
         `}
      >
        <div className="p-6 border-b border-[#4A5D43] hidden md:block">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="text-[#D4AF37]" size={20} />
            <h1 className="font-serif font-bold tracking-widest text-lg">SOLAR ADMIN</h1>
          </div>
          <p className="text-xs text-[#4A5D43]">Painel de Controle</p>
        </div>
        
        {/* Mobile Sidebar Header */}
        <div className="p-6 border-b border-[#4A5D43] md:hidden flex justify-between items-center">
             <span className="font-bold text-[#D4AF37]">MENU</span>
             <button onClick={() => setIsMobileMenuOpen(false)}><X/></button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <a 
                href="https://www.hotelsolar.tur.br/"
                className="flex items-center gap-2 px-4 py-3 rounded-lg transition-all text-[#E5D3B3] hover:bg-[#2F3A2F] mb-4 border border-[#4A5D43]"
            >
                <ArrowLeft size={18} /> Voltar para site
            </a>

          <button onClick={() => handleMobileNav('map')} className={navItemClass('map')}>
            <Grid size={18} /> Mapa Geral
          </button>
          <button onClick={() => handleMobileNav('reservations')} className={navItemClass('reservations')}>
            <BookCheck size={18} /> Reservas
          </button>
          <button onClick={() => handleMobileNav('rooms')} className={navItemClass('rooms')}>
            <BedDouble size={18} /> Acomodações
          </button>
          <button onClick={() => handleMobileNav('packages')} className={navItemClass('packages')}>
            <Package size={18} /> Pacotes
          </button>
          <button onClick={() => handleMobileNav('extras')} className={navItemClass('extras')}>
            <ShoppingBag size={18} /> Produtos Extras
          </button>
          <button onClick={() => handleMobileNav('discounts')} className={navItemClass('discounts')}>
            <Tag size={18} /> Cupons
          </button>
          <button onClick={() => handleMobileNav('ai')} className={navItemClass('ai')}>
            <BrainCircuit size={18} /> Assistente IA
          </button>
          <button onClick={() => handleMobileNav('config')} className={navItemClass('config')}>
            <Settings size={18} /> Configurações
          </button>
        </nav>

        <div className="p-4 border-t border-[#4A5D43] bg-[#0A1C16]">
          <div className="flex justify-between mb-4">
             <button onClick={onUndo} disabled={!canUndo} className="p-2 bg-[#2F3A2F] rounded hover:bg-[#3d4b3d] disabled:opacity-30" title="Desfazer">
                <RotateCcw size={16}/>
             </button>
             <button onClick={onRedo} disabled={!canRedo} className="p-2 bg-[#2F3A2F] rounded hover:bg-[#3d4b3d] disabled:opacity-30" title="Refazer">
                <RotateCw size={16}/>
             </button>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-900/30 text-red-400 py-2 rounded hover:bg-red-900/50 transition"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content - No margin left on mobile, margin-left 64 on desktop */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0">
        
        {/* MAP VIEW */}
        {activeTab === 'map' && (
           <GeneralMapCalendar 
              rooms={rooms}
              onUpdateRoomOverride={handleUpdateRoomOverride}
              onBulkUpdate={handleBulkUpdate}
           />
        )}

        {/* RESERVATIONS VIEW */}
        {activeTab === 'reservations' && renderReservations()}

        {/* ROOMS VIEW */}
        {activeTab === 'rooms' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <h2 className="text-2xl font-serif text-[#0F2820]">Gestão de Acomodações</h2>
               <button 
                 onClick={() => setIsAddingRoom(true)} 
                 className="w-full md:w-auto bg-[#D4AF37] text-[#0F2820] px-4 py-2 rounded-lg font-bold shadow hover:bg-[#b8952b] flex items-center justify-center gap-2"
               >
                 <Plus size={18} /> Nova Acomodação
               </button>
            </div>

            {isAddingRoom && (
               <div className="bg-white p-4 md:p-6 rounded-xl border border-[#D4AF37] shadow-xl animate-in fade-in">
                  <h3 className="font-bold text-lg mb-4 text-[#0F2820]">{editingRoomId ? 'Editar Acomodação' : 'Nova Acomodação'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className={labelStyle}>Nome</label>
                        <input value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className={inputStyle} />
                     </div>
                     <div>
                        <label className={labelStyle}>Preço Base (R$)</label>
                        <input type="number" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: Number(e.target.value)})} className={inputStyle} />
                     </div>
                     <div>
                        <label className={labelStyle}>Capacidade (Pessoas)</label>
                        <input type="number" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: Number(e.target.value)})} className={inputStyle} />
                     </div>
                     <div>
                        <label className={labelStyle}>Estoque Total (Unidades)</label>
                        <input type="number" value={newRoom.totalQuantity} onChange={e => setNewRoom({...newRoom, totalQuantity: Number(e.target.value)})} className={inputStyle} />
                     </div>
                     <div className="md:col-span-2">
                        <label className={labelStyle}>Descrição</label>
                        <textarea value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} className={inputStyle} rows={3} />
                     </div>
                   <div className="md:col-span-2">
                      <label className={labelStyle}>Imagens da Acomodação (até 4 fotos)</label>
                      <div className="space-y-3">
                         {[0, 1, 2, 3].map(index => {
                           const currentImages = (newRoom as any).imageUrls || [newRoom.imageUrl || ''];
                           const imageUrl = currentImages[index] || '';
                           return (
                             <div key={index} className="flex items-center gap-2">
                               <span className="text-xs font-bold text-gray-500 w-12">Foto {index + 1}:</span>
                               <input 
                                 type="url"
                                 value={imageUrl} 
                                 onChange={e => {
                                   const newImages = [...currentImages];
                                   newImages[index] = e.target.value;
                                   setNewRoom({...newRoom, imageUrls: newImages.filter(img => img), imageUrl: newImages[0] || ''} as any);
                                 }} 
                                 className={inputStyle + ' flex-1'} 
                                 placeholder="Cole a URL da imagem ou faça upload"
                               />
                               <label className="cursor-pointer">
                                 <div className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs text-gray-700">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                   Upload
                                 </div>
                                 <input 
                                   type="file" 
                                   accept="image/*" 
                                   className="hidden"
                                   onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                       const reader = new FileReader();
                                       reader.onloadend = () => {
                                         const newImages = [...currentImages];
                                         newImages[index] = reader.result as string;
                                         setNewRoom({...newRoom, imageUrls: newImages.filter(img => img), imageUrl: newImages[0] || ''} as any);
                                       };
                                       reader.readAsDataURL(file);
                                     }
                                   }}
                                 />
                               </label>
                               {imageUrl && (
                                 <div className="w-16 h-16 border border-gray-300 rounded overflow-hidden shrink-0">
                                   <img src={imageUrl} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                 </div>
                               )}
                             </div>
                           );
                         })}
                         <p className="text-xs text-gray-500 mt-2">💡 A primeira foto será a imagem principal da acomodação</p>
                      </div>
                   </div>
                     <div className="md:col-span-2">
                        <label className={labelStyle}>Comodidades (Separadas por vírgula)</label>
                        <input value={newRoomFeatures} onChange={e => setNewRoomFeatures(e.target.value)} className={inputStyle} placeholder="Wifi, Ar Condicionado, etc..." />
                     </div>
                  </div>
                  <div className="flex gap-2 mt-4 justify-end">
                     {editingRoomId ? (
                        <>
                           <button onClick={handleCancelEditRoom} className="px-4 py-2 bg-gray-400 text-white rounded shadow hover:bg-gray-500">Cancelar</button>
                           <button onClick={handleUpdateRoom} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">Atualizar</button>
                        </>
                     ) : (
                        <>
                           <button onClick={() => setIsAddingRoom(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
                           <button onClick={handleCreateRoom} className="bg-[#0F2820] text-white px-6 py-2 rounded shadow hover:bg-[#1a3c30]">Salvar</button>
                        </>
                     )}
                  </div>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {rooms.map(room => (
                  <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden group border border-gray-100 hover:border-[#D4AF37] transition">
                     <div className="relative h-48">
                        <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2 flex gap-2">
                           <button 
                             onClick={() => handleEditRoom(room.id)}
                             className="p-2 bg-blue-500 text-white rounded-full shadow hover:bg-blue-600 transition"
                             title="Editar acomodação"
                           >
                             <Edit size={14} />
                           </button>
                           <button 
                             onClick={() => handleDeleteRoom(room.id)}
                             className="p-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition"
                             title="Deletar acomodação"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                     <div className="p-4 space-y-3">
                        <input 
                          value={room.name} 
                          onChange={(e) => handleRoomChange(room.id, 'name', e.target.value)}
                          className="font-serif font-bold text-lg text-[#0F2820] w-full border-b border-transparent focus:border-[#D4AF37] outline-none bg-transparent"
                        />
                        <div className="flex gap-2">
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Preço Base</label>
                              <div className="flex items-center text-[#D4AF37]">
                                 <span className="text-xs mr-1">R$</span>
                                 <input 
                                   type="number" 
                                   value={room.price}
                                   onChange={(e) => handleRoomChange(room.id, 'price', Number(e.target.value))}
                                   className="w-full font-bold outline-none"
                                 />
                              </div>
                           </div>
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-gray-400">Estoque</label>
                              <input 
                                type="number" 
                                value={room.totalQuantity}
                                onChange={(e) => handleRoomChange(room.id, 'totalQuantity', Number(e.target.value))}
                                className="w-full font-bold outline-none text-[#0F2820]"
                              />
                           </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={room.active} 
                                onChange={(e) => handleRoomChange(room.id, 'active', e.target.checked)}
                                className="w-4 h-4 text-[#0F2820] rounded focus:ring-[#D4AF37]"
                              />
                              <span className="text-xs font-bold text-gray-600">Ativo no Site</span>
                           </label>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          </div>
        )}

        {/* PACKAGES VIEW */}
        {activeTab === 'packages' && (
           <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h2 className="text-2xl font-serif text-[#0F2820]">Pacotes e Feriados</h2>
                 <button 
                   onClick={() => setIsAddingPackage(true)} 
                   className="w-full md:w-auto bg-[#D4AF37] text-[#0F2820] px-4 py-2 rounded-lg font-bold shadow hover:bg-[#b8952b] flex items-center justify-center gap-2"
                 >
                   <Plus size={18} /> Novo Pacote
                 </button>
              </div>

              {isAddingPackage && (
                 <div className="bg-white p-4 md:p-6 rounded-xl border border-[#D4AF37] shadow-xl animate-in fade-in">
                    <h3 className="font-bold text-lg mb-4 text-[#0F2820]">{editingPackageId ? 'Editar Pacote' : 'Novo Pacote'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="md:col-span-2">
                          <label className={labelStyle}>Nome do Pacote</label>
                          <input value={newPackage.name} onChange={e => setNewPackage({...newPackage, name: e.target.value})} className={inputStyle} />
                       </div>
                       <div>
                          <label className={labelStyle}>Data Início</label>
                          <input type="date" value={newPackage.startIsoDate} onChange={e => {
                            const newStartDate = e.target.value;
                            setNewPackage({...newPackage, startIsoDate: newStartDate});
                            // Auto-fill prices when both dates are set
                            if (newStartDate && newPackage.endIsoDate) {
                              autoFillRoomPricesFromMap(newStartDate, newPackage.endIsoDate);
                            }
                          }} className={inputStyle} />
                       </div>
                       <div>
                          <label className={labelStyle}>Data Fim</label>
                          <input type="date" value={newPackage.endIsoDate} onChange={e => {
                            const newEndDate = e.target.value;
                            setNewPackage({...newPackage, endIsoDate: newEndDate});
                            // Auto-fill prices when both dates are set
                            if (newPackage.startIsoDate && newEndDate) {
                              autoFillRoomPricesFromMap(newPackage.startIsoDate, newEndDate);
                            }
                          }} className={inputStyle} />
                       </div>
                      <div className="md:col-span-2">
                         <label className={labelStyle}>Itens Inclusos (Separados por vírgula)</label>
                         <input 
                            value={Array.isArray(newPackage.includes) ? newPackage.includes.join(', ') : newPackage.includes} 
                            onChange={e => setNewPackage({...newPackage, includes: e.target.value})} 
                            className={inputStyle} 
                            placeholder="Café da Manhã, Transfer, etc"
                         />
                      </div>
                      <div className="md:col-span-2">
                         <label className={labelStyle}>Imagem do Pacote</label>
                         <div className="space-y-2">
                            <div className="flex gap-2">
                               <input 
                                  type="url"
                                  value={newPackage.imageUrl || ''} 
                                  onChange={e => setNewPackage({...newPackage, imageUrl: e.target.value})} 
                                  className={inputStyle} 
                                  placeholder="Cole a URL da imagem ou faça upload abaixo"
                               />
                            </div>
                            <div className="flex items-center gap-2">
                               <label className="flex-1 cursor-pointer">
                                  <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm text-gray-700">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                     Fazer Upload de Imagem
                                  </div>
                                  <input 
                                     type="file" 
                                     accept="image/*" 
                                     className="hidden"
                                     onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                           const reader = new FileReader();
                                           reader.onloadend = () => {
                                              setNewPackage({...newPackage, imageUrl: reader.result as string});
                                           };
                                           reader.readAsDataURL(file);
                                        }
                                     }}
                                  />
                               </label>
                               {newPackage.imageUrl && (
                                  <div className="w-20 h-20 border border-gray-300 rounded overflow-hidden shrink-0">
                                     <img src={newPackage.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                  </div>
                               )}
                            </div>
                         </div>
                      </div>
                      
                      {/* Room Prices Section */}
                      {newPackage.startIsoDate && newPackage.endIsoDate && newPackage.roomPrices && newPackage.roomPrices.length > 0 && (
                        <div className="md:col-span-2 mt-4">
                          <label className={labelStyle}>Preços por Acomodação (Valor Total do Pacote)</label>
                          <div className="bg-[#F9F8F6] p-4 rounded border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {rooms.map(room => {
                                const rp = newPackage.roomPrices?.find(p => p.roomId === room.id);
                                return (
                                  <div key={room.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                    <span className="text-xs font-bold truncate pr-2">{room.name}</span>
                                    <div className="flex items-center w-28">
                                      <span className="text-xs text-gray-400 mr-1">R$</span>
                                      <input 
                                        type="number"
                                        value={rp ? rp.price : 0}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const newPrices = (newPackage.roomPrices || []).filter(p => p.roomId !== room.id);
                                          if (val > 0) newPrices.push({ roomId: room.id, price: val });
                                          setNewPackage({...newPackage, roomPrices: newPrices});
                                        }}
                                        className="w-full text-xs font-bold outline-none text-right border-b border-gray-300 focus:border-[#D4AF37]"
                                        placeholder="0"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">💡 Preços preenchidos automaticamente do mapa geral. Você pode editá-los aqui.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                       {editingPackageId ? (
                          <>
                             <button onClick={handleCancelEditPackage} className="px-4 py-2 bg-gray-400 text-white rounded shadow hover:bg-gray-500">Cancelar</button>
                             <button onClick={handleUpdatePackage2} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">Atualizar</button>
                          </>
                       ) : (
                          <>
                             <button onClick={() => setIsAddingPackage(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
                             <button onClick={handleCreatePackage} className="bg-[#0F2820] text-white px-6 py-2 rounded shadow hover:bg-[#1a3c30]">Criar Pacote</button>
                          </>
                       )}
                    </div>
                 </div>
              )}

              <div className="space-y-4">
                 {packages.map(pkg => (
                    <div key={pkg.id} className="bg-white rounded-lg shadow-md border border-gray-100 p-4">
                       <div className="flex flex-col md:flex-row gap-6">
                           <div className="w-full md:w-48 h-32 shrink-0">
                               <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover rounded" />
                           </div>
                           <div className="flex-1 space-y-4">
                               <div className="flex justify-between items-start">
                                   <div>
                                       <h3 className="font-serif font-bold text-xl text-[#0F2820]">{pkg.name}</h3>
                                       <p className="text-sm text-gray-500">{new Date(pkg.startIsoDate + 'T12:00:00').toLocaleDateString()} até {new Date(pkg.endIsoDate + 'T12:00:00').toLocaleDateString()}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                       <label className="flex items-center gap-2 cursor-pointer mr-4">
                                           <input 
                                             type="checkbox" 
                                             checked={pkg.active} 
                                             onChange={(e) => handleUpdatePackage(pkg.id, { active: e.target.checked })}
                                             className="w-4 h-4 text-[#0F2820] rounded focus:ring-[#D4AF37]"
                                           />
                                           <span className="text-xs font-bold text-gray-600">Ativo</span>
                                       </label>
                                       <button onClick={() => handleEditPackage(pkg.id)} className="text-blue-500 hover:text-blue-700" title="Editar pacote"><Edit size={18}/></button>
                                       <button onClick={() => handleDeletePackage(pkg.id)} className="text-red-400 hover:text-red-600" title="Deletar pacote"><Trash2 size={18}/></button>
                                   </div>
                               </div>

                               {/* Calendar Rules specific to this package */}
                               <AdminCalendarSelector 
                                   startIso={pkg.startIsoDate}
                                   endIso={pkg.endIsoDate}
                                   noCheckoutDates={pkg.noCheckoutDates}
                                   noCheckInDates={pkg.noCheckInDates}
                                   onChange={(start, end, noOut, noIn) => handleUpdatePackage(pkg.id, { startIsoDate: start, endIsoDate: end, noCheckoutDates: noOut, noCheckInDates: noIn })}
                               />

                               {/* Room Prices for this package */}
                               <div className="bg-[#F9F8F6] p-4 rounded border border-gray-200">
                                   <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Preços do Pacote por Quarto (Valor Total)</h4>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                       {rooms.map(room => {
                                           const rp = pkg.roomPrices.find(p => p.roomId === room.id);
                                           return (
                                               <div key={room.id} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                                                   <span className="text-xs font-bold truncate pr-2">{room.name}</span>
                                                   <div className="flex items-center w-24">
                                                       <span className="text-xs text-gray-400 mr-1">R$</span>
                                                       <input 
                                                          type="number"
                                                          value={rp ? rp.price : 0}
                                                          onChange={(e) => {
                                                              const val = Number(e.target.value);
                                                              const newPrices = pkg.roomPrices.filter(p => p.roomId !== room.id);
                                                              if (val > 0) newPrices.push({ roomId: room.id, price: val });
                                                              handleUpdatePackage(pkg.id, { roomPrices: newPrices });
                                                          }}
                                                          className="w-full text-xs font-bold outline-none text-right"
                                                          placeholder="0"
                                                       />
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* EXTRAS VIEW */}
        {activeTab === 'extras' && (
           <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h2 className="text-2xl font-serif text-[#0F2820]">Produtos e Serviços Extras</h2>
                 <button 
                   onClick={() => setIsAddingExtra(true)} 
                   className="w-full md:w-auto bg-[#D4AF37] text-[#0F2820] px-4 py-2 rounded-lg font-bold shadow hover:bg-[#b8952b] flex items-center justify-center gap-2"
                 >
                   <Plus size={18} /> Novo Item
                 </button>
              </div>

              {isAddingExtra && (
                 <div className="bg-white p-4 md:p-6 rounded-xl border border-[#D4AF37] shadow-xl animate-in fade-in">
                    <h3 className="font-bold text-lg mb-4 text-[#0F2820]">{editingExtraId ? 'Editar Item Extra' : 'Novo Item Extra'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="md:col-span-2">
                          <label className={labelStyle}>Nome do Item</label>
                          <input value={newExtra.name} onChange={e => setNewExtra({...newExtra, name: e.target.value})} className={inputStyle} />
                       </div>
                       <div className="md:col-span-2">
                          <label className={labelStyle}>Descrição</label>
                          <textarea value={newExtra.description} onChange={e => setNewExtra({...newExtra, description: e.target.value})} className={inputStyle} rows={2} />
                       </div>
                       <div>
                          <label className={labelStyle}>Preço Unitário (R$)</label>
                          <input type="number" value={newExtra.price} onChange={e => setNewExtra({...newExtra, price: Number(e.target.value)})} className={inputStyle} />
                       </div>
                       <div className="md:col-span-2">
                          <label className={labelStyle}>Imagem do Produto Extra</label>
                          <div className="space-y-2">
                             <div className="flex gap-2">
                                <input 
                                   type="url"
                                   value={newExtra.imageUrl || ''} 
                                   onChange={e => setNewExtra({...newExtra, imageUrl: e.target.value})} 
                                   className={inputStyle} 
                                   placeholder="Cole a URL da imagem ou faça upload abaixo"
                                />
                             </div>
                             <div className="flex items-center gap-2">
                                <label className="flex-1 cursor-pointer">
                                   <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm text-gray-700">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                      Fazer Upload de Imagem
                                   </div>
                                   <input 
                                      type="file" 
                                      accept="image/*" 
                                      className="hidden"
                                      onChange={(e) => {
                                         const file = e.target.files?.[0];
                                         if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                               setNewExtra({...newExtra, imageUrl: reader.result as string});
                                            };
                                            reader.readAsDataURL(file);
                                         }
                                      }}
                                   />
                                </label>
                                {newExtra.imageUrl && (
                                   <div className="w-20 h-20 border border-gray-300 rounded overflow-hidden shrink-0">
                                      <img src={newExtra.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex gap-2 mt-4 justify-end">
                       {editingExtraId ? (
                          <>
                             <button onClick={handleCancelEditExtra} className="px-4 py-2 bg-gray-400 text-white rounded shadow hover:bg-gray-500">Cancelar</button>
                             <button onClick={handleUpdateExtra} className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700">Atualizar</button>
                          </>
                       ) : (
                          <>
                             <button onClick={() => setIsAddingExtra(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700">Cancelar</button>
                             <button onClick={handleCreateExtra} className="bg-[#0F2820] text-white px-6 py-2 rounded shadow hover:bg-[#1a3c30]">Adicionar</button>
                          </>
                       )}
                    </div>
                 </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {extras.map(extra => (
                      <div key={extra.id} className="bg-white rounded-lg shadow border border-gray-100 flex gap-4 p-4 items-center">
                          <img src={extra.imageUrl} alt={extra.name} className="w-16 h-16 rounded object-cover" />
                          <div className="flex-1">
                              <h4 className="font-bold text-[#0F2820]">{extra.name}</h4>
                              <p className="text-xs text-gray-500 line-clamp-1">{extra.description}</p>
                              <div className="flex justify-between items-center mt-2">
                                  <span className="font-bold text-[#D4AF37]">R$ {extra.price}</span>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleEditExtra(extra.id)} className="text-blue-500 hover:text-blue-700" title="Editar item"><Edit size={16}/></button>
                                      <button onClick={() => handleDeleteExtra(extra.id)} className="text-red-400 hover:text-red-600" title="Deletar item"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
           </div>
        )}

        {/* DISCOUNTS VIEW */}
        {activeTab === 'discounts' && (
           <div className="space-y-8">
               <h2 className="text-2xl font-serif text-[#0F2820]">Cupons de Desconto</h2>
               
               <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-sm mb-4 uppercase text-gray-500">{editingDiscountCode ? 'Editar Cupom' : 'Criar Novo Cupom'}</h3>
                  <div className="flex flex-wrap gap-4 items-end">
                     <div className="flex-1 min-w-[200px]">
                        <label className={labelStyle}>Código (Ex: VERAO10)</label>
                        <input value={newDiscountCode} onChange={e => setNewDiscountCode(e.target.value)} className={inputStyle} />
                     </div>
                     <div className="w-24">
                        <label className={labelStyle}>% Desconto</label>
                        <input type="number" value={newDiscountPercent} onChange={e => setNewDiscountPercent(Number(e.target.value))} className={inputStyle} />
                     </div>
                     <div className="w-40">
                        <label className={labelStyle}>Data Início</label>
                        <input type="date" value={newDiscountStartDate} onChange={e => setNewDiscountStartDate(e.target.value)} className={inputStyle} placeholder="Opcional" />
                     </div>
                     <div className="w-40">
                        <label className={labelStyle}>Data Fim</label>
                        <input type="date" value={newDiscountEndDate} onChange={e => setNewDiscountEndDate(e.target.value)} className={inputStyle} placeholder="Opcional" />
                     </div>
                     <div className="w-32">
                        <label className={labelStyle}>Mín. Noites</label>
                        <input type="number" value={newDiscountMinNights} onChange={e => setNewDiscountMinNights(Number(e.target.value) || '')} className={inputStyle} placeholder="Opcional" />
                     </div>
                     {editingDiscountCode ? (
                        <>
                           <button onClick={handleUpdateDiscount} className="bg-blue-600 text-white px-6 py-2 rounded h-[42px] shadow hover:bg-blue-700 font-bold">
                              Atualizar
                           </button>
                           <button onClick={handleCancelEdit} className="bg-gray-400 text-white px-6 py-2 rounded h-[42px] shadow hover:bg-gray-500 font-bold">
                              Cancelar
                           </button>
                        </>
                     ) : (
                        <button onClick={handleCreateDiscount} className="bg-[#0F2820] text-white px-6 py-2 rounded h-[42px] shadow hover:bg-[#1a3c30] font-bold">
                           Criar
                        </button>
                     )}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discounts.map(d => (
                     <div key={d.code} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center shadow-sm">
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg text-[#0F2820]">{d.code}</span>
                              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded font-bold">-{d.percentage}%</span>
                           </div>
                           {d.minNights && <p className="text-xs text-gray-500">Mínimo {d.minNights} noites</p>}
                           {(d.startDate || d.endDate) && (
                              <p className="text-xs text-gray-500 mt-1">
                                 <CalendarIcon size={12} className="inline mr-1" />
                                 {d.startDate && new Date(d.startDate).toLocaleDateString('pt-BR')} 
                                 {d.startDate && d.endDate && ' - '}
                                 {d.endDate && new Date(d.endDate).toLocaleDateString('pt-BR')}
                              </p>
                           )}
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleEditDiscount(d.code)} className="text-blue-500 hover:text-blue-700 p-2" title="Editar cupom"><Edit size={18}/></button>
                           <button onClick={() => handleDeleteDiscount(d.code)} className="text-red-400 hover:text-red-600 p-2" title="Deletar cupom"><Trash2 size={18}/></button>
                        </div>
                     </div>
                  ))}
               </div>
           </div>
        )}
        
        {/* AI VIEW */}
        {activeTab === 'ai' && (
           <div className="max-w-2xl mx-auto space-y-6 text-center pt-10">
               <div className="inline-block p-4 bg-[#0F2820] rounded-full mb-4 shadow-xl">
                   <Sparkles className="text-[#D4AF37] h-8 w-8" />
               </div>
               <h2 className="text-3xl font-serif text-[#0F2820]">Assistente IA Administrativo</h2>
               <p className="text-gray-600">
                  Descreva o que deseja alterar e eu cuidarei do resto. 
                  <br/><span className="text-sm opacity-70">Ex: "Aumente o preço da Suíte Casal para 400", "Crie um pacote de Natal", "Bloqueie o dia 25/12".</span>
               </p>

               <form onSubmit={handleAiCommand} className="relative mt-8">
                  <textarea 
                     value={aiCommand}
                     onChange={e => setAiCommand(e.target.value)}
                     className="w-full p-6 pr-16 bg-white border-2 border-[#D4AF37] rounded-2xl shadow-xl focus:ring-4 focus:ring-[#D4AF37]/20 outline-none text-lg"
                     rows={4}
                     placeholder="Digite seu comando..."
                  />
                  <button 
                     type="submit" 
                     disabled={isProcessingAi || !aiCommand.trim()}
                     className="absolute bottom-4 right-4 bg-[#0F2820] text-white p-3 rounded-full hover:bg-[#1a3c30] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
                  >
                     {isProcessingAi ? <Loader2 className="animate-spin" /> : <Wand2 />}
                  </button>
               </form>

               {aiMessage && (
                  <div className={`p-4 rounded-lg text-left animate-in fade-in slide-in-from-bottom-2 flex items-start gap-3 ${aiMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                      {aiMessage.type === 'success' ? <CheckCircle className="shrink-0 mt-0.5"/> : <AlertTriangle className="shrink-0 mt-0.5"/>}
                      <p>{aiMessage.text}</p>
                  </div>
               )}
           </div>
        )}

        {/* CONFIG VIEW */}
        {activeTab === 'config' && (
           <div className="max-w-3xl space-y-8">
              <h2 className="text-2xl font-serif text-[#0F2820]">Configurações Gerais</h2>
              
              <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-[#0F2820] mb-2">Base de Conhecimento da IA (Chatbot)</label>
                      <p className="text-xs text-gray-500 mb-2">Informações que a 'Sol' usará para responder dúvidas dos clientes.</p>
                      <textarea 
                         value={config.aiKnowledgeBase}
                         onChange={(e) => onUpdateConfig({...config, aiKnowledgeBase: e.target.value})}
                         className="w-full h-64 p-4 bg-[#F9F8F6] border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm leading-relaxed"
                      />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="block text-sm font-bold text-[#0F2820] mb-2">Estadia Mínima Padrão</label>
                          <input 
                             type="number"
                             value={config.minStay}
                             onChange={(e) => onUpdateConfig({...config, minStay: Number(e.target.value)})}
                             className={inputStyle}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-[#0F2820] mb-2">Email de Contato</label>
                          <input 
                             type="email"
                             value={config.contactEmail}
                             onChange={(e) => onUpdateConfig({...config, contactEmail: e.target.value})}
                             className={inputStyle}
                          />
                      </div>
                  </div>
              </div>
           </div>
        )}

      </main>
    </div>
  );
};

// Default export is crucial
const BookCheck = ({ size }: { size: number }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="m9 10 2 2 4-4" />
    </svg>
);

export default AdminPanel;
