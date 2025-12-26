
import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatAssistant from './components/ChatAssistant';
import BookingForm from './components/BookingForm';
import ErrorBoundary from './components/ErrorBoundary';
import ThankYouPage from './components/ThankYouPageSimple';
import AdminPanel, { AdminLogin } from './components/AdminPanel';
import RegulamentoHospedagem from './components/RegulamentoHospedagem';
import CancelReservationPage from './components/CancelReservationPage';
import { ViewState, Room, HolidayPackage, DiscountCode, HotelConfig, ExtraService, Reservation, ReservationStatus, Promotion } from './types';
import { INITIAL_ROOMS, INITIAL_PACKAGES, INITIAL_DISCOUNTS, INITIAL_CONFIG, INITIAL_EXTRAS, INITIAL_RESERVATIONS } from './constants';
import { Star, MapPin, Wifi, Droplets, Utensils, Award, ShieldCheck, Calendar as CalendarIcon, ArrowRight, ChevronLeft, ChevronRight, BedDouble, Users, Check, Crown, ShoppingCart, Plus, Minus, Trash2, Tag } from 'lucide-react';
import { fetchRooms, fetchPackages, fetchExtras, fetchDiscounts, fetchConfig, fetchReservations, createRoom, updateRoom, deleteRoom, createPackage, updatePackage, deletePackage, createExtra, updateExtra, deleteExtra, createDiscount, updateDiscount, deleteDiscount, updateConfig as updateConfigAPI } from './services/apiService';

// Interface for History Snapshot
interface HistoryState {
  rooms: Room[];
  packages: HolidayPackage[];
  discounts: DiscountCode[];
  extras: ExtraService[];
}

