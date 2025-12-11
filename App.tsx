
import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import BookingForm from './components/BookingForm';
import ThankYouPage from './components/ThankYouPageSimple';
import AdminPanel, { AdminLogin } from './components/AdminPanel';
import RegulamentoHospedagem from './components/RegulamentoHospedagem';
import CancelReservationPage from './components/CancelReservationPage';
import { ViewState, Room, HolidayPackage, DiscountCode, HotelConfig, ExtraService, Reservation, ReservationStatus } from './types';
import { INITIAL_ROOMS, INITIAL_PACKAGES, INITIAL_DISCOUNTS, INITIAL_CONFIG, INITIAL_EXTRAS, INITIAL_RESERVATIONS } from './constants';
import { Star, MapPin, Wifi, Droplets, Utensils, Award, ShieldCheck, Calendar as CalendarIcon, ArrowRight, ChevronLeft, ChevronRight, BedDouble, Users, Check, Crown, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { fetchRooms, fetchPackages, fetchExtras, fetchDiscounts, fetchConfig, fetchReservations, createRoom, updateRoom, deleteRoom, createPackage, updatePackage, deletePackage, createExtra, updateExtra, deleteExtra, createDiscount, updateDiscount, deleteDiscount, updateConfig as updateConfigAPI } from './services/apiService';

// Interface for History Snapshot
interface HistoryState {
  rooms: Room[];
  packages: HolidayPackage[];
  discounts: DiscountCode[];
  extras: ExtraService[];
}

const App: React.FC = () => {
  // Application State (Lifted Up)
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]); // Array for multi-select
  const [selectedPackagePrice, setSelectedPackagePrice] = useState<number | null>(null);
  
  // Data State (Editable by Admin)
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [packages, setPackages] = useState<HolidayPackage[]>(INITIAL_PACKAGES);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);
  const [extras, setExtras] = useState<ExtraService[]>(INITIAL_EXTRAS);
  const [config, setConfig] = useState<HotelConfig>(INITIAL_CONFIG);

  // Reservations State (NEW)
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);

  // History State for Undo/Redo
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Admin Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  // Thank You Page State
  const [completedReservationId, setCompletedReservationId] = useState<string>('');
  const [completedGuestEmail, setCompletedGuestEmail] = useState<string>('');
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  // Refs for scrolling
  const roomsSectionRef = useRef<HTMLDivElement>(null);

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Check URL parameters for pre-selected date
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const checkInParam = params.get('checkin');
    const checkOutParam = params.get('checkout');
    
    console.log('[URL Params Debug]', { dateParam, checkInParam, checkOutParam });
    
    if (dateParam) {
      // Single date parameter - set as check-in
      const date = new Date(dateParam);
      if (!isNaN(date.getTime())) {
        console.log('[Setting Check-in from date param]', date);
        setCheckIn(date);
        setCurrentCalendarDate(date);
      }
    } else if (checkInParam) {
      // Check-in and optional check-out parameters
      // Parse date in local timezone to avoid timezone issues
      const [cY, cM, cD] = checkInParam.split('-').map(Number);
      const checkInDate = new Date(cY, cM - 1, cD);
      console.log('[Check-in Date parsed]', checkInDate, 'From:', checkInParam, 'Valid:', !isNaN(checkInDate.getTime()));
      
      if (!isNaN(checkInDate.getTime())) {
        setCheckIn(checkInDate);
        setCurrentCalendarDate(checkInDate);
        
        if (checkOutParam) {
          // Parse checkout date in local timezone
          const [oY, oM, oD] = checkOutParam.split('-').map(Number);
          const checkOutDate = new Date(oY, oM - 1, oD);
          console.log('[Check-out Date parsed]', checkOutDate, 'From:', checkOutParam, 'Valid:', !isNaN(checkOutDate.getTime()));
          
          if (!isNaN(checkOutDate.getTime())) {
            setCheckOut(checkOutDate);
            console.log('[Dates set]', { checkIn: checkInDate, checkOut: checkOutDate });
          }
        }
      }
    }
  }, []);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        
        // Load all data independently with individual error handling
        const [roomsData, packagesData, extrasData, discountsData, configData, reservationsData] = await Promise.allSettled([
          fetchRooms(),
          fetchPackages(),
          fetchExtras(),
          fetchDiscounts(),
          fetchConfig(),
          fetchReservations()
        ]);

        // Set rooms data or fallback to initial
        if (roomsData.status === 'fulfilled') {
          setRooms(roomsData.value);
        } else {
          console.error('Failed to load rooms:', roomsData.reason);
          setRooms(INITIAL_ROOMS);
        }

        // Set packages data or fallback to initial
        if (packagesData.status === 'fulfilled') {
          setPackages(packagesData.value);
        } else {
          console.error('Failed to load packages:', packagesData.reason);
          setPackages(INITIAL_PACKAGES);
        }

        // Set extras data or fallback to initial
        if (extrasData.status === 'fulfilled') {
          setExtras(extrasData.value);
        } else {
          console.error('Failed to load extras:', extrasData.reason);
          setExtras(INITIAL_EXTRAS);
        }

        // Set discounts data or fallback to initial
        if (discountsData.status === 'fulfilled') {
          setDiscounts(discountsData.value);
        } else {
          console.error('Failed to load discounts:', discountsData.reason);
          setDiscounts(INITIAL_DISCOUNTS);
        }

        // Set config data or fallback to initial
        if (configData.status === 'fulfilled') {
          setConfig(configData.value);
        } else {
          console.error('Failed to load config:', configData.reason);
          setConfig(INITIAL_CONFIG);
        }

        // Set reservations data or fallback to initial
        if (reservationsData.status === 'fulfilled') {
          setReservations(reservationsData.value);
        } else {
          console.error('Failed to load reservations:', reservationsData.reason);
          setReservations(INITIAL_RESERVATIONS);
        }

        setIsLoadingData(false);
      } catch (error) {
        console.error('Error loading data:', error);
        // Keep initial data on error
        setIsLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Check URL parameters for admin view and reservation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const reservationId = params.get('reservation');

    if (view === 'admin') {
      setCurrentView(ViewState.ADMIN);
      
      // If there's a reservation ID, wait for data to load then open it
      if (reservationId && !isLoadingData) {
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
          // AdminPanel will handle opening the modal via selectedReservation
          // We need to pass this through props or use a different approach
          console.log('Reservation found:', reservationId);
        }
      }
    }
  }, [isLoadingData, reservations]);

  // --- HISTORY LOGIC ---
  const saveCheckpoint = () => {
     const currentSnapshot: HistoryState = {
        rooms: [...rooms],
        packages: [...packages],
        discounts: [...discounts],
        extras: [...extras]
     };
     setPast(prev => [...prev, currentSnapshot]);
     setFuture([]); // Clear future when new action happens
  };

  const handleUndo = () => {
     if (past.length === 0) return;
     const previous = past[past.length - 1];
     const newPast = past.slice(0, -1);

     // Save current to future before undoing
     const currentSnapshot: HistoryState = { rooms, packages, discounts, extras };
     setFuture(prev => [currentSnapshot, ...prev]);

     // Restore state
     setRooms(previous.rooms);
     setPackages(previous.packages);
     setDiscounts(previous.discounts);
     setExtras(previous.extras);
     
     setPast(newPast);
  };

  const handleRedo = () => {
     if (future.length === 0) return;
     const next = future[0];
     const newFuture = future.slice(1);

     // Save current to past before redoing
     const currentSnapshot: HistoryState = { rooms, packages, discounts, extras };
     setPast(prev => [...prev, currentSnapshot]);

     // Restore state
     setRooms(next.rooms);
     setPackages(next.packages);
     setDiscounts(next.discounts);
     setExtras(next.extras);

     setFuture(newFuture);
  };

  // Wrappers for state updaters to include history saving and Postgres sync
  const updateRoomsWithHistory = async (newRooms: Room[]) => {
     saveCheckpoint();
     setRooms(newRooms);
     
     // Sync with Postgres
     try {
      // Detect changes and sync with database
      const oldRoomIds: Set<string> = new Set(rooms.map(r => r.id));
      const newRoomIds: Set<string> = new Set(newRooms.map(r => r.id));
       
      // Find deleted rooms
      const deletedIds = Array.from(oldRoomIds).filter(id => !newRoomIds.has(id));
      for (const id of deletedIds) {
        if (typeof id === 'string') {
          await deleteRoom(id).catch(err => console.error('Failed to delete room:', err));
        }
      }
       
       // Find new or updated rooms
       for (const room of newRooms) {
         if (!oldRoomIds.has(room.id)) {
           // New room
           await createRoom(room).catch(err => console.error('Failed to create room:', err));
         } else {
           // Check if updated
           const oldRoom = rooms.find(r => r.id === room.id);
           if (JSON.stringify(oldRoom) !== JSON.stringify(room)) {
             await updateRoom(room).catch(err => console.error('Failed to update room:', err));
           }
         }
       }
     } catch (error) {
       console.error('Error syncing rooms with Postgres:', error);
     }
  };

  const updatePackagesWithHistory = async (newPackages: HolidayPackage[]) => {
     saveCheckpoint();
     setPackages(newPackages);
     
     // Sync with Postgres
    try {
      const oldPackageIds: Set<string> = new Set(packages.map(p => p.id));
      const newPackageIds: Set<string> = new Set(newPackages.map(p => p.id));
       
      // Find deleted packages
      const deletedIds = Array.from(oldPackageIds).filter(id => !newPackageIds.has(id));
      for (const id of deletedIds) {
        if (typeof id === 'string') {
          await deletePackage(id).catch(err => console.error('Failed to delete package:', err));
        }
      }
       
       // Find new or updated packages
       for (const pkg of newPackages) {
         if (!oldPackageIds.has(pkg.id)) {
           await createPackage(pkg).catch(err => console.error('Failed to create package:', err));
         } else {
           const oldPkg = packages.find(p => p.id === pkg.id);
           if (JSON.stringify(oldPkg) !== JSON.stringify(pkg)) {
             await updatePackage(pkg).catch(err => console.error('Failed to update package:', err));
           }
         }
       }
     } catch (error) {
       console.error('Error syncing packages with Postgres:', error);
     }
  };

  const updateDiscountsWithHistory = async (newDiscounts: DiscountCode[]) => {
     saveCheckpoint();
     setDiscounts(newDiscounts);
     
     // Sync with Postgres
    try {
      const oldDiscountCodes: Set<string> = new Set(discounts.map(d => d.code));
      const newDiscountCodes: Set<string> = new Set(newDiscounts.map(d => d.code));
       
      // Find deleted discounts
      const deletedCodes = Array.from(oldDiscountCodes).filter(code => !newDiscountCodes.has(code));
      for (const code of deletedCodes) {
        if (typeof code === 'string') {
          await deleteDiscount(code).catch(err => console.error('Failed to delete discount:', err));
        }
      }
       
       // Find new or updated discounts
       for (const discount of newDiscounts) {
         if (!oldDiscountCodes.has(discount.code)) {
           await createDiscount(discount).catch(err => console.error('Failed to create discount:', err));
         } else {
           const oldDiscount = discounts.find(d => d.code === discount.code);
           if (JSON.stringify(oldDiscount) !== JSON.stringify(discount)) {
             await updateDiscount(discount).catch(err => console.error('Failed to update discount:', err));
           }
         }
       }
     } catch (error) {
       console.error('Error syncing discounts with Postgres:', error);
     }
  };

  const updateExtrasWithHistory = async (newExtras: ExtraService[]) => {
     saveCheckpoint();
     setExtras(newExtras);
     
     // Sync with Postgres
    try {
      const oldExtraIds: Set<string> = new Set(extras.map(e => e.id));
      const newExtraIds: Set<string> = new Set(newExtras.map(e => e.id));
       
      // Find deleted extras
      const deletedIds = Array.from(oldExtraIds).filter(id => !newExtraIds.has(id));
      for (const id of deletedIds) {
        if (typeof id === 'string') {
          await deleteExtra(id).catch(err => console.error('Failed to delete extra:', err));
        }
      }
       
       // Find new or updated extras
       for (const extra of newExtras) {
         if (!oldExtraIds.has(extra.id)) {
           await createExtra(extra).catch(err => console.error('Failed to create extra:', err));
         } else {
           const oldExtra = extras.find(e => e.id === extra.id);
           if (JSON.stringify(oldExtra) !== JSON.stringify(extra)) {
             await updateExtra(extra).catch(err => console.error('Failed to update extra:', err));
           }
         }
       }
     } catch (error) {
       console.error('Error syncing extras with Postgres:', error);
     }
  };

  // --- RESERVATION HANDLERS ---
  const handleAddReservation = (reservation: Reservation) => {
      setReservations(prev => [reservation, ...prev]);
  };

  const handleUpdateReservationStatus = (id: string, status: ReservationStatus) => {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Filter only active items for public view
  const activeRooms = rooms.filter(r => r.active);
  const activePackages = packages.filter(p => p.active);

  // Collect Restricted Dates
  const restrictedCheckInDates = new Set<string>();
  const restrictedCheckOutDates = new Set<string>();
  activePackages.forEach(p => {
    if (p.noCheckInDates) p.noCheckInDates.forEach(d => restrictedCheckInDates.add(d));
    if (p.noCheckoutDates) p.noCheckoutDates.forEach(d => restrictedCheckOutDates.add(d));
  });

  // Calculate nights for price display
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const selectedNights = calculateNights();

  // Helper to get package on a specific date
  const getPackageOnDate = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    return activePackages.find(p => {
      const startDate = p.startIsoDate.split('T')[0];
      const endDate = p.endIsoDate.split('T')[0];
      return iso >= startDate && iso <= endDate;
    });
  };

  // Helper to get room override for specific date
  const getRoomOverride = (room: Room, date: Date) => {
      const iso = date.toISOString().split('T')[0];
      return room.overrides?.find(o => o.dateIso === iso);
  };

  // Calculate Total Price considering daily overrides
  const calculateTotalRoomPrice = (room: Room) => {
     if (!checkIn || !checkOut) return room.price;
     
     let total = 0;
     let tempDate = new Date(checkIn);
     const endDate = new Date(checkOut);
     
     while (tempDate < endDate) {
         const override = getRoomOverride(room, tempDate);
         let dailyPrice = override?.price !== undefined ? override.price : room.price;
         
         // Fallback basic weekend logic if no specific override
         if (override?.price === undefined) {
            const day = tempDate.getDay();
            if (day === 5 || day === 6) dailyPrice *= 1.15; // +15% on weekends default
         }
         
         total += dailyPrice;
         tempDate.setDate(tempDate.getDate() + 1);
     }
     
     return Math.round(total);
  };

  // NEW: Check Availability considering totalQuantity and overrides
  const checkAvailability = (room: Room) => {
      // Basic check if dates not selected: if stock is 0, it's unavailable
      if (!checkIn || !checkOut) {
          return room.totalQuantity > 0 && room.price > 0;
      }

      let tempDate = new Date(checkIn);
      const endDate = new Date(checkOut);

      while (tempDate < endDate) {
          const override = getRoomOverride(room, tempDate);
          
          const qty = override?.availableQuantity !== undefined ? override.availableQuantity : room.totalQuantity;
          const price = override?.price !== undefined ? override.price : room.price;
          const closed = override?.isClosed;

          if (closed || price === 0 || qty === 0) return false;

          tempDate.setDate(tempDate.getDate() + 1);
      }
      return true;
  };


  // Handlers
  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (clickedDate < today) {
        alert("Não é possível selecionar datas passadas.");
        return;
    }

    const isoDate = clickedDate.toISOString().split('T')[0];

    // Reset if cycle complete
    if (checkIn && checkOut) {
      if (restrictedCheckInDates.has(isoDate)) {
        alert("Check-in não permitido nesta data.");
        return;
      }
      setCheckIn(clickedDate);
      setCheckOut(null);
      return;
    }

    // Set Check-out
    if (checkIn && !checkOut) {
      if (clickedDate <= checkIn) {
         if (restrictedCheckInDates.has(isoDate)) {
            alert("Check-in não permitido nesta data.");
            return;
         }
         setCheckIn(clickedDate);
         return;
      }
      
      if (restrictedCheckOutDates.has(isoDate)) {
        alert("Check-out não permitido nesta data.");
        return;
      }

      setCheckOut(clickedDate);
      
      // Auto Scroll to Rooms
      setTimeout(() => {
        roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      return;
    }

    // Set Check-in (First click)
    if (restrictedCheckInDates.has(isoDate)) {
        alert("Check-in não permitido nesta data.");
        return;
    }
    setCheckIn(clickedDate);
  };

  const handleAddToBooking = (room: Room) => {
    if (!checkIn || !checkOut) {
        alert("Por favor, selecione as datas de Check-in e Check-out no calendário antes de adicionar um quarto.");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    // Add room to selection array
    setSelectedRooms(prev => [...prev, room]);
    setSelectedPackagePrice(null); // Clear fixed package price if switching to regular booking
  };

  const handleRemoveFromBooking = (index: number) => {
      const newSelected = [...selectedRooms];
      newSelected.splice(index, 1);
      setSelectedRooms(newSelected);
      if (newSelected.length === 0) {
        setSelectedPackagePrice(null);
      }
  };

  const handlePackageSelect = (pkg: HolidayPackage, roomId: string, price: number) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const [sY, sM, sD] = pkg.startIsoDate.split('-').map(Number);
    const [eY, eM, eD] = pkg.endIsoDate.split('-').map(Number);
    
    setCheckIn(new Date(sY, sM - 1, sD));
    setCheckOut(new Date(eY, eM - 1, eD));
    
    // Packages are exclusive selection for simplicity in this flow
    setSelectedRooms([room]);
    setSelectedPackagePrice(price);
    setCurrentView(ViewState.BOOKING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateGrandTotal = () => {
      // If fixed package price active (and single room), return that. 
      // Note: Multi-room + package fixed price logic would require complex cart. 
      // We assume if packagePrice is set, it's a single room package flow.
      if (selectedPackagePrice && selectedRooms.length === 1) return selectedPackagePrice;

      return selectedRooms.reduce((acc, room) => acc + calculateTotalRoomPrice(room), 0);
  };

  // --- RENDERERS ---

  const renderCalendar = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    const today = new Date();
    today.setHours(0,0,0,0);

    const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1));

    return (
      <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-sm shadow-2xl max-w-4xl mx-auto border-t-4 border-[#D4AF37]">
        <div className="flex justify-between items-center mb-6">
           <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronLeft className="text-[#0F2820]"/></button>
           <h3 className="font-serif text-2xl text-[#0F2820] capitalize font-bold tracking-wide">
             {currentCalendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
           </h3>
           <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition"><ChevronRight className="text-[#0F2820]"/></button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
           {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => (
              <div key={d} className="text-center text-xs font-bold text-gray-400 tracking-widest">{d}</div>
           ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
           {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
           {Array(daysInMonth).fill(null).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const iso = date.toISOString().split('T')[0];
              const isPast = date < today;
              
              let isSelected = false;
              let inRange = false;
              
              // Selection Logic - Simplified to ensure checkout is always marked
              if (checkIn && checkOut) {
                // If both dates are set, mark the entire range including checkout
                if (date >= checkIn && date <= checkOut) {
                  inRange = true;
                  if (day === 12 || day === 13 || day === 14 || day === 15) {
                    console.log(`[Calendar Day ${day}]`, { date, checkIn, checkOut, inRange, 'date >= checkIn': date >= checkIn, 'date <= checkOut': date <= checkOut });
                  }
                }
              } else if (checkIn && date.getTime() === checkIn.getTime()) {
                // Only check-in is set
                isSelected = true;
              }

              const pkg = getPackageOnDate(date);
              
              // Restrictions styling
              const noCheckIn = restrictedCheckInDates.has(iso);
              const noCheckOut = restrictedCheckOutDates.has(iso);

              // Styling
              let bgClass = "bg-white hover:border-[#D4AF37]";
              let textClass = "text-gray-700";
              let borderClass = "border-gray-200";

              if (isPast) {
                 bgClass = "bg-gray-100 opacity-50 cursor-not-allowed";
                 textClass = "text-gray-400";
              } else if (isSelected) {
                 bgClass = "bg-[#2F3A2F]"; // Moss Green
                 textClass = "text-[#E5D3B3] font-bold"; // Sand
                 borderClass = "border-[#2F3A2F]";
              } else if (inRange) {
                 bgClass = "bg-[#2F3A2F]"; // Moss Green Solid
                 textClass = "text-[#E5D3B3] font-bold"; // Sand
                 borderClass = "border-[#2F3A2F]";
              } else if (pkg) {
                 bgClass = "bg-[#F3E5AB]/30"; // Light Gold
                 borderClass = "border-[#D4AF37]/50";
              }

              return (
                 <div 
                    key={day}
                    onClick={() => !isPast && handleDateClick(day)}
                    className={`
                       h-14 md:h-28 border rounded-sm p-1 md:p-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden
                       ${bgClass} ${textClass} ${borderClass}
                    `}
                 >
                    <div className="flex justify-between items-start">
                       <span className={`text-sm md:text-lg leading-none ${isSelected || inRange ? 'text-[#E5D3B3]' : ''}`}>{day}</span>
                       <div className="flex gap-0.5">
                          {noCheckIn && !isPast && <span title="Sem check-in" className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-orange-400"></span>}
                          {noCheckOut && !isPast && <span title="Sem check-out" className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-red-400"></span>}
                       </div>
                    </div>
                    
                    {pkg && !isPast && (
                       <div className={`text-[8px] md:text-xs leading-tight font-medium whitespace-nowrap md:whitespace-normal overflow-hidden text-ellipsis p-0.5 md:p-1 rounded-sm ${inRange || isSelected ? 'text-[#E5D3B3] bg-white/10' : 'text-[#D4AF37] bg-[#F3E5AB]/50'}`}>
                          {pkg.name}
                       </div>
                    )}
                 </div>
              );
           })}
        </div>
        
        {/* Helper Text */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#2F3A2F] border border-[#2F3A2F]"></div> Selecionado</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#F3E5AB]/30 border border-[#D4AF37]/50"></div> Pacote Especial</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Check-in Restrito</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> Check-out Restrito</div>
        </div>
      </div>
    );
  };

  const renderRooms = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4" ref={roomsSectionRef}>
      {activeRooms.map(room => {
        const total = calculateTotalRoomPrice(room);
        const nights = selectedNights;
        
        // Availability Logic: Check Price AND Inventory
        const isAvailable = checkAvailability(room);
        const isUnavailable = !isAvailable;

        return (
          <div key={room.id} className="group bg-white rounded-sm overflow-hidden shadow-lg border border-transparent hover:border-[#D4AF37] transition-all duration-300 flex flex-col">
            <div className="relative h-64 overflow-hidden">
               <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
               <div className="absolute top-4 right-4 bg-[#D4AF37] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest shadow-md">
                  Recomendado
               </div>
               {/* Capacity Badge */}
               <div className="absolute bottom-4 left-4 bg-[#0F2820]/90 backdrop-blur-sm text-white px-3 py-1.5 text-xs flex items-center gap-1 rounded-sm shadow-sm border border-[#D4AF37]/30">
                  <Users size={12} className="text-[#D4AF37]"/> Acomoda até {room.capacity} pessoas
               </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
               <h3 className="text-xl font-serif text-[#0F2820] mb-2">{room.name}</h3>
               <p className="text-gray-500 text-sm mb-4 line-clamp-2 font-light">{room.description}</p>
               
               <div className="flex flex-wrap gap-2 mb-6">
                  {room.features.slice(0, 3).map((f, i) => (
                    <span key={i} className="text-[10px] uppercase tracking-wider bg-[#F9F8F6] text-gray-600 px-2 py-1 rounded-sm border border-gray-100">
                      {f}
                    </span>
                  ))}
               </div>

               <div className="mt-auto border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-end mb-4">
                     <div>
                        {checkIn && checkOut ? (
                           <>
                              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Valor Total ({nights} noites)</p>
                              {isUnavailable ? (
                                  <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Indisponível</span>
                              ) : (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-[#D4AF37]">R$</span>
                                    <span className="text-2xl font-serif text-[#0F2820]">{total.toLocaleString('pt-BR')}</span>
                                  </div>
                              )}
                           </>
                        ) : (
                           <>
                              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Diária a partir de</p>
                              {room.price === 0 ? (
                                 <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sob Consulta</span>
                              ) : (
                                 <div className="flex items-baseline gap-1">
                                    <span className="text-xs text-[#D4AF37]">R$</span>
                                    <span className="text-2xl font-serif text-[#0F2820]">{room.price.toLocaleString('pt-BR')}</span>
                                 </div>
                              )}
                           </>
                        )}
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => handleAddToBooking(room)}
                    disabled={isUnavailable}
                    className={`w-full py-3 rounded-sm font-bold uppercase text-xs tracking-[0.2em] transition shadow-lg flex items-center justify-center gap-2 
                       ${isUnavailable 
                         ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                         : 'bg-[#0F2820] text-white hover:bg-[#1a3c30] group-hover:gap-3'
                       }`}
                  >
                    {isUnavailable ? 'Indisponível' : 'Adicionar à Reserva'} 
                    {!isUnavailable && <ArrowRight className="h-4 w-4 text-[#D4AF37]" />}
                  </button>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPackages = () => (
    <div className="max-w-7xl mx-auto px-4 grid gap-12">
      {activePackages.map((pkg, index) => (
        <div key={pkg.id} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
           <div className="w-full md:w-1/2 relative group">
              <div className="absolute inset-0 bg-[#0F2820] translate-x-4 translate-y-4 rounded-sm transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
              <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-80 object-cover rounded-sm relative z-10 shadow-xl" />
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2">
                 <span className="block text-2xl font-serif text-[#0F2820] text-center font-bold">
                    {new Date(pkg.startIsoDate).getDate()}
                 </span>
                 <span className="block text-xs uppercase tracking-widest text-center text-gray-500">
                    {new Date(pkg.startIsoDate).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                 </span>
              </div>
           </div>
           
           <div className="w-full md:w-1/2 space-y-6">
              <div>
                 <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em] mb-2 block">Experiência Exclusiva</span>
                 <h2 className="text-4xl font-serif text-[#0F2820] mb-4">{pkg.name}</h2>
                 <p className="text-gray-600 leading-relaxed font-light">{pkg.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-[#D4AF37]/30 py-6">
                 {pkg.includes.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full"></div>
                       <span className="text-sm text-gray-700">{item}</span>
                    </div>
                 ))}
              </div>

              <div>
                  <h4 className="font-serif text-[#0F2820] mb-3 text-lg">Escolha sua Acomodação:</h4>
                  <div className="grid gap-3">
                      {pkg.roomPrices.map(rp => {
                          const room = rooms.find(r => r.id === rp.roomId);
                          if (!room) return null;
                          return (
                              <button 
                                key={rp.roomId}
                                onClick={() => handlePackageSelect(pkg, rp.roomId, rp.price)}
                                className="w-full flex justify-between items-center p-4 border border-gray-200 hover:border-[#D4AF37] hover:bg-[#F9F8F6] rounded-sm transition group text-left"
                              >
                                  <div className="flex items-center gap-3">
                                      <img src={room.imageUrl} className="w-10 h-10 rounded-sm object-cover" alt="" />
                                      <div>
                                          <p className="font-bold text-[#0F2820] text-sm group-hover:text-[#D4AF37] transition">{room.name}</p>
                                          <p className="text-xs text-gray-400">Pacote Completo</p>
                                      </div>
                                  </div>
                                  <span className="font-serif text-lg text-[#0F2820]">R$ {rp.price.toLocaleString('pt-BR')}</span>
                              </button>
                          );
                      })}
                  </div>
              </div>
           </div>
        </div>
      ))}
    </div>
  );

  // --- FLOATING BOOKING BAR (CART) ---
  const renderFloatingBar = () => {
     if (selectedRooms.length === 0 || currentView === ViewState.BOOKING || currentView === ViewState.ADMIN) return null;

     return (
        <div className="fixed bottom-0 left-0 w-full bg-[#0F2820] text-[#E5D3B3] p-4 md:px-8 shadow-2xl z-50 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-full border-t border-[#D4AF37]">
           <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
               <div className="p-2 bg-[#D4AF37] text-[#0F2820] rounded-full shadow-lg animate-bounce">
                  <ShoppingCart size={20} />
               </div>
               <div className="flex flex-col">
                   <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]">Sua Seleção</span>
                   <div className="flex items-baseline gap-2">
                       <span className="font-serif text-xl text-white">{selectedRooms.length} Acomodaç{selectedRooms.length > 1 ? 'ões' : 'ão'}</span>
                       <span className="text-xs opacity-50 hidden md:inline">|</span>
                       <span className="text-sm font-bold text-[#E5D3B3] hidden md:inline">Total Estimado: R$ {calculateGrandTotal().toLocaleString('pt-BR')}</span>
                   </div>
               </div>
           </div>

           <div className="flex gap-3 w-full md:w-auto">
              <button
                 onClick={() => {
                    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    setCurrentView(ViewState.HOME); // Ensure we are on a view where rooms are visible or just scroll
                 }}
                 className="flex-1 md:flex-none px-4 py-3 border border-[#D4AF37] text-[#D4AF37] rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#2F3A2F] transition whitespace-nowrap"
              >
                 + Adicionar Mais
              </button>
              <button
                 onClick={() => {
                     setCurrentView(ViewState.BOOKING);
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                 }}
                 className="flex-1 md:flex-none px-6 py-3 bg-[#D4AF37] text-[#0F2820] rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-[#b8952b] shadow-lg flex items-center justify-center gap-2 transition transform hover:-translate-y-1"
              >
                 Finalizar Reserva <ArrowRight size={16} />
              </button>
           </div>
        </div>
     );
  };

  // --- MAIN RENDER ---

  if (currentView === ViewState.ADMIN) {
    if (!isAdminLoggedIn) return <AdminLogin onLogin={() => setIsAdminLoggedIn(true)} />;
    return (
      <AdminPanel 
        rooms={rooms}
        packages={packages}
        discounts={discounts}
        extras={extras}
        config={config}
        reservations={reservations} // Pass Reservations
        // Pass wrapped functions that include history logic
        onUpdateRooms={updateRoomsWithHistory}
        onUpdatePackages={updatePackagesWithHistory}
        onUpdateDiscounts={updateDiscountsWithHistory}
        onUpdateExtras={updateExtrasWithHistory}
        onUpdateConfig={async (newConfig: HotelConfig) => {
          setConfig(newConfig);
          try {
            await updateConfigAPI(newConfig).catch(err => console.error('Failed to update config:', err));
          } catch (error) {
            console.error('Error syncing config with Postgres:', error);
          }
        }}
        onUpdateReservationStatus={handleUpdateReservationStatus}
        onLogout={() => { setIsAdminLoggedIn(false); setCurrentView(ViewState.HOME); }}
        
        // History Props
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
    );
  }

  // Check URL for special pages
  const urlParams = new URLSearchParams(window.location.search);
  const showRegulamento = window.location.pathname === '/regulamento';
  const cancelReservationId = urlParams.get('id');
  const showCancelPage = window.location.pathname === '/cancelar-reserva' && cancelReservationId;

  // Debug: Log current view
  console.log('DEBUG: App render - currentView =', currentView);
  
  // Render special pages
  if (showRegulamento) {
    return <RegulamentoHospedagem onClose={() => window.location.href = '/'} />;
  }

  if (showCancelPage) {
    return <CancelReservationPage reservationId={cancelReservationId} onClose={() => window.location.href = '/'} />;
  }

  return (
    <div className={`min-h-screen font-sans ${currentView === ViewState.THANK_YOU ? 'bg-transparent p-0' : 'bg-[#F9F8F6] pb-24'} relative`}>
      {currentView !== ViewState.THANK_YOU && (
        <Navbar currentView={currentView} onNavigate={setCurrentView} />
      )}
      
      {/* Floating Cart Bar */}
      {currentView !== ViewState.THANK_YOU && renderFloatingBar()}
      
      {/* Home View */}
      {currentView === ViewState.HOME && (
        <>
          {/* Hero */}
          <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0">
               <div className="absolute inset-0 bg-black/40 z-10"></div>
               <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#0F2820]/90 z-10"></div>
               <img 
                 src="/hero-image.jpg" 
                 className="w-full h-full object-cover animate-in fade-in duration-1000 scale-105" 
                 alt="Hotel Solar Pier"
               />
            </div>
            
            <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
               <span className="block text-[#D4AF37] text-sm md:text-base font-bold tracking-[0.3em] uppercase mb-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
                  Bem-vindo ao Hotel Solar
               </span>
               <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-8 leading-tight drop-shadow-2xl animate-in slide-in-from-bottom-8 duration-700 delay-200">
                 Reserva on-line
               </h1>
            </div>
          </section>

          {/* Calendar Section */}
          <section className="relative z-30 -mt-24 px-4 pb-12">
            {renderCalendar()}
            
            {/* Share Link Button */}
            {checkIn && checkOut && (
              <div className="max-w-4xl mx-auto mt-6 flex justify-center">
                <button
                  onClick={() => {
                    const checkInIso = checkIn.toISOString().split('T')[0];
                    const checkOutIso = checkOut.toISOString().split('T')[0];
                    const shareUrl = `${window.location.origin}/?checkin=${checkInIso}&checkout=${checkOutIso}`;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      alert(`Link copiado para compartilhar!\n\n${shareUrl}\n\nEnvie este link para o cliente continuar a reserva com as datas já selecionadas.`);
                    }).catch(err => {
                      console.error('Erro ao copiar:', err);
                      prompt('Copie este link:', shareUrl);
                    });
                  }}
                  className="bg-[#D4AF37] hover:bg-[#C4A037] text-[#0F2820] px-6 py-3 rounded-sm font-bold transition-all flex items-center gap-2 shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Compartilhar Link desta Reserva
                </button>
              </div>
            )}
          </section>

          {/* Rooms Section */}
          <section className="py-20 max-w-7xl mx-auto">
             <div className="text-center mb-16">
                <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em]">Exclusividade</span>
                <h2 className="text-4xl font-serif text-[#0F2820] mt-3">Nossas Acomodações</h2>
                <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
             </div>
             {renderRooms()}
          </section>
        </>
      )}

      {/* Rooms View (Full List) */}
      {currentView === ViewState.ROOMS && (
         <div className="py-20 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-serif text-[#0F2820]">Todas as Acomodações</h2>
            </div>
            {renderRooms()}
         </div>
      )}

      {/* Packages View */}
      {currentView === ViewState.PACKAGES && (
         <div className="py-20 bg-[#F9F8F6]">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-serif text-[#0F2820]">Pacotes Especiais</h2>
            </div>
            {renderPackages()}
         </div>
      )}

      {/* Thank You Page */}
      {currentView === ViewState.THANK_YOU && (
        <>
        {console.log('RENDERING THANK YOU PAGE', { reservationId: completedReservationId, guestEmail: completedGuestEmail, paymentMethod: completedPaymentMethod })}
        <ThankYouPage
          reservationId={completedReservationId}
          guestEmail={completedGuestEmail}
          paymentMethod={completedPaymentMethod}
          onBackToHome={() => {
            setCurrentView(ViewState.HOME);
            setSelectedRooms([]);
            setCheckIn(null);
            setCheckOut(null);
            setSelectedPackagePrice(null);
          }}
        />
        </>
      )}

      {/* Booking View */}
      {currentView === ViewState.BOOKING && (
         <div className="py-12 max-w-4xl mx-auto px-4">
             <BookingForm 
                selectedRooms={selectedRooms} 
                discountCodes={discounts}
                extras={extras}
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
                preSelectedPackagePrice={selectedPackagePrice}
                onRemoveRoom={handleRemoveFromBooking}
                onAddReservation={handleAddReservation}
                onReservationComplete={(reservationId, guestEmail, paymentMethod) => {
                  console.log('DEBUG: onReservationComplete callback received', { reservationId, guestEmail, paymentMethod });
                  setCompletedReservationId(reservationId);
                  setCompletedGuestEmail(guestEmail);
                  setCompletedPaymentMethod(paymentMethod);
                  console.log('DEBUG: Setting currentView to THANK_YOU');
                  setCurrentView(ViewState.THANK_YOU);
                  console.log('DEBUG: currentView set to THANK_YOU');
                }}
             />
         </div>
      )}

      {/* Footer */}
      <footer className="bg-[#0F2820] text-white pt-8 pb-6 border-t border-[#D4AF37]">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="mb-4 flex justify-center">
               <img 
                 src="/hotel-solar-logo.png" 
                 alt="Hotel Solar" 
                 className="h-16 w-auto object-contain"
               />
            </div>
            
            <div className="space-y-1 text-sm text-gray-400 font-light mb-6">
               <p>Av. Atlântica • CEP 68721-000 • Salinópolis - PA</p>
               <p>Tel: (91) 98100-0800</p>
               <p>E-mail: reserva@hotelsolar.tur.br</p>
            </div>

            <div className="text-xs text-[#4A5D43] pt-4 border-t border-[#4A5D43]/30">
               <p>&copy; {new Date().getFullYear()} Hotel Solar. Todos os direitos reservados.</p>
               <button onClick={() => setCurrentView(ViewState.ADMIN)} className="mt-4 hover:text-[#D4AF37] transition opacity-50 hover:opacity-100">Área Administrativa</button>
            </div>
         </div>
      </footer>

      {/* Chat Assistant */}
      <ChatAssistant 
        rooms={rooms} 
        packages={packages} 
        extras={extras}
        currentView={currentView}
        selectedRooms={selectedRooms}
        checkIn={checkIn}
        checkOut={checkOut}
        hotelInfo={config.aiKnowledgeBase}
      />
    </div>
  );
};

export default App;
