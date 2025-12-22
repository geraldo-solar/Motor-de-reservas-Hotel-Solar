
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Users, ArrowRight, CheckCircle, Tag, Lock, ShoppingBag, CreditCard, MessageSquare, QrCode, Copy, User, Mail, Phone, FileText, ChevronLeft, ShieldCheck, AlertCircle, BedDouble, Trash2, Baby } from 'lucide-react';
import { Room, DiscountCode, ExtraService, Reservation } from '../types';
import { createReservation, generatePixPayment } from '../services/apiService';
import RegulamentoHospedagem from './RegulamentoHospedagem';

// Last updated: 2025-12-22 14:18 - Force rebuild
interface BookingFormProps {
  selectedRooms: Room[];
  discountCodes: DiscountCode[];
  extras: ExtraService[];
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  preSelectedPackagePrice?: number | null; // Note: If package is selected, selectedRooms likely has 1 item
  onRemoveRoom: (index: number) => void;
  onAddReservation: (reservation: Reservation) => void;
  onReservationComplete?: (reservationId: string, guestEmail: string, paymentMethod: 'pix' | 'credit_card') => void;
  onBackClick?: () => void;
}

interface AdditionalGuest {
  name: string;
  cpf: string;
  age: string;
}

// --- VALIDATION HELPERS ---
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validateCPF = (cpf: string) => {
  const strCPF = cpf.replace(/[^\d]+/g, '');
  if (strCPF.length !== 11) return false;
  
  // Aceitar CPFs de teste para desenvolvimento (começando com 000, 111, 123, etc)
  const testCPFs = ['00000000000', '11111111111', '22222222222', '33333333333', '44444444444', 
                    '55555555555', '66666666666', '77777777777', '88888888888', '99999999999',
                    '12345678900', '12345678901', '12345678909'];
  if (testCPFs.includes(strCPF)) return true;
  
  // Validação completa para CPFs reais
  if (/^(\d)\1+$/.test(strCPF)) return false; 

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) sum += parseInt(strCPF.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(strCPF.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(strCPF.substring(10, 11))) return false;

  return true;
};

const validateCreditCard = (number: string) => {
  const sanitized = number.replace(/\D/g, '');
  if (!sanitized) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i));

    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
};

