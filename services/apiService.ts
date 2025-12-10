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


/**
 * Create a new room
 */
export async function createRoom(room: Room): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(room),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

/**
 * Update an existing room
 */
export async function updateRoom(room: Room): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(room),
    });

    if (!response.ok) {
      throw new Error('Failed to update room');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
}

/**
 * Delete a room
 */
export async function deleteRoom(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete room');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
}

/**
 * Create a new package
 */
export async function createPackage(pkg: HolidayPackage): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pkg),
    });

    if (!response.ok) {
      throw new Error('Failed to create package');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
}

/**
 * Update an existing package
 */
export async function updatePackage(pkg: HolidayPackage): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pkg),
    });

    if (!response.ok) {
      throw new Error('Failed to update package');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
}

/**
 * Delete a package
 */
export async function deletePackage(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/packages?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete package');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
}

/**
 * Create a new extra service
 */
export async function createExtra(extra: ExtraService): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/extras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extra),
    });

    if (!response.ok) {
      throw new Error('Failed to create extra');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating extra:', error);
    throw error;
  }
}

/**
 * Update an existing extra service
 */
export async function updateExtra(extra: ExtraService): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/extras`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(extra),
    });

    if (!response.ok) {
      throw new Error('Failed to update extra');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating extra:', error);
    throw error;
  }
}

/**
 * Delete an extra service
 */
export async function deleteExtra(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/extras?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete extra');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting extra:', error);
    throw error;
  }
}

/**
 * Create a new discount code
 */
export async function createDiscount(discount: DiscountCode): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discount),
    });

    if (!response.ok) {
      throw new Error('Failed to create discount');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating discount:', error);
    throw error;
  }
}

/**
 * Update an existing discount code
 */
export async function updateDiscount(discount: DiscountCode): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discount),
    });

    if (!response.ok) {
      throw new Error('Failed to update discount');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating discount:', error);
    throw error;
  }
}

/**
 * Delete a discount code
 */
export async function deleteDiscount(code: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/discounts?code=${code}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete discount');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting discount:', error);
    throw error;
  }
}

/**
 * Update hotel configuration
 */
export async function updateConfig(config: HotelConfig): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${API_BASE_URL}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error('Failed to update config');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

// Confirm or reject payment
export async function confirmPayment(reservationId: string, approved: boolean) {
  const response = await fetch(`${API_BASE_URL}/reservations/confirm-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservationId, approved }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to confirm payment');
  }
  
  return response.json();
}
