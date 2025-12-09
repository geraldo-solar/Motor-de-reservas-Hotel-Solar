import { Reservation, Room, HolidayPackage, ExtraService, DiscountCode, HotelConfig } from '../types';

const API_BASE_URL = '/api';

export interface CreateReservationPayload {
  checkIn: string;
  checkOut: string;
  nights: number;
  mainGuest: {
    name: string;
    cpf: string;
    age?: string;
    email?: string;
    phone?: string;
  };
  additionalGuests: Array<{
    name: string;
    cpf: string;
    age?: string;
  }>;
  observations: string;
  rooms: Array<{
    name: string;
    priceSnapshot: number;
  }>;
  extras: Array<{
    name: string;
    quantity: number;
    priceSnapshot: number;
  }>;
  totalPrice: number;
  discountApplied?: {
    code: string;
    amount: number;
  };
  paymentMethod: 'PIX' | 'CREDIT_CARD';
  cardDetails?: {
    holderName: string;
    number: string;
    expiry: string;
    cvv: string;
  };
}

export interface PixPaymentResponse {
  success: boolean;
  pix: {
    payload: string;
    qrCode: string;
    amount: number;
    expiresIn: number;
    pixKey: string;
  };
}

/**
 * Fetch all rooms from the database
 */
export async function fetchRooms(): Promise<Room[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
}

/**
 * Fetch all packages from the database
 */
export async function fetchPackages(): Promise<HolidayPackage[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch packages');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
}

/**
 * Fetch all extra services from the database
 */
export async function fetchExtras(): Promise<ExtraService[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/extras`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch extras');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching extras:', error);
    throw error;
  }
}

/**
 * Fetch all discount codes from the database
 */
export async function fetchDiscounts(): Promise<DiscountCode[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch discounts');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching discounts:', error);
    throw error;
  }
}

/**
 * Fetch hotel configuration from the database
 */
export async function fetchConfig(): Promise<HotelConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

/**
 * Fetch all reservations from the database
 */
export async function fetchReservations(): Promise<Reservation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reservations');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

/**
 * Create a new reservation
 */
export async function createReservation(
  payload: CreateReservationPayload
): Promise<{ success: boolean; reservation: Reservation }> {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create reservation');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

/**
 * Send reservation notification email
 */
export async function sendReservationEmail(
  reservation: Reservation
): Promise<{ success: boolean; emailId?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send-reservation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reservation }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Generate PIX payment
 */
export async function generatePixPayment(
  amount: number,
  reservationId: string,
  customerName: string
): Promise<PixPaymentResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/generate-pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        reservationId,
        customerName,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate PIX');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating PIX:', error);
    throw error;
  }
}

/**
 * List all reservations
 */
export async function listReservations(
  status?: string
): Promise<{ success: boolean; reservations: Reservation[] }> {
  try {
    const url = status 
      ? `${API_BASE_URL}/reservations/list?status=${status}`
      : `${API_BASE_URL}/reservations/list`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reservations');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}
