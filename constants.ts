
import { Room, HolidayPackage, DiscountCode, HotelConfig, ExtraService, Reservation } from './types';

export const ADMIN_CREDENTIALS = {
  email: 'geraldo@hotelsolar.tur.br',
  password: 'metron82'
};

const DEFAULT_HOTEL_INFO = `
Nome: Hotel Solar
Localização: Praia do Sol, Bahia, Brasil.
Descrição: Um refúgio paradisíaco de frente para o mar, focado em sustentabilidade, conforto e sol o ano todo.
Comodidades Gerais: Piscina infinita, acesso direto à praia, Spa Solar, Restaurante Gastronômico, Wi-Fi gratuito de alta velocidade, Bar molhado.
Políticas: Check-in 14h, Check-out 12h. Cancelamento grátis até 48h antes.
Café da manhã: Incluso em todas as diárias, servido das 07h às 10h.
Estacionamento: Gratuito e monitorado 24h.
Pet Friendly: Sim, aceitamos pets de pequeno porte (taxa extra de R$ 50/dia).
Temporadas:
- Alta Temporada: Dezembro a Fevereiro, Julho. (Preços regulares)
- Baixa Temporada: Maio, Junho, Agosto, Setembro, Outubro. (Preços ~30% mais baratos)
`;

export const INITIAL_CONFIG: HotelConfig = {
  minStay: 2,
  contactEmail: 'reservas@hotelsolar.tur.br',
  aiKnowledgeBase: DEFAULT_HOTEL_INFO
};

