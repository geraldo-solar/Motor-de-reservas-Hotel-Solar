# Configurar Brevo API Key no Vercel

## Passo 1: Acessar o Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto: **motor-de-reservas-hotel-solar**

## Passo 2: Adicionar Variável de Ambiente

1. Vá em **Settings** (Configurações)
2. Clique em **Environment Variables** (Variáveis de Ambiente)
3. Adicione uma nova variável:
   - **Name (Nome):** `BREVO_API_KEY`
   - **Value (Valor):** `[SUA_API_KEY_DO_BREVO_AQUI]`
   - **Environments:** Selecione **Production**, **Preview** e **Development**
4. Clique em **Save** (Salvar)

## Passo 3: Fazer Redeploy

Após adicionar a variável, o Vercel vai fazer um redeploy automático.

Se não fizer automaticamente:
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deployment
3. Clique em **Redeploy**

## Pronto!

Após o redeploy, os emails serão enviados via Brevo automaticamente.
