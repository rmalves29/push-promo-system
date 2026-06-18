-- Tabela de subscribers (clientes que aceitaram notificações)
create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- Tabela de campanhas (histórico de envios)
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text,
  recipients integer default 0,
  sent_at timestamptz default now()
);

-- Desabilitar RLS (acesso pelo service role key no backend)
alter table subscribers disable row level security;
alter table campaigns disable row level security;
