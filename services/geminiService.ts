
import { GoogleGenAI } from "@google/genai";
import { Room, HolidayPackage, DiscountCode, ViewState, ExtraService } from '../types';

// Lazy initialization to avoid errors when API key is not set
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. AI features will be disabled.');
      throw new Error('API key not configured');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

// Define context interface
export interface UserContext {
  currentView: ViewState;
  selectedRooms: Room[]; // Changed to Array
  checkIn: Date | null;
  checkOut: Date | null;
}

const generateSystemInstruction = (
  rooms: Room[], 
  packages: HolidayPackage[],
  extras: ExtraService[],
  hotelInfo: string,
  userContext?: UserContext
) => `
Você é a 'Sol', a assistente virtual inteligente e proativa do Hotel Solar.
Sua personalidade é calorosa, acolhedora e focada em CONVERTER RESERVAS (vendas).

BASE DE CONHECIMENTO DO HOTEL (Use estas informações para responder):
${hotelInfo}

CONTEXTO ATUAL DO CLIENTE (O que ele está vendo agora):
- Tela Atual: ${userContext?.currentView || 'Início'}
- Quartos Selecionados: ${userContext?.selectedRooms && userContext.selectedRooms.length > 0 ? userContext.selectedRooms.map(r => r.name).join(', ') : 'Nenhum'}
- Valor Total (Aprox): ${userContext?.selectedRooms ? 'R$ ' + userContext.selectedRooms.reduce((acc, r) => acc + r.price, 0) : '0'}
- Data Check-in: ${userContext?.checkIn ? userContext.checkIn.toLocaleDateString('pt-BR') : 'Não definida'}
- Data Check-out: ${userContext?.checkOut ? userContext.checkOut.toLocaleDateString('pt-BR') : 'Não definida'}

Quartos Disponíveis e Tarifas Básicas:
${JSON.stringify(rooms.filter(r => r.active).map(r => ({ id: r.id, name: r.name, price: r.price, capacity: r.capacity, features: r.features })))}

Pacotes Atuais:
${JSON.stringify(packages.filter(p => p.active).map(p => ({
  name: p.name,
  dates: `${p.startIsoDate} a ${p.endIsoDate}`,
  items_included: p.includes,
  prices: p.roomPrices.map(rp => {
     const roomName = rooms.find(r => r.id === rp.roomId)?.name || rp.roomId;
     return `${roomName}: R$ ${rp.price}`;
  })
})))}

Produtos e Serviços Extras:
${JSON.stringify(extras.filter(e => e.active).map(e => ({ name: e.name, price: e.price, description: e.description })))}

Regras de Comportamento:
1. Use a "Base de Conhecimento do Hotel" acima para tirar dúvidas sobre café da manhã, pets, horários, etc.
2. Use o contexto do cliente para ser útil. Ex: Se ele está na tela de "Reservas" mas não escolheu data, diga "Para prosseguir, preciso que selecione as datas no calendário acima".
3. Se o cliente selecionou quartos, elogie as escolhas. Se selecionou mais de um, comente como é bom viajar em grupo/família.
4. Tente fazer upsell oferecendo os "Produtos Extras" (como Kit Lua de Mel ou Mesa Posta) se parecer apropriado ao contexto.
5. Se o cliente está demorando na tela de pagamento/reserva, ofereça ajuda com cupons ou tire dúvidas sobre cancelamento.
6. Responda sempre em Português do Brasil.
7. Seja breve.
`;

export const sendMessageToAI = async (
  history: { role: string; parts: { text: string }[] }[], 
  newMessage: string,
  currentRooms: Room[],
  currentPackages: HolidayPackage[],
  currentExtras: ExtraService[],
  hotelInfo: string,
  userContext: UserContext
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const instruction = generateSystemInstruction(currentRooms, currentPackages, currentExtras, hotelInfo, userContext);
    
    const chat = getAI().chats.create({
      model: model,
      config: {
        systemInstruction: instruction,
      },
      history: history 
    });

    const result = await chat.sendMessage({
        message: newMessage
    });

    return result.text;
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);
    return "Desculpe, estou tendo um pouco de dificuldade em consultar o sistema agora. Pode tentar novamente em instantes?";
  }
};

// --- Admin AI Logic ---

interface AdminContext {
  rooms: Room[];
  packages: HolidayPackage[];
  discounts: DiscountCode[];
  extras: ExtraService[];
}

interface AdminResponse {
  rooms?: Room[];
  packages?: HolidayPackage[];
  discounts?: DiscountCode[];
  extras?: ExtraService[];
  message: string;
}

export const processAdminCommand = async (
  command: string,
  context: AdminContext
): Promise<AdminResponse> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const prompt = `
      Você é o Assistente Administrativo IA do Hotel Solar.
      Seu trabalho é modificar o banco de dados do hotel com base em comandos de texto natural.
      
      ESTADO ATUAL DO BANCO DE DADOS (JSON):
      Rooms: ${JSON.stringify(context.rooms)}
      Packages: ${JSON.stringify(context.packages)}
      Discounts: ${JSON.stringify(context.discounts)}
      Extras (Produtos): ${JSON.stringify(context.extras)}

      COMANDO DO ADMINISTRADOR: "${command}"

      INSTRUÇÕES CRÍTICAS PARA ATUALIZAÇÃO DE PREÇOS E DISPONIBILIDADE:
      
      1. ALTERAÇÃO DE PREÇO BASE (Geral):
         Se o comando for "Aumente a diária base", altere a propriedade "price" do objeto Room.

      2. ALTERAÇÃO DE PREÇO/DISPONIBILIDADE EM DATAS ESPECÍFICAS (Mapa Geral):
         Se o comando mencionar DATAS (ex: "Feche a venda do dia 25/12" ou "Mude o preço de 20 a 30 de dez"), você deve preencher o array "overrides" dentro do objeto Room.
         
         ESTRUTURA DE "OVERRIDES" (Exceções):
         overrides: [
           {
             "dateIso": "YYYY-MM-DD", (Data específica)
             "price": 500, (Novo preço para este dia)
             "availableQuantity": 5, (Estoque para este dia)
             "isClosed": true/false (Se true, fecha a venda neste dia)
           }
         ]
         
         IMPORTANTE: Ao adicionar um override, mantenha os overrides existentes se forem de outras datas.

      INSTRUÇÕES GERAIS:
      1. Analise o comando e modifique os dados.
      2. Retorne APENAS um JSON válido.
      3. O JSON deve conter as chaves "rooms", "packages", "discounts" ou "extras" APENAS se houver alteração.
      4. O valor dessas chaves deve ser a lista COMPLETA e ATUALIZADA.
      5. Inclua uma chave "message" descrevendo brevemente o que foi feito.

      SCHEMA DE RETORNO ESPERADO (JSON Puro):
      {
        "rooms": [ ... ],
        "packages": [ ... ],
        "discounts": [ ... ],
        "extras": [ ... ],
        "message": "Resumo da ação"
      }
    `;

    const result = await getAI().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.text;
    if (!responseText) throw new Error("Sem resposta da IA");

    const parsedData = JSON.parse(responseText) as AdminResponse;
    return parsedData;

  } catch (error) {
    console.error("Erro no Admin AI:", error);
    return { message: "Erro ao processar comando de IA. Tente novamente." };
  }
};
