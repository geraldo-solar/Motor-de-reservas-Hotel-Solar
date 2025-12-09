import { sql } from '@vercel/postgres';

// Initial data from constants.ts
const INITIAL_ROOMS = [
  {
    id: 'suite-casal',
    name: 'Suíte Casal',
    description: 'Aconchego e privacidade ideal para casais. Decoração charmosa e ambiente relaxante.',
    price: 0,
    capacity: 2,
    imageUrl: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&q=80&w=800',
    features: ['Cama Queen', 'Ar Condicionado', 'Smart TV'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'suite-triplo',
    name: 'Suíte Triplo',
    description: 'Espaço versátil e confortável, perfeito para pequenos grupos de amigos ou família.',
    price: 0,
    capacity: 3,
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800',
    features: ['1 Cama Casal + 1 Solteiro', 'Ar Condicionado', 'Wi-Fi'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'suite-quadruplo',
    name: 'Suíte Quádruplo',
    description: 'Amplo espaço para acomodar toda a família com conforto e praticidade.',
    price: 0,
    capacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800',
    features: ['2 Camas Casal', 'Ar Condicionado', 'Armários Amplos'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'sacada-vista-mar',
    name: 'Sacada Vista Mar',
    description: 'Acorde com a brisa do oceano e uma vista deslumbrante diretamente da sua sacada.',
    price: 0,
    capacity: 3,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800',
    features: ['Vista Mar Frontal', 'Varanda Privativa', 'Rede de Descanso'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'varanda-terreo',
    name: 'Varanda Térreo',
    description: 'Acesso facilitado e direto aos jardins e à área da piscina. Ideal para quem busca praticidade.',
    price: 0,
    capacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&q=80&w=800',
    features: ['Acesso Térreo', 'Jardim Privativo', 'Mesa Externa'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'loft-exclusivo',
    name: 'LOFT Exclusivo',
    description: 'Sofisticação e design moderno com pé direito alto. Uma experiência única de hospedagem.',
    price: 0,
    capacity: 4,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    features: ['Design Duplex', 'Sala de Estar', 'Cozinha Completa'],
    totalQuantity: 0,
    active: true,
    overrides: []
  }
];

const INITIAL_EXTRAS = [
  {
    id: 'cafe-manha',
    name: 'Café da Manhã',
    description: 'Café da manhã completo servido no restaurante',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=400',
    active: true
  },
  {
    id: 'transfer-aeroporto',
    name: 'Transfer Aeroporto',
    description: 'Transporte do/para aeroporto',
    price: 80,
    imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=400',
    active: true
  }
];

const INITIAL_DISCOUNTS = [
  {
    code: 'VERAO2024',
    percentage: 15,
    active: true,
    startDate: '2024-12-01',
    endDate: '2025-03-31',
    minNights: 3,
    fullPeriodRequired: false
  },
  {
    code: 'FERIADO',
    percentage: 10,
    active: true,
    minNights: 2,
    fullPeriodRequired: false
  }
];

async function populateDatabase() {
  try {
    console.log('Starting database population...');

    // Insert rooms
    console.log('Inserting rooms...');
    for (const room of INITIAL_ROOMS) {
      await sql`
        INSERT INTO rooms (id, name, description, price, capacity, image_url, features, total_quantity, active, overrides)
        VALUES (
          ${room.id},
          ${room.name},
          ${room.description},
          ${room.price},
          ${room.capacity},
          ${room.imageUrl},
          ${JSON.stringify(room.features)},
          ${room.totalQuantity},
          ${room.active},
          ${JSON.stringify(room.overrides)}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          capacity = EXCLUDED.capacity,
          image_url = EXCLUDED.image_url,
          features = EXCLUDED.features,
          total_quantity = EXCLUDED.total_quantity,
          active = EXCLUDED.active,
          overrides = EXCLUDED.overrides
      `;
    }
    console.log(`✓ Inserted ${INITIAL_ROOMS.length} rooms`);

    // Insert extras
    console.log('Inserting extra services...');
    for (const extra of INITIAL_EXTRAS) {
      await sql`
        INSERT INTO extra_services (id, name, description, price, image_url, active)
        VALUES (
          ${extra.id},
          ${extra.name},
          ${extra.description},
          ${extra.price},
          ${extra.imageUrl},
          ${extra.active}
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          image_url = EXCLUDED.image_url,
          active = EXCLUDED.active
      `;
    }
    console.log(`✓ Inserted ${INITIAL_EXTRAS.length} extra services`);

    // Insert discounts
    console.log('Inserting discount codes...');
    for (const discount of INITIAL_DISCOUNTS) {
      await sql`
        INSERT INTO discount_codes (code, percentage, active, start_date, end_date, min_nights, full_period_required)
        VALUES (
          ${discount.code},
          ${discount.percentage},
          ${discount.active},
          ${discount.startDate || null},
          ${discount.endDate || null},
          ${discount.minNights || null},
          ${discount.fullPeriodRequired}
        )
        ON CONFLICT (code) DO UPDATE SET
          percentage = EXCLUDED.percentage,
          active = EXCLUDED.active,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          min_nights = EXCLUDED.min_nights,
          full_period_required = EXCLUDED.full_period_required
      `;
    }
    console.log(`✓ Inserted ${INITIAL_DISCOUNTS.length} discount codes`);

    // Insert default config
    console.log('Inserting hotel configuration...');
    await sql`
      INSERT INTO hotel_config (id, min_stay, contact_email, ai_knowledge_base)
      VALUES (
        1,
        2,
        'reserva@hotelsolar.tur.br',
        ''
      )
      ON CONFLICT (id) DO UPDATE SET
        min_stay = EXCLUDED.min_stay,
        contact_email = EXCLUDED.contact_email
    `;
    console.log('✓ Inserted hotel configuration');

    console.log('\n✅ Database populated successfully!');
  } catch (error) {
    console.error('❌ Error populating database:', error);
    throw error;
  }
}

populateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
