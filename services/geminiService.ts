
import { GoogleGenAI } from "@google/genai";
import { Room, HolidayPackage, DiscountCode, ViewState, ExtraService } from '../types';

// Lazy initialization to avoid errors when API key is not set
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
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
    
    // Minimize context - only send essential data to reduce tokens
    const simplifiedRooms = context.rooms.map(r => ({
      id: r.id,
      name: r.name,
      price: r.price,
      totalQuantity: r.totalQuantity,
      // Only include overrides if they exist and are not empty
      ...(r.overrides && r.overrides.length > 0 ? { overrides: r.overrides.slice(0, 10) } : {})
    }));
    
    const simplifiedPackages = context.packages.map(p => ({
      id: p.id,
      name: p.name,
      dates: `${p.startIsoDate} to ${p.endIsoDate}`
    }));
    
    const simplifiedDiscounts = context.discounts.map(d => ({
      code: d.code,
      pct: d.percentage
    }));
    
    const simplifiedExtras = context.extras.map(e => ({
      name: e.name,
      price: e.price
    }));
    
    const prompt = `
      Você é o Assistente Administrativo IA do Hotel Solar.
      Seu trabalho é modificar o banco de dados do hotel com base em comandos de texto natural.
      
      ESTADO ATUAL (Resumido):
      Rooms: ${JSON.stringify(simplifiedRooms)}
      Packages: ${JSON.stringify(simplifiedPackages)}
      Discounts: ${JSON.stringify(simplifiedDiscounts)}
      Extras: ${JSON.stringify(simplifiedExtras)}

      COMANDO: "${command}"

      REGRAS:
      1. Para alterar preço base: modifique "price" do Room
      2. Para datas específicas: use "overrides" com formato:
         {"dateIso":"YYYY-MM-DD","price":500,"availableQuantity":5,"noCheckIn":false,"noCheckOut":false,"isClosed":false}
      3. Mantenha overrides existentes de outras datas
      4. Retorne JSON com chaves modificadas + "message"
      5. Lista COMPLETA dos itens alterados
      
      RETORNO:
      {"rooms":[...],"packages":[...],"discounts":[...],"extras":[...],"message":"texto"}
    `;

    const result = await getAI().models.generateContent({
      model: model,
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    let responseText = result.text;
    if (!responseText) throw new Error("Sem resposta da IA");

    console.log('[ADMIN AI] Raw response:', responseText.substring(0, 200));
    
    // Extract JSON from markdown code blocks or plain text
    let jsonText = responseText;
    
    // Try to extract from markdown code block
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1].trim();
      console.log('[ADMIN AI] Extracted from code block');
    } else {
      // Try to find JSON object in the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
        console.log('[ADMIN AI] Extracted JSON object');
      }
    }
    
    console.log('[ADMIN AI] Parsing JSON:', jsonText.substring(0, 200));
    
    const parsedData = JSON.parse(jsonText) as AdminResponse;
    return parsedData;

  } catch (error) {
    console.error("Erro no Admin AI:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error details:", errorMessage);
    return { message: `Erro ao processar comando de IA: ${errorMessage}. Tente novamente.` };
  }
};