const BookingForm: React.FC<BookingFormProps> = ({ 
  selectedRooms, 
  discountCodes,
  extras,
  initialCheckIn,
  initialCheckOut,
  preSelectedPackagePrice,
  onRemoveRoom,
  onAddReservation,
  onReservationComplete,
  onBackClick
}) => {
  const [step, setStep] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{ [key: string]: number }>({});
  const [observations, setObservations] = useState('');
  
  // Guest Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  
  // Additional Guests Data
  const [additionalGuests, setAdditionalGuests] = useState<AdditionalGuest[]>([]);
  
  // Payment Data
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Loading and PIX states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pixData, setPixData] = useState<{ payload: string; qrCode: string } | null>(null);
  
  // Regulamento
  const [acceptedRegulamento, setAcceptedRegulamento] = useState(false);
  const [showRegulamento, setShowRegulamento] = useState(false);
  
  // Refs for auto-scroll
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLInputElement>(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Initialize Additional Guests array based on room capacity
  useEffect(() => {
      const totalCapacity = selectedRooms.reduce((acc, room) => acc + room.capacity, 0);
      // Main guest takes 1 spot, so we need slots for Capacity - 1
      const slotsNeeded = Math.max(0, totalCapacity - 1);
      
      if (additionalGuests.length !== slotsNeeded) {
          // Preserve existing data if resizing, or create empty slots
          const newGuests = Array(slotsNeeded).fill(null).map((_, i) => 
              additionalGuests[i] || { name: '', cpf: '', age: '' }
          );
          setAdditionalGuests(newGuests);
      }
  }, [selectedRooms]);

  const nights = initialCheckIn && initialCheckOut 
    ? Math.max(1, Math.ceil((initialCheckOut.getTime() - initialCheckIn.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // --- PRICE CALCULATIONS ---

  // Helper to get room override for specific date
  const getRoomOverride = (room: Room, date: Date) => {
      const iso = date.toISOString().split('T')[0];
      return room.overrides?.find(o => o.dateIso === iso);
  };

  const calculateRoomTotal = (room: Room) => {
     if (preSelectedPackagePrice && selectedRooms.length === 1) return preSelectedPackagePrice;
     
     if (!initialCheckIn || !initialCheckOut) return 0;
     
     let total = 0;
     let tempDate = new Date(initialCheckIn);
     const endDate = new Date(initialCheckOut);
     
     while (tempDate < endDate) {
         const override = getRoomOverride(room, tempDate);
         let dailyPrice = override?.price !== undefined ? override.price : room.price;
         
         // Fallback basic weekend logic if no specific override (matching App.tsx)
         if (override?.price === undefined) {
            const day = tempDate.getDay();
            if (day === 5 || day === 6) dailyPrice *= 1.15;
         }
         
         total += dailyPrice;
         tempDate.setDate(tempDate.getDate() + 1);
     }
     
     return Math.round(total);
  };

  const accommodationTotal = selectedRooms.reduce((acc, room) => acc + calculateRoomTotal(room), 0);
  
  const extrasTotal = Object.entries(selectedExtras).reduce((acc, [id, qty]) => {
    const extra = extras.find(e => e.id === id);
    return acc + (extra ? extra.price * (qty as number) : 0);
  }, 0);

  const subtotal = accommodationTotal + extrasTotal;
  const total = subtotal - (appliedDiscount?.amount || 0);

  // --- HANDLERS ---

  const handleApplyDiscount = () => {
    const code = discountCode.toUpperCase();
    const discount = discountCodes.find(d => d.code === code && d.active);

    if (!discount) {
      alert('Cupom inválido ou expirado.');
      setAppliedDiscount(null);
      return;
    }

    // Validate Date Range
    if (initialCheckIn && initialCheckOut) {
       // Check Min Nights
       if (discount.minNights && nights < discount.minNights) {
           alert(`Este cupom requer no mínimo ${discount.minNights} diárias.`);
           setAppliedDiscount(null);
           return;
       }

       // Check Validity Period
       const checkInISO = initialCheckIn.toISOString().split('T')[0];
       const checkOutISO = initialCheckOut.toISOString().split('T')[0];

       if (discount.startDate && checkInISO < discount.startDate) {
           alert(`Este cupom é válido apenas a partir de ${new Date(discount.startDate).toLocaleDateString()}`);
           setAppliedDiscount(null);
           return;
       }
       if (discount.endDate && checkOutISO > discount.endDate) {
           alert(`Este cupom expirou em ${new Date(discount.endDate).toLocaleDateString()}`);
           setAppliedDiscount(null);
           return;
       }
       
       // Check Full Period Requirement
       if (discount.fullPeriodRequired && discount.startDate && discount.endDate) {
           if (checkInISO < discount.startDate || checkOutISO > discount.endDate) {
               alert(`Este cupom requer que toda a hospedagem esteja entre ${new Date(discount.startDate).toLocaleDateString()} e ${new Date(discount.endDate).toLocaleDateString()}`);
               setAppliedDiscount(null);
               return;
           }
       }
    }

    const discountAmount = (accommodationTotal * discount.percentage) / 100;
    setAppliedDiscount({ code: discount.code, amount: discountAmount });
    alert(`Cupom ${discount.code} aplicado! Desconto de ${discount.percentage}%`);
  };

  const handleUpdateExtra = (id: string, delta: number) => {
    setSelectedExtras(prev => {
      const current = prev[id] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newQty };
    });
  };
  
  const handleUpdateGuest = (index: number, field: keyof AdditionalGuest, value: string) => {
      const newGuests = [...additionalGuests];
      newGuests[index] = { ...newGuests[index], [field]: value };
      setAdditionalGuests(newGuests);
  };

  const handleFinalSubmit = async () => {
    const newErrors: { [key: string]: string } = {};
    let firstErrorRef: React.RefObject<HTMLInputElement> | null = null;

    if (!name.trim()) { newErrors.name = 'Nome é obrigatório'; if(!firstErrorRef) firstErrorRef = nameRef; }
    if (!validateEmail(email)) { newErrors.email = 'Email inválido'; if(!firstErrorRef) firstErrorRef = emailRef; }
    if (!phone.trim()) { newErrors.phone = 'Telefone é obrigatório'; if(!firstErrorRef) firstErrorRef = phoneRef; }
    if (!validateCPF(cpf)) { newErrors.cpf = 'CPF inválido'; if(!firstErrorRef) firstErrorRef = cpfRef; }

    if (paymentMethod === 'CREDIT_CARD') {
        if (!cardName.trim()) { newErrors.cardName = 'Nome no cartão obrigatório'; if(!firstErrorRef) firstErrorRef = cardRef; }
        if (!validateCreditCard(cardNumber)) { newErrors.cardNumber = 'Número de cartão inválido'; if(!firstErrorRef) firstErrorRef = cardRef; }
        if (!cardExpiry.trim()) { newErrors.cardExpiry = 'Validade obrigatória'; if(!firstErrorRef) firstErrorRef = cardRef; }
        if (cardCvv.length < 3) { newErrors.cardCvv = 'CVV inválido'; if(!firstErrorRef) firstErrorRef = cardRef; }
    }

    // Additional Guests are now optional - no validation required

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      firstErrorRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstErrorRef?.current?.focus();
      return;
    }

    // Success - Create Reservation Object
    // Helper function to format date without timezone conversion
    const formatDateLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const reservationPayload = {
        checkIn: initialCheckIn ? formatDateLocal(initialCheckIn) : '',
        checkOut: initialCheckOut ? formatDateLocal(initialCheckOut) : '',
        nights: nights,
        mainGuest: { name, email, phone, cpf },
        additionalGuests: additionalGuests.filter(g => g.name && g.cpf),
        observations,
        rooms: selectedRooms.map(r => ({ id: r.id, name: r.name, priceSnapshot: calculateRoomTotal(r) })),
        extras: Object.entries(selectedExtras).map(([id, qty]) => {
            const extra = extras.find(e => e.id === id);
            return { name: extra?.name || id, quantity: qty as number, priceSnapshot: extra?.price || 0 };
        }),
        totalPrice: total,
        discountApplied: appliedDiscount || undefined,
        paymentMethod,
        cardDetails: paymentMethod === 'CREDIT_CARD' ? {
            holderName: cardName,
            number: cardNumber,
            expiry: cardExpiry,
            cvv: cardCvv
        } : undefined,
    };
    
    // Submit reservation to API
    setIsSubmitting(true);
    
    try {
      // Create reservation in database
      const { reservation } = await createReservation(reservationPayload);
      
      // Email notifications are now sent by the backend API automatically
      // No need to call sendReservationEmail here (removed to avoid duplicate emails)
      
      // If PIX payment, generate PIX code
      if (paymentMethod === 'PIX') {
        const pixResponse = await generatePixPayment(total, reservation.id, name);
        setPixData({
          payload: pixResponse.pix.payload,
          qrCode: pixResponse.pix.qrCode
        });
      }
      
      // Add to local state (for backward compatibility)
      onAddReservation(reservation);
      
      // Call completion callback to show thank you page
      console.log('DEBUG: About to call onReservationComplete', { reservationId: reservation.id, email, paymentMethod });
      if (onReservationComplete) {
        const payMethod = paymentMethod === 'PIX' ? 'pix' : 'credit_card';
        console.log('DEBUG: Calling onReservationComplete with', { reservationId: reservation.id, email, payMethod });
        onReservationComplete(reservation.id, email, payMethod);
        console.log('DEBUG: onReservationComplete called successfully');
      } else {
        // Fallback for backward compatibility
        alert('Reserva criada com sucesso! Um e-mail foi enviado para você com os detalhes.');
        if (paymentMethod === 'CREDIT_CARD') {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Erro ao criar reserva. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    } 
  };

  // --- RENDER ---

  // STEP 1: REVIEW & EXTRAS
  if (step === 1) {
    return (
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-[#D4AF37] animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-[#0F2820] text-white p-6 border-b border-[#D4AF37] flex items-center gap-4">
           {onBackClick && (
           <button 
             onClick={(e) => {
               e.preventDefault();
               e.stopPropagation();
               console.log('[BOOKING FORM] Back button clicked');
               onBackClick();
             }} 
             className="hover:bg-white/20 p-2 rounded-full transition" 
             title="Voltar para seleção de datas"
             type="button"
           >
             <ChevronLeft/>
           </button>
           )}
           <div>
             <h2 className="text-2xl font-serif">Sua Reserva: Passo 1 de 2</h2>
             <p className="text-[#D4AF37] text-sm tracking-widest uppercase">Revisão e Personalização</p>
           </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
           {/* Selected Rooms */}
           <div className="space-y-4">
              <h3 className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><BedDouble size={20}/> Acomodações Selecionadas</h3>
              {selectedRooms.map((room, index) => (
                 <div key={`${room.id}-${index}`} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                     <div className="flex items-center gap-4">
                         <img src={room.imageUrl} alt={room.name} className="w-16 h-16 rounded object-cover" />
                         <div>
                             <h4 className="font-bold text-[#0F2820]">{room.name}</h4>
                             <p className="text-xs text-gray-500">{nights} diárias • {room.capacity} hóspedes</p>
                         </div>
                     </div>
                     <div className="flex items-center gap-4">
                         <span className="font-serif font-bold text-[#0F2820]">R$ {calculateRoomTotal(room).toLocaleString('pt-BR')}</span>
                         <button onClick={() => onRemoveRoom(index)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button>
                     </div>
                 </div>
              ))}
           </div>

           {/* Observations */}
           <div className="space-y-2">
              <label className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2">
                 <MessageSquare size={18} /> Pedidos Especiais
              </label>
              <textarea
                className="w-full p-4 border border-[#4A5D43] bg-white rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none text-sm placeholder-gray-400"
                placeholder="Tem algum pedido especial? Berço, travesseiros extras, andar alto..."
                rows={3}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
           </div>

           {/* Extras */}
           <div className="space-y-4">
               <h3 className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><ShoppingBag size={20}/> Incremente sua Experiência</h3>
               {console.log('[BookingForm] Extras recebidos:', extras)}
               {console.log('[BookingForm] Extras ativos:', extras.filter(e => e.active))}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {extras.filter(e => e.active).map(extra => (
                       <div key={extra.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 hover:border-[#D4AF37] transition bg-white">
                           <img src={extra.imageUrl} alt={extra.name} className="w-20 h-20 rounded object-cover shrink-0" />
                           <div className="flex-1 flex flex-col justify-between">
                               <div>
                                   <h4 className="font-bold text-sm text-[#0F2820]">{extra.name}</h4>
                                   <p className="text-xs text-gray-500 line-clamp-2">{extra.description}</p>
                               </div>
                               <div className="flex justify-between items-end mt-2">
                                   <span className="font-bold text-[#D4AF37]">R$ {extra.price.toLocaleString('pt-BR')}</span>
                                   <div className="flex items-center gap-2 bg-gray-50 rounded p-1">
                                       <button 
                                         onClick={() => handleUpdateExtra(extra.id, -1)} 
                                         className="w-6 h-6 flex items-center justify-center bg-white rounded shadow text-gray-600 hover:text-[#0F2820] disabled:opacity-50"
                                         disabled={!selectedExtras[extra.id]}
                                       >
                                         -
                                       </button>
                                       <span className="text-sm w-4 text-center font-bold">{selectedExtras[extra.id] || 0}</span>
                                       <button 
                                         onClick={() => handleUpdateExtra(extra.id, 1)}
                                         className="w-6 h-6 flex items-center justify-center bg-[#0F2820] text-white rounded shadow hover:bg-[#1a3c30]"
                                       >
                                         +
                                       </button>
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
           
           {/* Total Preview */}
           <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center text-xl font-serif font-bold text-[#0F2820]">
                    <span>Total Estimado:</span>
                    <span>R$ {(accommodationTotal + extrasTotal).toLocaleString('pt-BR')}</span>
                </div>
           </div>

           <button 
             onClick={() => setStep(2)}
             disabled={selectedRooms.length === 0}
             className="w-full bg-[#D4AF37] text-[#0F2820] py-4 rounded font-bold uppercase tracking-widest hover:bg-[#b8952b] transition shadow-lg flex items-center justify-center gap-2"
           >
              Continuar para Dados e Pagamento <ArrowRight size={20} />
           </button>
        </div>
      </div>
    );
  }

  // STEP 2: GUEST DATA & PAYMENT
  return (
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-[#D4AF37] animate-in fade-in slide-in-from-right-8">
        <div className="bg-[#0F2820] text-white p-6 border-b border-[#D4AF37] flex items-center gap-4">
           <button onClick={() => setStep(1)} className="hover:bg-white/20 p-2 rounded-full transition"><ChevronLeft/></button>
           <div>
              <h2 className="text-2xl font-serif">Passo 2 de 2</h2>
              <p className="text-[#D4AF37] text-sm tracking-widest uppercase">Dados Pessoais e Pagamento</p>
           </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
            {/* Main Guest Form */}
            <div className="space-y-4">
                <h3 className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><User size={20}/> Dados do Hóspede Principal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome Completo</label>
                        <div className="relative">
                           <User className="absolute left-3 top-3 text-gray-400" size={18} />
                           <input 
                              ref={nameRef}
                              type="text" 
                              value={name}
                              onChange={e => setName(e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.name ? 'border-red-500' : 'border-[#4A5D43]'}`}
                              placeholder="Seu nome completo"
                           />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CPF</label>
                        <div className="relative">
                           <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                           <input 
                              ref={cpfRef}
                              type="text" 
                              value={cpf}
                              onChange={e => {
                                  const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                  setCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
                              }}
                              className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.cpf ? 'border-red-500' : 'border-[#4A5D43]'}`}
                              placeholder="000.000.000-00"
                           />
                        </div>
                        {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail</label>
                        <div className="relative">
                           <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                           <input 
                              ref={emailRef}
                              type="email" 
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.email ? 'border-red-500' : 'border-[#4A5D43]'}`}
                              placeholder="seu@email.com"
                           />
                        </div>
                         {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">WhatsApp</label>
                        <div className="relative">
                           <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                           <input 
                              ref={phoneRef}
                              type="tel" 
                              value={phone}
                              onChange={e => {
                                  const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                  setPhone(v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3'));
                              }}
                              className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.phone ? 'border-red-500' : 'border-[#4A5D43]'}`}
                              placeholder="(00) 00000-0000"
                           />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                </div>
            </div>

            {/* Additional Guests Form */}
            {additionalGuests.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><Users size={20}/> Dados dos Acompanhantes <span className="text-xs font-normal text-gray-500">(Opcional)</span></h3>
                    <div className="space-y-3">
                        {additionalGuests.map((guest, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Nome Completo ({index + 1})</label>
                                    <input 
                                        value={guest.name}
                                        onChange={(e) => handleUpdateGuest(index, 'name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-[#4A5D43] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">CPF</label>
                                    <input 
                                        value={guest.cpf}
                                        onChange={(e) => {
                                            const v = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            handleUpdateGuest(index, 'cpf', v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'));
                                        }}
                                        className="w-full px-3 py-2 bg-white border border-[#4A5D43] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Idade</label>
                                    <input 
                                        value={guest.age}
                                        onChange={(e) => handleUpdateGuest(index, 'age', e.target.value.replace(/\D/g, '').slice(0, 3))}
                                        className="w-full px-3 py-2 bg-white border border-[#4A5D43] rounded focus:ring-1 focus:ring-[#D4AF37] outline-none text-sm"
                                        placeholder="Ex: 30"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Discount Code */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
                 <label className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><Tag size={18}/> Cupom de Desconto</label>
                 <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={discountCode}
                       onChange={e => setDiscountCode(e.target.value)}
                       placeholder="Possui um código?"
                       className="flex-1 p-3 border border-[#4A5D43] rounded-lg uppercase bg-[#F9F8F6]"
                     />
                     <button 
                       onClick={handleApplyDiscount}
                       className="bg-[#2F3A2F] text-[#E5D3B3] px-6 rounded-lg font-bold uppercase text-xs tracking-widest hover:bg-[#1f281f]"
                     >
                       Aplicar
                     </button>
                 </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-[#F9F8F6] p-6 rounded-lg border border-gray-200 space-y-2">
                <div className="flex justify-between text-gray-600">
                    <span>Hospedagem ({nights} noites)</span>
                    <span>R$ {accommodationTotal.toLocaleString('pt-BR')}</span>
                </div>
                {extrasTotal > 0 && (
                   <div className="flex justify-between text-gray-600">
                      <span>Extras e Serviços</span>
                      <span>R$ {extrasTotal.toLocaleString('pt-BR')}</span>
                   </div>
                )}
                {appliedDiscount && (
                    <div className="flex justify-between text-green-600 font-bold">
                       <span>Desconto ({appliedDiscount.code})</span>
                       <span>- R$ {appliedDiscount.amount.toLocaleString('pt-BR')}</span>
                    </div>
                )}
                <div className="border-t border-gray-300 my-2 pt-2 flex justify-between text-2xl font-serif font-bold text-[#0F2820]">
                    <span>Total a Pagar</span>
                    <span>R$ {total.toLocaleString('pt-BR')}</span>
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
               <h3 className="font-bold text-[#0F2820] uppercase tracking-wide flex items-center gap-2"><CreditCard size={20}/> Forma de Pagamento</h3>
               <div className="flex gap-4">
                  <button 
                    onClick={() => setPaymentMethod('PIX')}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'PIX' ? 'border-[#D4AF37] bg-[#F3E5AB]/20 text-[#0F2820]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                     <QrCode size={24} />
                     <span className="font-bold">PIX (Aprovação Imediata)</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${paymentMethod === 'CREDIT_CARD' ? 'border-[#D4AF37] bg-[#F3E5AB]/20 text-[#0F2820]' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
                  >
                     <CreditCard size={24} />
                     <span className="font-bold">Cartão de Crédito</span>
                  </button>
               </div>
               
               {paymentMethod === 'PIX' && (
                  <div className="bg-white border border-gray-200 p-6 rounded-lg flex flex-col items-center text-center animate-in fade-in">
                      <p className="text-sm text-gray-500 mb-4">Escaneie o QR Code abaixo ou copie a chave para pagar.</p>
                      <div className="bg-gray-100 p-4 rounded-lg mb-4">
                          <QrCode size={120} className="text-[#0F2820]" />
                      </div>
                      <div className="flex items-center gap-2 w-full max-w-sm">
                          <input readOnly value="00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000" className="flex-1 bg-gray-50 border border-gray-200 p-2 text-xs rounded text-gray-500 truncate" />
                          <button className="p-2 bg-[#0F2820] text-white rounded hover:bg-[#1a3c30]" title="Copiar"><Copy size={16}/></button>
                      </div>
                      <p className="text-xs text-[#D4AF37] font-bold mt-4 flex items-center gap-1"><ShieldCheck size={14}/> Pagamento Seguro</p>
                  </div>
               )}

               {paymentMethod === 'CREDIT_CARD' && (
                  <div className="bg-white border border-gray-200 p-6 rounded-lg space-y-4 animate-in fade-in">
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Número do Cartão</label>
                          <div className="relative">
                             <CreditCard className="absolute left-3 top-3 text-gray-400" size={18} />
                             <input 
                                ref={cardRef}
                                type="text"
                                value={cardNumber}
                                onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
                                className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.cardNumber ? 'border-red-500' : 'border-[#4A5D43]'}`}
                                placeholder="0000 0000 0000 0000"
                             />
                          </div>
                          {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Validade</label>
                              <input 
                                type="text"
                                value={cardExpiry}
                                onChange={e => {
                                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                                    if(v.length >= 2) setCardExpiry(`${v.slice(0,2)}/${v.slice(2)}`);
                                    else setCardExpiry(v);
                                }}
                                className={`w-full px-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.cardExpiry ? 'border-red-500' : 'border-[#4A5D43]'}`}
                                placeholder="MM/AA"
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CVV</label>
                              <div className="relative">
                                 <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                 <input 
                                    type="text"
                                    value={cardCvv}
                                    onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className={`w-full pl-10 pr-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.cardCvv ? 'border-red-500' : 'border-[#4A5D43]'}`}
                                    placeholder="123"
                                 />
                              </div>
                          </div>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome no Cartão</label>
                          <input 
                             type="text"
                             value={cardName}
                             onChange={e => setCardName(e.target.value.toUpperCase())}
                             className={`w-full px-4 py-3 bg-[#F9F8F6] border rounded-lg focus:ring-2 focus:ring-[#D4AF37] outline-none ${errors.cardName ? 'border-red-500' : 'border-[#4A5D43]'}`}
                             placeholder="COMO ESTÁ NO CARTÃO"
                          />
                           {errors.cardName && <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>}
                      </div>
                  </div>
               )}
            </div>

            {/* Aceite do Regulamento - Obrigatório para finalizar reserva */}
            <div className="border border-[#D4AF37] rounded-lg p-4 bg-[#F9F8F6]">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedRegulamento}
                  onChange={(e) => setAcceptedRegulamento(e.target.checked)}
                  className="mt-1 w-5 h-5 text-[#D4AF37] border-[#4A5D43] rounded focus:ring-[#D4AF37]"
                />
                <span className="text-sm text-[#0F2820]">
                  <strong>Li e aceito o </strong>
                  <button
                    type="button"
                    onClick={() => setShowRegulamento(true)}
                    className="text-[#16A34A] font-bold underline hover:text-[#15803D]"
                  >
                    Regulamento de Hospedagem e Cancelamento
                  </button>
                  <strong> do Hotel Solar.</strong>
                  <br />
                  <span className="text-xs text-gray-600">
                    É obrigatório aceitar o regulamento para concluir a reserva.
                  </span>
                </span>
              </label>
            </div>

            <button 
              onClick={handleFinalSubmit}
              disabled={!acceptedRegulamento}
              className="w-full bg-[#0F2820] text-white py-4 rounded font-bold uppercase tracking-widest hover:bg-[#1a3c30] transition shadow-lg flex items-center justify-center gap-2 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
               <CheckCircle size={24} className="text-[#D4AF37]" /> Confirmar Reserva e Pagar
            </button>
            
            {!acceptedRegulamento && (
              <p className="text-center text-sm text-red-600">
                ⚠️ Você precisa aceitar o regulamento para continuar
              </p>
            )}
        </div>
        
        {/* Modal de Regulamento */}
        {showRegulamento && (
          <RegulamentoHospedagem onClose={() => setShowRegulamento(false)} />
        )}
    </div>
  );
};

export default BookingForm;