export const INITIAL_EXTRAS: ExtraService[] = [
  {
    id: 'lua-de-mel',
    name: 'Kit Lua de Mel',
    description: 'Decoração romântica com pétalas, espumante gelado, morangos com chocolate e café da manhã no quarto.',
    price: 350,
    imageUrl: 'https://picsum.photos/id/431/400/300',
    active: true
  },
  {
    id: 'mesa-posta',
    name: 'Mesa Posta Tropical',
    description: 'Montagem exclusiva de mesa para jantar ou almoço na varanda/sacada com itens temáticos e serviço dedicado.',
    price: 180,
    imageUrl: 'https://picsum.photos/id/425/400/300',
    active: true
  }
];

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'casal',
    name: 'Suíte Casal',
    description: 'Aconchego e privacidade ideal para casais. Decoração charmosa e ambiente relaxante.',
    price: 0,
    capacity: 2,
    imageUrl: 'https://picsum.photos/id/164/800/600',
    features: ['Cama Queen', 'Ar Condicionado', 'Smart TV', 'Frigobar'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'triplo',
    name: 'Suíte Triplo',
    description: 'Espaço versátil e confortável, perfeito para pequenos grupos de amigos ou família.',
    price: 0,
    capacity: 3,
    imageUrl: 'https://picsum.photos/id/102/800/600',
    features: ['1 Cama Casal + 1 Solteiro', 'Ar Condicionado', 'Wi-Fi', 'Mesa de Trabalho'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'quadruplo',
    name: 'Suíte Quádruplo',
    description: 'Amplo espaço para acomodar toda a família com conforto e praticidade.',
    price: 0,
    capacity: 4,
    imageUrl: 'https://picsum.photos/id/103/800/600',
    features: ['2 Camas Casal', 'Ar Condicionado', 'Armários Amplos', 'Secador de Cabelo'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'sacada-mar',
    name: 'Sacada Vista Mar',
    description: 'Acorde com a brisa do oceano e uma vista deslumbrante diretamente da sua sacada.',
    price: 0,
    capacity: 3,
    imageUrl: 'https://picsum.photos/id/184/800/600',
    features: ['Vista Mar Frontal', 'Varanda Privativa', 'Rede de Descanso', 'Cafeteira'],
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
    imageUrl: 'https://picsum.photos/id/214/800/600',
    features: ['Acesso Térreo', 'Jardim Privativo', 'Mesa Externa', 'Cozinha Compacta'],
    totalQuantity: 0,
    active: true,
    overrides: []
  },
  {
    id: 'loft',
    name: 'LOFT Exclusivo',
    description: 'Sofisticação e design moderno com pé direito alto. Uma experiência única de hospedagem.',
    price: 0,
    capacity: 4,
    imageUrl: 'https://picsum.photos/id/364/800/600',
    features: ['Design Duplex', 'Sala de Estar', 'Cozinha Completa', 'Vista Panorâmica'],
    totalQuantity: 0,
    active: true,
    overrides: []
  }
];

export const INITIAL_PACKAGES: HolidayPackage[] = [
  {
    id: 'carnaval',
    name: 'Pacote Carnaval Solar',
    description: '5 dias de festa e relaxamento com tudo incluído.',
    imageUrl: 'https://picsum.photos/id/338/800/600',
    includes: ['All Inclusive', 'Festas Temáticas', 'Transfer Aeroporto'],
    active: true,
    startIsoDate: '2025-02-28',
    endIsoDate: '2025-03-05',
    roomPrices: [
      { roomId: 'casal', price: 5500 },
      { roomId: 'triplo', price: 7500 },
      { roomId: 'sacada-mar', price: 9000 }
    ],
    noCheckoutDates: [],
    noCheckInDates: []
  },
  {
    id: 'romantic',
    name: 'Lua de Mel Solar',
    description: 'Experiência inesquecível para casais.',
    imageUrl: 'https://picsum.photos/id/360/800/600',
    includes: ['Jantar à luz de velas', 'Massagem Casal', 'Decoração Especial'],
    active: true,
    startIsoDate: '2025-06-01',
    endIsoDate: '2025-06-30',
    roomPrices: [
       { roomId: 'sacada-mar', price: 3200 },
       { roomId: 'loft', price: 4500 }
    ],
    noCheckoutDates: [],
    noCheckInDates: []
  },
  {
    id: 'pascoa',
    name: 'Páscoa em Família',
    description: 'Caça aos ovos e diversão garantida para as crianças.',
    imageUrl: 'https://picsum.photos/id/400/800/600',
    includes: ['Recreação Infantil', 'Almoço de Páscoa', 'Chocolate Artesanal'],
    active: true,
    startIsoDate: '2025-04-18',
    endIsoDate: '2025-04-21',
    roomPrices: [
        { roomId: 'quadruplo', price: 2800 },
        { roomId: 'varanda-terreo', price: 3100 }
    ],
    noCheckoutDates: [],
    noCheckInDates: []
  }
];

export const INITIAL_DISCOUNTS: DiscountCode[] = [
  {
    code: 'BEMVINDO10',
    percentage: 10,
    active: true,
    minNights: 0,
    fullPeriodRequired: false
    // startDate and endDate undefined means unlimited
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-170942',
    createdAt: new Date('2024-03-10T14:30:00'),
    checkIn: '2024-04-20',
    checkOut: '2024-04-25',
    nights: 5,
    mainGuest: {
      name: 'Roberto Carlos',
      cpf: '123.456.789-00',
      email: 'roberto@email.com',
      phone: '(11) 98888-7777'
    },
    additionalGuests: [
      { name: 'Maria Rita', cpf: '987.654.321-11', age: '35' }
    ],
    observations: 'Gostaria de travesseiros extras e vista alta.',
    rooms: [
      { name: 'Suíte Casal', priceSnapshot: 2500 }
    ],
    extras: [
       { name: 'Mesa Posta Tropical', quantity: 1, priceSnapshot: 180 }
    ],
    totalPrice: 2680,
    discountApplied: undefined,
    paymentMethod: 'PIX',
    status: 'CONFIRMED'
  },
  {
    id: 'RES-882103',
    createdAt: new Date('2024-03-12T09:15:00'),
    checkIn: '2024-05-10',
    checkOut: '2024-05-12',
    nights: 2,
    mainGuest: {
      name: 'Ana Paula',
      cpf: '555.444.333-22',
      email: 'ana@email.com',
      phone: '(21) 99999-0000'
    },
    additionalGuests: [],
    observations: '',
    rooms: [
      { name: 'Sacada Vista Mar', priceSnapshot: 1200 }
    ],
    extras: [],
    totalPrice: 1200,
    discountApplied: undefined,
    paymentMethod: 'CREDIT_CARD',
    cardDetails: {
      holderName: 'ANA PAULA SILVA',
      number: '4556 7890 1234 5678',
      expiry: '12/28',
      cvv: '123'
    },
    status: 'PENDING'
  }
];
    