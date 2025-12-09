# Configuração do Motor de Reservas Hotel Solar

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Vercel
- Conta no Resend (para envio de e-mails)

## 🚀 Configuração Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/geraldo-solar/Motor-de-reservas-Hotel-Solar.git
cd Motor-de-reservas-Hotel-Solar
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure as seguintes variáveis:

#### 3.1. Gemini AI (Assistente Virtual)

1. Acesse: https://aistudio.google.com/apikey
2. Crie uma API Key
3. Adicione no `.env.local`:

```env
GEMINI_API_KEY=sua_chave_aqui
```

#### 3.2. Resend (Envio de E-mails)

1. Acesse: https://resend.com/
2. Crie uma conta gratuita (3000 emails/mês)
3. Crie uma API Key em: https://resend.com/api-keys
4. Adicione no `.env.local`:

```env
RESEND_API_KEY=re_sua_chave_aqui
```

**Importante**: Configure o domínio de envio no Resend:
- Vá em "Domains" no painel do Resend
- Adicione o domínio `hotelsolar.tur.br`
- Configure os registros DNS conforme instruções
- Verifique o domínio

#### 3.3. Vercel Postgres (Banco de Dados)

1. Acesse o projeto no Vercel: https://vercel.com/geraldo-barros-projects-7276ca26/motor-de-reservas-hotel-solar
2. Vá em "Storage" → "Create Database" → "Postgres"
3. Crie o banco de dados
4. Copie as variáveis de ambiente geradas automaticamente
5. Cole no `.env.local`:

```env
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...
```

#### 3.4. PIX (Chave PIX para Pagamentos)

Configure sua chave PIX (e-mail, telefone, CPF ou chave aleatória):

```env
PIX_KEY=reserva@hotelsolar.tur.br
```

#### 3.5. URL da Aplicação

```env
VERCEL_URL=https://motor-de-reservas-hotel-solar.vercel.app
```

### 4. Inicializar o Banco de Dados

O banco de dados será inicializado automaticamente na primeira requisição à API. As tabelas serão criadas conforme definido em `/api/db.ts`.

### 5. Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📤 Deploy no Vercel

### Opção 1: Via Git (Recomendado)

1. Faça commit das alterações:

```bash
git add .
git commit -m "feat: Add backend, database and email integration"
git push origin main
```

2. O Vercel fará o deploy automaticamente

### Opção 2: Via CLI do Vercel

```bash
npm install -g vercel
vercel
```

### Configurar Variáveis de Ambiente no Vercel

1. Acesse o projeto no Vercel
2. Vá em "Settings" → "Environment Variables"
3. Adicione todas as variáveis do `.env.local`:
   - `GEMINI_API_KEY`
   - `RESEND_API_KEY`
   - `PIX_KEY`
   - `VERCEL_URL`
   - As variáveis do Postgres (já configuradas automaticamente)

4. Faça um novo deploy para aplicar as variáveis

## 🧪 Testar o Sistema

### 1. Testar Criação de Reserva

1. Acesse o site
2. Selecione um quarto
3. Escolha as datas
4. Preencha os dados do hóspede
5. Clique em "Concluir Reserva"
6. Verifique se o e-mail chegou em `reserva@hotelsolar.tur.br`

### 2. Testar Pagamento PIX

1. Selecione "PIX" como forma de pagamento
2. Após finalizar, o código PIX será exibido
3. Use o código para fazer o pagamento

### 3. Testar Pagamento com Cartão

1. Selecione "Cartão de Crédito"
2. Preencha os dados do cartão
3. Os dados serão enviados por e-mail para processamento manual

## 📧 Configuração do E-mail

### Formato do E-mail Enviado

O e-mail enviado para `reserva@hotelsolar.tur.br` contém:

- ✅ ID da Reserva
- ✅ Dados do Check-in/Check-out
- ✅ Informações do Hóspede Principal
- ✅ Hóspedes Adicionais
- ✅ Quartos Selecionados
- ✅ Serviços Extras
- ✅ Valor Total e Descontos
- ✅ Forma de Pagamento
- ✅ Dados do Cartão (se aplicável)
- ✅ Link para o Painel Administrativo

### Personalizar o E-mail

Edite o arquivo `/api/email/send-reservation.ts` para customizar:
- Template HTML
- Remetente
- Destinatário
- Assunto

## 🔒 Segurança

### Dados Sensíveis

- ⚠️ **Nunca** commite o arquivo `.env.local`
- ⚠️ Mantenha as API Keys em segredo
- ⚠️ Use HTTPS em produção (Vercel fornece automaticamente)

### Dados de Cartão de Crédito

- Os dados do cartão são armazenados no banco de dados
- **Recomendação**: Implemente criptografia para dados sensíveis
- **Melhor prática**: Integre com gateway de pagamento (Stripe, Mercado Pago)

## 📊 Banco de Dados

### Tabelas Criadas

1. **reservations** - Reservas dos clientes
2. **rooms** - Quartos disponíveis
3. **packages** - Pacotes de férias
4. **discount_codes** - Códigos de desconto
5. **extra_services** - Serviços extras
6. **hotel_config** - Configurações gerais

### Acessar o Banco de Dados

No painel do Vercel:
1. Vá em "Storage" → Seu banco Postgres
2. Clique em "Data" para visualizar os dados
3. Use "Query" para executar SQL

## 🐛 Troubleshooting

### Erro: "Failed to create reservation"

- Verifique se as variáveis de ambiente do Postgres estão configuradas
- Confirme que o banco de dados foi criado no Vercel

### Erro: "Failed to send email"

- Verifique se o `RESEND_API_KEY` está correto
- Confirme que o domínio foi verificado no Resend
- Teste o envio de e-mail no painel do Resend

### Erro: "GEMINI_API_KEY not found"

- Adicione a chave do Gemini no `.env.local` e no Vercel

## 📞 Suporte

Para dúvidas ou problemas:
- E-mail: reserva@hotelsolar.tur.br
- GitHub Issues: https://github.com/geraldo-solar/Motor-de-reservas-Hotel-Solar/issues

## 🎯 Próximos Passos

- [ ] Integrar gateway de pagamento real (Stripe/Mercado Pago)
- [ ] Adicionar confirmação de pagamento PIX via webhook
- [ ] Implementar dashboard de métricas no painel admin
- [ ] Adicionar e-mail de confirmação para o cliente
- [ ] Implementar sistema de notificações push
- [ ] Adicionar relatórios de ocupação
- [ ] Implementar sistema de avaliações
