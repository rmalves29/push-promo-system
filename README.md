# 🔔 Push Promo System

Sistema de notificações push para enviar promoções aos seus clientes via Web Push.

## Funcionalidades

- Clientes acessam seu site e ativam as notificações com 1 clique
- Painel admin protegido por senha em `/admin`
- Envio de promoções para todos os inscritos simultaneamente
- Histórico de campanhas enviadas
- Remove automaticamente inscritos que cancelaram as notificações

## Stack

- **Next.js 14** — frontend + API routes
- **Supabase** — banco de dados PostgreSQL (gratuito)
- **Web Push / VAPID** — envio de notificações sem Firebase

---

## ⚙️ Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/malves29/push-promo-system
cd push-promo-system
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto gratuito
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/schema.sql`
3. Copie a **URL** e as **chaves** em Project Settings → API

### 3. Gere as chaves VAPID

```bash
npx web-push generate-vapid-keys
```

### 4. Configure as variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_public_key
VAPID_PRIVATE_KEY=sua_private_key
VAPID_EMAIL=mailto:seu@email.com

ADMIN_PASSWORD=sua_senha_segura
```

### 5. Rode localmente

```bash
npm run dev
```

Acesse:
- `http://localhost:3000` — página de inscrição dos clientes
- `http://localhost:3000/admin` — painel de envio de promoções

---

## 🚀 Deploy (Vercel — recomendado, gratuito)

1. Acesse [vercel.com](https://vercel.com) e importe este repositório
2. Configure as variáveis de ambiente no painel da Vercel
3. Deploy automático!

---

## 📱 Como funciona para os clientes

1. Cliente acessa seu site → vê o botão "Ativar Notificações"
2. Aceita a permissão no navegador
3. A inscrição é salva no banco de dados
4. Você envia uma promoção no painel → cliente recebe a notificação mesmo com o site fechado

## 🗃️ Estrutura do banco

| Tabela | Descrição |
|---|---|
| `subscribers` | Dados de inscrição de cada cliente |
| `campaigns` | Histórico de promoções enviadas |
