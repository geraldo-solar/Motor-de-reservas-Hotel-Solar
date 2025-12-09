import { sql } from '@vercel/postgres';

export async function initDatabase() {
  try {
    // Create reservations table
    await sql`
      CREATE TABLE IF NOT EXISTS reservations (
        id TEXT PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        nights INTEGER NOT NULL,
        
        -- Guest Data
        main_guest_name TEXT NOT NULL,
        main_guest_cpf TEXT NOT NULL,
        main_guest_age TEXT,
        main_guest_email TEXT,
        main_guest_phone TEXT,
        
        additional_guests JSONB DEFAULT '[]',
        observations TEXT,
        
        -- Items
        rooms JSONB NOT NULL,
        extras JSONB DEFAULT '[]',
        
        -- Financials
        total_price DECIMAL(10, 2) NOT NULL,
        discount_code TEXT,
        discount_amount DECIMAL(10, 2),
        payment_method TEXT NOT NULL,
        card_details JSONB,
        
        -- Status
        status TEXT DEFAULT 'PENDING',
        
        -- Metadata
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create rooms table
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        capacity INTEGER NOT NULL,
        image_url TEXT,
        features JSONB DEFAULT '[]',
        total_quantity INTEGER NOT NULL,
        active BOOLEAN DEFAULT true,
        overrides JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create packages table
    await sql`
      CREATE TABLE IF NOT EXISTS packages (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        includes JSONB DEFAULT '[]',
        active BOOLEAN DEFAULT true,
        start_iso_date DATE NOT NULL,
        end_iso_date DATE NOT NULL,
        room_prices JSONB DEFAULT '[]',
        no_checkout_dates JSONB DEFAULT '[]',
        no_checkin_dates JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create discount_codes table
    await sql`
      CREATE TABLE IF NOT EXISTS discount_codes (
        code TEXT PRIMARY KEY,
        percentage INTEGER NOT NULL,
        active BOOLEAN DEFAULT true,
        start_date DATE,
        end_date DATE,
        min_nights INTEGER,
        full_period_required BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create extra_services table
    await sql`
      CREATE TABLE IF NOT EXISTS extra_services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create hotel_config table
    await sql`
      CREATE TABLE IF NOT EXISTS hotel_config (
        id INTEGER PRIMARY KEY DEFAULT 1,
        min_stay INTEGER DEFAULT 2,
        contact_email TEXT DEFAULT 'reserva@hotelsolar.tur.br',
        ai_knowledge_base TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export { sql };