// Room Image Carousel Component
const RoomImageCarousel: React.FC<{ room: Room }> = ({ room }) => {
  const images = room.imageUrls && room.imageUrls.length > 0 ? room.imageUrls : [room.imageUrl];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  return (
    <div className="relative h-64 overflow-hidden">
      <img 
        src={images[currentImageIndex]} 
        alt={room.name} 
        className="w-full h-full object-cover transition duration-700 group-hover:scale-110" 
      />
      
      {/* Badge de capacidade */}
      <div className="absolute bottom-4 left-4 bg-[#0F2820]/90 backdrop-blur-sm text-white px-3 py-1.5 text-xs flex items-center gap-1 rounded-sm shadow-sm border border-[#D4AF37]/30 z-10">
        <Users size={12} className="text-[#D4AF37]"/> Acomoda até {room.capacity} pessoas
      </div>
      
      {/* Navigation Arrows - Only show if there are multiple images */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-20"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition z-20"
            aria-label="Próxima imagem"
          >
            <ChevronRight size={20} />
          </button>
          
          {/* Image Indicators */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition ${
                  index === currentImageIndex 
                    ? 'bg-[#D4AF37] w-6' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Ir para imagem ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const App: React.FC = () => {
  // Application State (Lifted Up)
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]); // Array for multi-select
  const [selectedPackagePrice, setSelectedPackagePrice] = useState<number | null>(null);
  const [roomQuantities, setRoomQuantities] = useState<{[roomId: string]: number}>({});
  const [packageRoomQuantities, setPackageRoomQuantities] = useState<{[roomId: string]: number}>({});
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null); // Para scroll automático
  
  // Scroll automático para o pacote selecionado
  useEffect(() => {
    if (currentView === ViewState.PACKAGES && selectedPackageId) {
      console.log('[SCROLL] Attempting to scroll to package:', selectedPackageId);
      // Aguardar renderização completa (aumentado para 800ms)
      setTimeout(() => {
        const elementId = `package-${selectedPackageId}`;
        console.log('[SCROLL] Looking for element:', elementId);
        const element = document.getElementById(elementId);
        if (element) {
          console.log('[SCROLL] Element found! Scrolling...');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Limpar o ID após o scroll
          setTimeout(() => setSelectedPackageId(null), 1000);
        } else {
          console.error('[SCROLL] Element NOT found:', elementId);
          console.error('[SCROLL] Available elements:', Array.from(document.querySelectorAll('[id^="package-"]')).map(el => el.id));
        }
      }, 800);
    }
  }, [currentView, selectedPackageId]);
  
  // Data State (Editable by Admin)
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [packages, setPackages] = useState<HolidayPackage[]>(INITIAL_PACKAGES);
  const [discounts, setDiscounts] = useState<DiscountCode[]>(INITIAL_DISCOUNTS);
  const [extras, setExtras] = useState<ExtraService[]>(INITIAL_EXTRAS);
  const [config, setConfig] = useState<HotelConfig>(INITIAL_CONFIG);

  // Reservations State (NEW)
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  
  // Promotions State
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // History State for Undo/Redo
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);

  // Admin Session State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Calendar State
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);

  // Discount Code State
  const [discountCode, setDiscountCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percentage: number; amount: number } | null>(null);

  // Thank You Page State
  const [completedReservationId, setCompletedReservationId] = useState<string>('');
  const [completedGuestEmail, setCompletedGuestEmail] = useState<string>('');
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<'pix' | 'credit_card'>('pix');

  // Refs for scrolling
  const roomsSectionRef = useRef<HTMLDivElement>(null);
  const calendarSectionRef = useRef<HTMLDivElement>(null);

  // Loading state
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [packageFromUrlProcessed, setPackageFromUrlProcessed] = useState(false);

  // Check URL parameters for pre-selected date
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const checkInParam = params.get('checkin');
    const checkOutParam = params.get('checkout');
    const packageParam = params.get('package');
    
    console.log('[URL Params Debug]', { dateParam, checkInParam, checkOutParam, packageParam });
    
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
          // Use INITIAL_EXTRAS if API returns empty array
          if (extrasData.value && extrasData.value.length > 0) {
            setExtras(extrasData.value);
          } else {
            console.log('API returned empty extras, using INITIAL_EXTRAS');
            setExtras(INITIAL_EXTRAS);
          }
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
     
     // Sync room overrides back to packages (reverse sync)
     try {
       console.log('[ROOM SYNC] Syncing room overrides back to packages');
       const updatedPackages = [...packages];
       let packagesChanged = false;
       
       for (const pkg of updatedPackages) {
         if (!pkg.active) continue;
         
         // Parse package dates
         const [startYear, startMonth, startDay] = pkg.startIsoDate.split('-').map(Number);
         const [endYear, endMonth, endDay] = pkg.endIsoDate.split('-').map(Number);
         const startDate = new Date(startYear, startMonth - 1, startDay);
         const endDate = new Date(endYear, endMonth - 1, endDay);
         
         // Check each room price in the package
         for (let i = 0; i < pkg.roomPrices.length; i++) {
           const roomPrice = pkg.roomPrices[i];
           const room = newRooms.find(r => r.id === roomPrice.roomId);
           if (!room || !room.overrides) continue;
           
           // Find overrides within package date range
           const relevantOverrides = room.overrides.filter(override => {
             const overrideDate = new Date(override.dateIso);
             return overrideDate >= startDate && overrideDate < endDate;
           });
           
           // If there are overrides in this period, use the most common price
           if (relevantOverrides.length > 0) {
             // Count price occurrences
             const priceCount: { [key: number]: number } = {};
             relevantOverrides.forEach(o => {
               priceCount[o.price] = (priceCount[o.price] || 0) + 1;
             });
             
             // Get most common price
             const mostCommonPrice = parseInt(Object.keys(priceCount).reduce((a, b) => 
               priceCount[parseInt(a)] > priceCount[parseInt(b)] ? a : b
             ));
             
             // Update package price if different
             if (pkg.roomPrices[i].price !== mostCommonPrice) {
               console.log(`[ROOM SYNC] Updating package "${pkg.name}" room "${room.name}" price from ${pkg.roomPrices[i].price} to ${mostCommonPrice}`);
               pkg.roomPrices[i].price = mostCommonPrice;
               packagesChanged = true;
             }
           }
         }
       }
       
       // Update packages if any changed
       if (packagesChanged) {
         setPackages(updatedPackages);
         console.log('[ROOM SYNC] Packages updated with new prices from room overrides');
         
         // Sync to database
         for (const pkg of updatedPackages) {
           await updatePackage(pkg).catch(err => console.error('Failed to update package:', err));
         }
       }
     } catch (error) {
       console.error('[ROOM SYNC] Error syncing room overrides to packages:', error);
     }
     
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
     
     // Sync package prices with room overrides automatically
     try {
       console.log('[PACKAGE SYNC] Syncing package prices with room overrides');
       const updatedRooms = [...rooms];
       
       for (const pkg of newPackages) {
         if (!pkg.active) continue; // Skip inactive packages
         
         // Parse package dates (local timezone to avoid date shift)
         const [startYear, startMonth, startDay] = pkg.startIsoDate.split('-').map(Number);
         const [endYear, endMonth, endDay] = pkg.endIsoDate.split('-').map(Number);
         const startDate = new Date(startYear, startMonth - 1, startDay);
         const endDate = new Date(endYear, endMonth - 1, endDay);
         
         console.log(`[PACKAGE SYNC] Processing package "${pkg.name}" from ${pkg.startIsoDate} to ${pkg.endIsoDate}`);
         
         // Calculate number of nights in the package
         const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
         console.log(`[PACKAGE SYNC] Package has ${nights} nights`);
         
         // For each room price in the package
         for (const roomPrice of pkg.roomPrices) {
           const roomIndex = updatedRooms.findIndex(r => r.id === roomPrice.roomId);
           if (roomIndex === -1) continue;
           
           const room = updatedRooms[roomIndex];
           let overrides = room.overrides || [];
           
           // Calculate price per night (divide total package price by number of nights)
           const pricePerNight = Math.round(roomPrice.price / nights);
           
           console.log(`[PACKAGE SYNC] Syncing room "${room.name}" - Total: ${roomPrice.price}, Nights: ${nights}, Per Night: ${pricePerNight}`);
           
           // Create overrides for each date in the package period
           const currentDate = new Date(startDate);
           while (currentDate < endDate) {
             const year = currentDate.getFullYear();
             const month = String(currentDate.getMonth() + 1).padStart(2, '0');
             const day = String(currentDate.getDate()).padStart(2, '0');
             const dateStr = `${year}-${month}-${day}`;
             
             // Find or create override for this date
             const existingIndex = overrides.findIndex(o => o.dateIso === dateStr);
             
             if (existingIndex >= 0) {
               // Update existing override with price per night
               overrides[existingIndex].price = pricePerNight;
             } else {
               // Create new override with price per night
               overrides.push({
                 dateIso: dateStr,
                 price: pricePerNight,
                 availableQuantity: room.totalQuantity
               });
             }
             
             currentDate.setDate(currentDate.getDate() + 1);
           }
           
           updatedRooms[roomIndex] = { ...room, overrides };
         }
       }
       
       // Update rooms with new overrides
       setRooms(updatedRooms);
       console.log('[PACKAGE SYNC] Room overrides updated successfully');
       
       // Sync updated rooms to database
       for (const room of updatedRooms) {
         await updateRoom(room).catch(err => console.error('Failed to update room:', err));
       }
     } catch (error) {
       console.error('[PACKAGE SYNC] Error syncing package prices:', error);
     }
     
     // Sync with Postgres
    try {
      const oldPackageIds: Set<string> = new Set(packages.map(p => p.id));
      const newPackageIds: Set<string> = new Set(newPackages.map(p => p.id));
       
      // Find deleted packages
      const deletedIds = Array.from(oldPackageIds).filter(id => !newPackageIds.has(id));
      console.log('[PACKAGE SYNC] Deleted package IDs:', deletedIds);
      for (const id of deletedIds) {
        if (typeof id === 'string') {
          console.log('[PACKAGE SYNC] Deleting package:', id);
          await deletePackage(id)
            .then(() => console.log('[PACKAGE SYNC] Successfully deleted package:', id))
            .catch(err => console.error('[PACKAGE SYNC] Failed to delete package:', id, err));
        }
      }
       
       // Find new or updated packages
       for (const pkg of newPackages) {
         if (!oldPackageIds.has(pkg.id)) {
           console.log('[PACKAGE SYNC] Creating new package:', pkg.id);
           await createPackage(pkg)
             .then(() => console.log('[PACKAGE SYNC] Successfully created package:', pkg.id))
             .catch(err => console.error('[PACKAGE SYNC] Failed to create package:', pkg.id, err));
         } else {
           const oldPkg = packages.find(p => p.id === pkg.id);
           const oldJson = JSON.stringify(oldPkg);
           const newJson = JSON.stringify(pkg);
           
           if (oldJson !== newJson) {
             console.log('[PACKAGE SYNC] Package changed, updating:', pkg.id);
             console.log('[PACKAGE SYNC] Old:', oldPkg);
             console.log('[PACKAGE SYNC] New:', pkg);
             
             await updatePackage(pkg)
               .then(() => console.log('[PACKAGE SYNC] Successfully updated package:', pkg.id))
               .catch(err => console.error('[PACKAGE SYNC] Failed to update package:', pkg.id, err));
           } else {
             console.log('[PACKAGE SYNC] Package unchanged, skipping:', pkg.id);
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
  const handleAddReservation = async (reservation: Reservation) => {
      setReservations(prev => [reservation, ...prev]);
      
      // Reload rooms data from database to get updated availability
      console.log('[RESERVATION] Reloading rooms data after reservation creation');
      try {
        const updatedRooms = await fetchRooms();
        setRooms(updatedRooms);
        console.log('[RESERVATION] Rooms data reloaded successfully');
      } catch (error) {
        console.error('[RESERVATION] Failed to reload rooms data:', error);
      }
  };

  const handleUpdateReservationStatus = (id: string, status: ReservationStatus) => {
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  // Filter only active items for public view
  const activeRooms = rooms.filter(r => r.active);
  const activePackages = packages
    .filter(p => p.active)
    .sort((a, b) => {
      // Sort by start date (chronological order - oldest first, left to right)
      const dateA = new Date(a.startIsoDate);
      const dateB = new Date(b.startIsoDate);
      return dateA.getTime() - dateB.getTime();
    });

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

  // Handle hash navigation to specific package
  useEffect(() => {
    const hash = window.location.hash;
    console.log('[HASH] Current hash:', hash);
    
    // Check if hash contains package ID
    if (hash.startsWith('#package-') && !isLoadingData) {
      const packageId = hash.replace('#package-', '');
      console.log('[HASH] Package ID found:', packageId);
      
      // Navigate to packages view
      setCurrentView(ViewState.PACKAGES);
      
      // Set package ID for scroll
      setSelectedPackageId(packageId);
    }
  }, [isLoadingData]);

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

  // Check if room has promotion in selected period
  const getRoomPromotion = (room: Room): { badge: string; discount: number } | null => {
     if (!checkIn || !checkOut) return null;
     
     let tempDate = new Date(checkIn);
     const endDate = new Date(checkOut);
     
     while (tempDate < endDate) {
         const override = getRoomOverride(room, tempDate);
         if (override?.promotionBadge && override?.promotionDiscount) {
            return { badge: override.promotionBadge, discount: override.promotionDiscount };
         }
         tempDate.setDate(tempDate.getDate() + 1);
     }
     return null;
  };

  // Calculate Total Price considering daily overrides
  const calculateTotalRoomPrice = (room: Room, applyDiscount: boolean = true) => {
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
         
         // Apply promotion discount if exists
         if (applyDiscount && override?.promotionDiscount) {
            dailyPrice = dailyPrice - (dailyPrice * override.promotionDiscount / 100);
         }
         
         total += dailyPrice;
         tempDate.setDate(tempDate.getDate() + 1);
     }
     
     // Apply discount if applicable
     if (applyDiscount && appliedDiscount) {
       total = total - (total * appliedDiscount.percentage / 100);
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
          
          const qty = override?.availableQuantity !== undefined ? override.availableQuantity : 0; // Indisponível se não houver override
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

    // Bloquear vendas a partir de 01/07/2026
    const cutoffDate = new Date(2026, 6, 1); // 1º de julho de 2026 (mês 6 = julho, zero-indexed)
    cutoffDate.setHours(0, 0, 0, 0);
    if (clickedDate >= cutoffDate) {
        alert("Vendas fechadas a partir de 01/07/2026. Entre em contato para mais informações.");
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
        // Scroll to calendar section
        setTimeout(() => {
          calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
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
    
    // Multi-select: toggle room in/out
    const isAlreadySelected = selectedRooms.some(r => r.id === roomId);
    if (isAlreadySelected) {
      // Remove room
      setSelectedRooms(prev => prev.filter(r => r.id !== roomId));
    } else {
      // Add room
      setSelectedRooms(prev => [...prev, room]);
    }
    // Store package price (for single room, or could be total)
    setSelectedPackagePrice(price);
  };

  const calculateGrandTotal = () => {
      // If fixed package price active (and single room), return that. 
      // Note: Multi-room + package fixed price logic would require complex cart. 
      // We assume if packagePrice is set, it's a single room package flow.
      if (selectedPackagePrice && selectedRooms.length === 1) return selectedPackagePrice;

      return selectedRooms.reduce((acc, room) => acc + calculateTotalRoomPrice(room), 0);
  };

  // Handle Discount Code Application
  const handleApplyDiscount = () => {
    const code = discountCode.toUpperCase().trim();
    
    if (!code) {
      alert('Por favor, digite um código de desconto.');
      return;
    }
    
    console.log('Buscando cupom:', code);
    console.log('Cupons disponíveis:', discounts);
    
    const discount = discounts.find(d => d.code === code && d.active);
    console.log('Cupom encontrado:', discount);

    if (!discount) {
      alert('Cupom inválido ou expirado.');
      setAppliedDiscount(null);
      return;
    }

    // Validate Date Range if dates are set
    if (checkIn && checkOut && discount.startDate && discount.endDate) {
      const startDate = new Date(discount.startDate);
      const endDate = new Date(discount.endDate);
      
      if (discount.fullPeriodRequired) {
        // Entire stay must be within discount period
        if (checkIn < startDate || checkOut > endDate) {
          alert(`Este cupom é válido apenas para estadias entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`);
          setAppliedDiscount(null);
          return;
        }
      } else {
        // At least check-in must be within period
        if (checkIn < startDate || checkIn > endDate) {
          alert(`Este cupom é válido apenas para check-ins entre ${startDate.toLocaleDateString('pt-BR')} e ${endDate.toLocaleDateString('pt-BR')}.`);
          setAppliedDiscount(null);
          return;
        }
      }
    }

    // Calculate discount amount
    const accommodationTotal = selectedRooms.reduce((acc, room) => acc + calculateTotalRoomPrice(room, false), 0);
    const discountAmount = (accommodationTotal * discount.percentage) / 100;
    
    setAppliedDiscount({ 
      code: discount.code, 
      percentage: discount.percentage,
      amount: discountAmount 
    });
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
              
              // Verificar se data está bloqueada (>= 01/07/2026)
              const cutoffDate = new Date(2026, 6, 1);
              cutoffDate.setHours(0, 0, 0, 0);
              const isBlocked = date >= cutoffDate;
              
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
              
              // Check if any room has promotion on this date
              let datePromotion: { badge: string; discount: number } | null = null;
              if (!pkg) { // Only show override promotion if no package
                for (const room of rooms) {
                  const override = room.overrides?.find(o => o.dateIso === iso);
                  if (override?.promotionBadge && override?.promotionDiscount) {
                    datePromotion = { badge: override.promotionBadge, discount: override.promotionDiscount };
                    break;
                  }
                }
              }
              
              // Restrictions styling
              const noCheckIn = restrictedCheckInDates.has(iso);
              const noCheckOut = restrictedCheckOutDates.has(iso);

              // Styling
              let bgClass = "bg-white hover:border-[#D4AF37]";
              let textClass = "text-gray-700";
              let borderClass = "border-gray-200";

              if (isPast || isBlocked) {
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
                   onClick={() => !isPast && !isBlocked && handleDateClick(day)}
                   className={`
                      h-12 md:h-20 border rounded-sm p-1 md:p-2 cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden
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
                      <div className="text-[8px] md:text-xs leading-tight font-medium break-words p-0.5 md:p-1 rounded-sm ${inRange || isSelected ? 'text-[#E5D3B3] bg-white/10' : 'text-[#D4AF37] bg-[#F3E5AB]/50'}">
                         {pkg.name}
                      </div>
                   )}
                   {!pkg && datePromotion && !isPast && (
                      <div className="text-[7px] md:text-[10px] font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-1 py-0.5 rounded-sm shadow-sm break-words leading-tight">
                         🔥 {datePromotion.badge}
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
        const totalWithoutDiscount = calculateTotalRoomPrice(room, false);
        const totalWithDiscount = calculateTotalRoomPrice(room, true);
        const nights = selectedNights;
        
        // Availability Logic: Check Price AND Inventory
        const isAvailable = checkAvailability(room);
        const isUnavailable = !isAvailable;

        return (
          <div key={room.id} className="group bg-white rounded-sm overflow-hidden shadow-lg border border-transparent hover:border-[#D4AF37] transition-all duration-300 flex flex-col">
            <RoomImageCarousel room={room} />
            
            <div className="p-6 flex-1 flex flex-col">
               {(() => {
                  const promotion = getRoomPromotion(room);
                  return promotion && (
                     <div className="mb-2 inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-sm shadow-sm w-fit">
                        🔥 {promotion.badge}
                     </div>
                  );
               })()}
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
                                  <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Esgotado</span>
                              ) : (
                                  <div className="flex flex-col">
                                    {appliedDiscount || getRoomPromotion(room) ? (
                                      <>
                                        <div className="flex items-baseline gap-1 mb-1">
                                          <span className="text-xs text-red-500 line-through">R$</span>
                                          <span className="text-lg font-serif text-red-500 line-through">{totalWithoutDiscount.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                          <span className="text-xs text-[#D4AF37]">R$</span>
                                          <span className="text-2xl font-serif text-[#0F2820]">{totalWithDiscount.toLocaleString('pt-BR')}</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-xs text-[#D4AF37]">R$</span>
                                        <span className="text-2xl font-serif text-[#0F2820]">{totalWithoutDiscount.toLocaleString('pt-BR')}</span>
                                      </div>
                                    )}
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
                  
                  {isUnavailable ? (
                    <div className="w-full py-3 rounded-sm font-bold uppercase text-xs tracking-[0.2em] bg-gray-200 text-gray-400 text-center">
                      Esgotado
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">Quantidade</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const current = roomQuantities[room.id] || 0;
                              if (current > 0) {
                                setRoomQuantities({...roomQuantities, [room.id]: current - 1});
                              }
                            }}
                            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-sm font-bold text-lg transition"
                            type="button"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={room.totalQuantity || 10}
                            value={roomQuantities[room.id] || 0}
                            onFocus={(e) => {
                              if (!checkIn || !checkOut) {
                                e.target.blur();
                                alert("Por favor, selecione as datas de Check-in e Check-out no calendário antes de adicionar um quarto.");
                                setTimeout(() => {
                                  calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                              }
                            }}
                            onChange={(e) => {
                              if (!checkIn || !checkOut) return;
                              const val = parseInt(e.target.value) || 0;
                              const max = room.totalQuantity || 10;
                              setRoomQuantities({...roomQuantities, [room.id]: Math.min(Math.max(0, val), max)});
                            }}
                            className="w-16 h-10 text-center border border-gray-300 rounded-sm font-bold text-lg"
                          />
                          <button
                            onClick={() => {
                              if (!checkIn || !checkOut) {
                                alert("Por favor, selecione as datas de Check-in e Check-out no calendário antes de adicionar um quarto.");
                                setTimeout(() => {
                                  calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                                return;
                              }
                              const current = roomQuantities[room.id] || 0;
                              const max = room.totalQuantity || 10;
                              if (current < max) {
                                setRoomQuantities({...roomQuantities, [room.id]: current + 1});
                              }
                            }}
                            className="w-10 h-10 bg-[#0F2820] hover:bg-[#1a3c30] text-white rounded-sm font-bold text-lg transition"
                            type="button"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Disponível: {room.totalQuantity || 10}</p>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        );
      })}
      
      {/* Botão Continuar */}
      {Object.values(roomQuantities).some(q => q > 0) && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => {
              // Adicionar quartos selecionados ao carrinho
              const newSelectedRooms: Room[] = [];
              Object.entries(roomQuantities).forEach(([roomId, quantity]) => {
                if (quantity > 0) {
                  const room = rooms.find(r => r.id === roomId);
                  if (room) {
                    for (let i = 0; i < quantity; i++) {
                      newSelectedRooms.push(room);
                    }
                  }
                }
              });
              setSelectedRooms(newSelectedRooms);
              setRoomQuantities({}); // Reset quantities
              setCurrentView(ViewState.BOOKING); // Ir direto para o formulário
            }}
            className="bg-[#D4AF37] hover:bg-[#C49D2F] text-[#0F2820] px-12 py-4 rounded-sm font-bold uppercase text-sm tracking-[0.2em] transition shadow-lg flex items-center gap-3"
          >
            Continuar para Reserva
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderPackages = () => {
    try {
      console.log('[renderPackages] Starting render');
      return (
    <div className="max-w-7xl mx-auto px-4 grid gap-20">
      {activePackages.map((pkg, index) => {
        return (
        <React.Fragment key={pkg.id}>
        <div id={`package-${pkg.id}`} className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
           <div className="w-full md:w-1/2 relative group">
              <div className="absolute inset-0 bg-[#0F2820] translate-x-4 translate-y-4 rounded-sm transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
              <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-80 object-cover rounded-sm relative z-10 shadow-xl" />
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-2">
                 <span className="block text-2xl font-serif text-[#0F2820] text-center font-bold">
                    {parseInt(pkg.startIsoDate.split('-')[2])}
                 </span>
                 <span className="block text-xs uppercase tracking-widest text-center text-gray-500">
                    {(() => {
                      const [year, month, day] = pkg.startIsoDate.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      return date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
                    })()}
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
                          
                          // Check availability for this room in the package dates
                          const pkgStartDate = new Date(pkg.startIsoDate);
                          const pkgEndDate = new Date(pkg.endIsoDate);
                          
                          // Check each day in the package period
                          let isAvailable = true;
                          let tempDate = new Date(pkgStartDate);
                          while (tempDate < pkgEndDate) {
                            const override = getRoomOverride(room, tempDate);
                            const qty = override?.availableQuantity !== undefined ? override.availableQuantity : 0; // Indisponível se não houver override
                            const price = override?.price !== undefined ? override.price : room.price;
                            const closed = override?.isClosed;
                            
                            if (closed || price === 0 || qty === 0) {
                              isAvailable = false;
                              break;
                            }
                            
                            tempDate.setDate(tempDate.getDate() + 1);
                          }
                          
                          const isUnavailable = !isAvailable;
                          
                          // Don't render unavailable rooms
                          if (isUnavailable) return null;
                          
                          // Calcular maxAvailable
                          let maxAvailable = room.totalQuantity || 10;
                          let tempDate2 = new Date(pkgStartDate);
                          while (tempDate2 < pkgEndDate) {
                            const override = getRoomOverride(room, tempDate2);
                            const qty = override?.availableQuantity !== undefined ? override.availableQuantity : 0; // Indisponível se não houver override
                            if (qty < maxAvailable) maxAvailable = qty;
                            tempDate2.setDate(tempDate2.getDate() + 1);
                          }
                          
                          return (
                              <div 
                                key={rp.roomId}
                                className={`w-full flex justify-between items-center p-4 border rounded-sm transition ${
                                  isUnavailable
                                    ? 'border-gray-200 bg-gray-50 opacity-60'
                                    : 'border-gray-200 hover:border-[#D4AF37] hover:bg-[#F9F8F6]'
                                }`}
                              >
                                  <div className="flex items-center gap-3 flex-1">
                                      <img src={room.imageUrl} className="w-10 h-10 rounded-sm object-cover" alt="" />
                                      <div className="flex-1">
                                          <p className={`font-bold text-sm ${
                                            isUnavailable ? 'text-gray-400' : 'text-[#0F2820]'
                                          }`}>{room.name}</p>
                                          <p className="text-xs text-gray-400">
                                            {isUnavailable ? 'Esgotado' : `R$ ${rp.price.toLocaleString('pt-BR')} • Disponível: ${maxAvailable}`}
                                          </p>
                                      </div>
                                  </div>
                                  {!isUnavailable && (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          const current = packageRoomQuantities[rp.roomId] || 0;
                                          if (current > 0) {
                                            setPackageRoomQuantities({...packageRoomQuantities, [rp.roomId]: current - 1});
                                          }
                                        }}
                                        className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-sm font-bold transition"
                                        type="button"
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        max={maxAvailable}
                                        value={packageRoomQuantities[rp.roomId] || 0}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          setPackageRoomQuantities({...packageRoomQuantities, [rp.roomId]: Math.min(Math.max(0, val), maxAvailable)});
                                        }}
                                        className="w-14 h-8 text-center border border-gray-300 rounded-sm font-bold"
                                      />
                                      <button
                                        onClick={() => {
                                          const current = packageRoomQuantities[rp.roomId] || 0;
                                          if (current < maxAvailable) {
                                            setPackageRoomQuantities({...packageRoomQuantities, [rp.roomId]: current + 1});
                                          }
                                        }}
                                        className="w-8 h-8 bg-[#0F2820] hover:bg-[#1a3c30] text-white rounded-sm font-bold transition"
                                        type="button"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
                  
                  {/* Botão Continuar para Reserva */}
                  {Object.values(packageRoomQuantities).some(q => q > 0) && (
                    <div className="flex justify-center mt-6">
                      <button
                        onClick={() => {
                          console.log('[PACKAGE SELECT] Button clicked');
                          console.log('[PACKAGE SELECT] packageRoomQuantities:', packageRoomQuantities);
                          
                          try {
                            const newSelectedRooms: Room[] = [];
                            let totalPrice = 0;
                            
                            Object.entries(packageRoomQuantities).forEach(([roomId, quantity]) => {
                              if (quantity > 0) {
                                const room = rooms.find(r => r.id === roomId);
                                const roomPrice = pkg.roomPrices.find(rp => rp.roomId === roomId);
                                if (room && roomPrice) {
                                  for (let i = 0; i < quantity; i++) {
                                    newSelectedRooms.push(room);
                                  }
                                  totalPrice += roomPrice.price * quantity;
                                }
                              }
                            });
                            
                            console.log('[PACKAGE SELECT] newSelectedRooms:', newSelectedRooms);
                            console.log('[PACKAGE SELECT] totalPrice:', totalPrice);
                            
                            if (newSelectedRooms.length > 0) {
                              setSelectedRooms(newSelectedRooms);
                              setSelectedPackagePrice(totalPrice);
                              setPackageRoomQuantities({}); // Reset
                              setCurrentView(ViewState.BOOKING); // Ir direto para o formulário
                              console.log('[PACKAGE SELECT] Success!');
                            } else {
                              alert('Por favor, selecione pelo menos um quarto.');
                            }
                          } catch (error) {
                            console.error('[PACKAGE SELECT] Error:', error);
                            alert('Erro ao processar seleção: ' + error);
                          }
                        }}
                        className="bg-[#D4AF37] hover:bg-[#C49D2F] text-[#0F2820] px-12 py-4 rounded-sm font-bold uppercase text-sm tracking-[0.2em] transition shadow-lg flex items-center gap-3"
                      >
                        Continuar para Reserva
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                  
                  {/* Botão Compartilhar Pacote */}
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/#package-${pkg.id}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                          alert(`Link do pacote copiado!\n\n${shareUrl}\n\nEnvie este link para compartilhar o pacote "${pkg.name}".`);
                        }).catch(err => {
                          console.error('Erro ao copiar:', err);
                          prompt('Copie este link:', shareUrl);
                        });
                      }}
                      className="bg-white hover:bg-gray-50 text-[#0F2820] px-6 py-3 rounded-sm font-bold border-2 border-[#D4AF37] transition-all flex items-center gap-2 shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                      Compartilhar este Pacote
                    </button>
                  </div>
              </div>
           </div>
        </div>
        {index < activePackages.length - 1 && (
          <div className="my-12 flex items-center justify-center">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
            <div className="mx-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
              <div className="w-3 h-3 bg-[#D4AF37] rounded-full"></div>
              <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent"></div>
          </div>
        )}
        </React.Fragment>
        );
      })}
    </div>
      );
    } catch (error) {
      console.error('[renderPackages] Error:', error);
      return <div className="text-center text-red-500 p-8">Erro ao carregar pacotes: {String(error)}</div>;
    }
  };

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
                     if (!checkIn || !checkOut) {
                       alert("Por favor, selecione as datas de Check-in e Check-out no calendário antes de finalizar a reserva.");
                       setTimeout(() => {
                         calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                       }, 100);
                       return;
                     }
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
        promotions={promotions}
        // Pass wrapped functions that include history logic
        onUpdateRooms={updateRoomsWithHistory}
        onUpdatePackages={updatePackagesWithHistory}
        onUpdateDiscounts={updateDiscountsWithHistory}
        onUpdateExtras={updateExtrasWithHistory}
        onUpdatePromotions={setPromotions}
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
      >
        {/* Chat Assistant na seção Admin */}
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
      </AdminPanel>
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
          <section ref={calendarSectionRef} className="relative z-30 -mt-24 px-4 pb-12">
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

          {/* Packages Section */}
          {packages.filter(p => p.active).length > 0 && (
            <section className="py-16 bg-gradient-to-b from-[#F9F8F6] to-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-12">
                  <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em]">Experiências Exclusivas</span>
                  <h2 className="text-4xl font-serif text-[#0F2820] mt-3">Pacotes Especiais</h2>
                  <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
                  <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Escolha um dos nossos pacotes temáticos e aproveite uma experiência completa</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {packages.filter(p => p.active).map(pkg => {
                    // Debug log
                    console.log('[PACKAGE RENDER] Rendering package:', pkg.id, pkg);
                    
                    // Validate required fields
                    if (!pkg.startIsoDate || !pkg.endIsoDate) {
                      console.error('[PACKAGE RENDER] Missing dates for package:', pkg.id);
                      return null;
                    }
                    
                    if (!pkg.roomPrices || pkg.roomPrices.length === 0) {
                      console.error('[PACKAGE RENDER] Missing roomPrices for package:', pkg.id);
                      return null;
                    }
                    
                    if (!pkg.includes || pkg.includes.length === 0) {
                      console.warn('[PACKAGE RENDER] Missing includes for package:', pkg.id, '- using default');
                      pkg.includes = ['Hospedagem', 'Café da manhã'];
                    }
                    
                    // Get minimum price from roomPrices, or Infinity if no prices set
                    const minPrice = pkg.roomPrices.length > 0 ? Math.min(...pkg.roomPrices.map(rp => rp.price)) : Infinity;
                    
                    // Parse dates safely in local timezone
                    let startDate, endDate, nights;
                    try {
                      const startParts = pkg.startIsoDate.split('T')[0].split('-');
                      const endParts = pkg.endIsoDate.split('T')[0].split('-');
                      startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                      endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                      nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Validate dates
                      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.error('[PACKAGE RENDER] Invalid package dates:', pkg);
                        return null;
                      }
                      
                      if (nights <= 0) {
                        console.error('[PACKAGE RENDER] Invalid nights calculation:', nights, 'for package:', pkg.id);
                        return null;
                      }
                    } catch (error) {
                      console.error('[PACKAGE RENDER] Error parsing package dates:', pkg, error);
                      return null;
                    }

                    return (
                      <div key={pkg.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        {/* Package Image */}
                        <div className="relative h-56 overflow-hidden">
                          <img 
                            src={pkg.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'} 
                            alt={pkg.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('[PACKAGE RENDER] Image load error for package:', pkg.id);
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
                            }}
                          />
                          <div className="absolute top-4 right-4 bg-[#D4AF37] text-[#0F2820] px-3 py-1 rounded-full text-xs font-bold">
                            {nights} noites
                          </div>
                        </div>

                        {/* Package Content */}
                        <div className="p-6">
                          <h3 className="text-2xl font-serif text-[#0F2820] mb-2">{pkg.name}</h3>
                          <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>

                          {/* Dates */}
                          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4 bg-[#F9F8F6] p-3 rounded">
                            <CalendarIcon size={16} className="text-[#D4AF37]" />
                            <span className="font-semibold">
                              {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - {endDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {/* Includes */}
                          <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Inclui:</p>
                            <ul className="space-y-1">
                              {pkg.includes.slice(0, 3).map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                  <Check size={16} className="text-[#4A5D43] mt-0.5 flex-shrink-0" />
                                  <span>{item}</span>
                                </li>
                              ))}
                              {pkg.includes.length > 3 && (
                                <li className="text-xs text-gray-500 italic">+ {pkg.includes.length - 3} mais itens</li>
                              )}
                            </ul>
                          </div>

                          {/* Price and CTA */}
                          <div className="border-t border-gray-200 pt-4 mt-4">
                            <div className="flex items-end justify-between mb-3">
                              <div>
                                <p className="text-xs text-gray-500 uppercase">A partir de</p>
                                <p className="text-3xl font-bold text-[#0F2820]">R$ {minPrice.toLocaleString('pt-BR')}</p>
                                <p className="text-xs text-gray-500">total para {nights} noites</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                try {
                                  // Set dates automatically using safe parsing
                                  const startParts = pkg.startIsoDate.split('T')[0].split('-');
                                  const endParts = pkg.endIsoDate.split('T')[0].split('-');
                                  const pkgStartDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
                                  const pkgEndDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
                                  
                                  if (!isNaN(pkgStartDate.getTime()) && !isNaN(pkgEndDate.getTime())) {
                                    setCheckIn(pkgStartDate);
                                    setCheckOut(pkgEndDate);
                                    setCurrentCalendarDate(pkgStartDate);
                                    // Save package ID for scroll
                                    setSelectedPackageId(pkg.id);
                                    // Navigate to packages view
                                    setCurrentView(ViewState.PACKAGES);
                                  } else {
                                    console.error('Invalid package dates');
                                    alert('Erro ao carregar datas do pacote');
                                  }
                                } catch (error) {
                                  console.error('Error setting package dates:', error);
                                  alert('Erro ao selecionar pacote');
                                }
                              }}
                              className="w-full bg-[#2F3A2F] hover:bg-[#1f281f] text-[#E5D3B3] py-3 rounded font-bold uppercase text-sm tracking-wider transition-all flex items-center justify-center gap-2"
                            >
                              Selecionar Pacote
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Rooms Section */}
          <section className="py-20 max-w-7xl mx-auto">
             <div className="text-center mb-8">
                <span className="text-[#D4AF37] text-xs font-bold uppercase tracking-[0.2em]">Exclusividade</span>
                <h2 className="text-4xl font-serif text-[#0F2820] mt-3">Nossas Acomodações</h2>
                <div className="w-24 h-1 bg-[#D4AF37] mx-auto mt-6"></div>
             </div>
             
             {/* Discount Code Section */}
             <div className="max-w-4xl mx-auto mb-12 px-4">
               <div className="bg-gradient-to-br from-[#F9F8F6] to-white border-2 border-[#D4AF37]/30 rounded-lg p-4 shadow-lg">
                 <div className="flex flex-col md:flex-row md:items-center gap-4">
                   {/* Left side: Title and description */}
                   <div className="flex items-center gap-3 md:min-w-[280px]">
                     <Tag size={24} className="text-[#D4AF37] flex-shrink-0" />
                     <div>
                       <h3 className="font-bold text-[#0F2820] uppercase tracking-wide text-sm">Cupom de Desconto</h3>
                       <p className="text-xs text-gray-500">Aplique e veja os preços com desconto</p>
                     </div>
                   </div>
                   
                   {/* Right side: Input and button */}
                   <div className="flex-1 flex gap-2">
                     <input 
                       type="text" 
                       value={discountCode}
                       onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                       placeholder="Digite o código"
                       className="flex-1 px-4 py-2.5 border-2 border-[#4A5D43]/30 rounded-lg uppercase bg-white focus:border-[#D4AF37] focus:outline-none transition text-sm"
                     />
                     <button 
                       onClick={handleApplyDiscount}
                       className="px-6 py-2.5 bg-[#2F3A2F] hover:bg-[#1f281f] text-[#E5D3B3] rounded-lg font-bold uppercase text-sm tracking-wider transition-all whitespace-nowrap"
                     >
                       Aplicar
                     </button>
                   </div>
                 </div>
                 
                 {/* Applied discount message */}
                 {appliedDiscount && (
                   <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Check size={16} className="text-green-600" />
                       <span className="text-xs font-medium text-green-800">
                         Cupom <strong>{appliedDiscount.code}</strong> aplicado! Desconto de <strong>{appliedDiscount.percentage}%</strong>
                       </span>
                     </div>
                     <button 
                       onClick={() => setAppliedDiscount(null)}
                       className="text-red-600 hover:text-red-800 text-xs font-medium"
                     >
                       Remover
                     </button>
                   </div>
                 )}
               </div>
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
         <ErrorBoundary>
         <div className="py-20 bg-[#F9F8F6]">
            <div className="max-w-7xl mx-auto px-4 mb-8">
               <button
                  onClick={() => setCurrentView(ViewState.HOME)}
                  className="flex items-center gap-2 text-[#0F2820] hover:text-[#D4AF37] transition-colors font-semibold"
               >
                  <ChevronLeft size={20} />
                  Voltar para Início
               </button>
            </div>
            <div className="text-center mb-16">
               <h2 className="text-4xl font-serif text-[#0F2820]">Pacotes Especiais</h2>
               <p className="text-sm text-gray-500 mt-2">Debug: {activePackages.length} pacotes ativos</p>
            </div>
            {(() => {
              console.log('[PACKAGES VIEW] Rendering packages, count:', activePackages.length);
              console.log('[PACKAGES VIEW] activePackages:', activePackages);
              return renderPackages();
            })()}
         </div>
         </ErrorBoundary>
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
         <ErrorBoundary>
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
                onBackClick={() => {
                  console.log('[APP] onClose called - going back to HOME');
                  setCurrentView(ViewState.HOME);
                  setSelectedRooms([]);
                  setSelectedPackagePrice(null);
                  console.log('[APP] State updated');
                }}
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
         </ErrorBoundary>
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


    </div>
  );
};

export default App;
