
export interface RoomDateOverride {
  dateIso: string;
  price?: number;
  availableQuantity?: number;
  noCheckIn?: boolean;
  noCheckOut?: boolean;
  isClosed?: boolean; // New: Closed for sale
}

export interface Room {
  id: string;
  name: string;
  description: string;
  price: number; // Default Base Price
  capacity: number;
  imageUrl: string; // Kept for backward compatibility (primary image)
  imageUrls?: string[]; // NEW: Array of up to 4 images
  features: string[];
  totalQuantity: number; // Default Base Inventory
  active: boolean;
  overrides?: RoomDateOverride[]; // NEW: Daily overrides for price/qty/rules
}

export interface HolidayPackage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  includes: string[];
  active: boolean;
  startIsoDate: string; // YYYY-MM-DD
  endIsoDate: string;   // YYYY-MM-DD
  roomPrices: { roomId: string; price: number }[]; 
  noCheckoutDates: string[]; 
  noCheckInDates: string[];
  promotionBadge?: string; // e.g., "15% OFF", "Promoção Especial"
}

export interface ExtraService {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
}

export interface DiscountCode {
  code: string;
  percentage: number;
  active: boolean;
  startDate?: string; // YYYY-MM-DD (Optional)
  endDate?: string;   // YYYY-MM-DD (Optional)
  minNights?: number; // Minimum stay required
  fullPeriodRequired?: boolean; // If true, booking dates must fall entirely within start/end dates
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewState {
  HOME = 'HOME',
  ROOMS = 'ROOMS',
  PACKAGES = 'PACKAGES',
  BOOKING = 'BOOKING',
  ADMIN = 'ADMIN',
  THANK_YOU = 'THANK_YOU'
}

export interface HotelConfig {
  minStay: number;
  contactEmail: string;
  aiKnowledgeBase: string; 
}

// --- RESERVATION TYPES ---

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED';

export interface ReservationGuest {
  name: string;
  cpf: string;
  age?: string;
  email?: string;
  phone?: string;
}

export interface Reservation {
  id: string;
  createdAt: Date;
  checkIn: string; // ISO Date
  checkOut: string; // ISO Date
  nights: number;
  
  // Guest Data
  mainGuest: ReservationGuest;
  additionalGuests: ReservationGuest[];
  observations: string;

  // Items
  rooms: { 
    name: string; 
    priceSnapshot: number;
    guests?: ReservationGuest[]; // Acompanhantes do quarto
  }[]; // Snapshot of room details
  extras: { name: string; quantity: number; priceSnapshot: number }[];
  
  // Financials
  totalPrice: number;
  discountApplied?: { code: string; amount: number };
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  cardDetails?: {
    holderName: string;
    number: string;
    expiry: string;
    cvv: string;
    installments?: number; // Número de parcelas
  };
  
  status: ReservationStatus;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discountPercentage: number; // e.g., 15 for 15%
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  roomIds: string[]; // Empty array = applies to all rooms
  active: boolean;
}
