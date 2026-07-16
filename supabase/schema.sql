-- CRM Pessoal — schema completo + Auth-ready RLS
-- Execute no SQL Editor do Supabase

-- Enums
create type public.client_type as enum (
  'hotel', 'pousada', 'resort', 'hostel', 'outro'
);

create type public.client_status as enum (
  'nao_contatado',
  'primeiro_contato',
  'aguardando_resposta',
  'negociacao',
  'cliente',
  'perdido'
);

create type public.activity_type as enum (
  'whatsapp', 'email', 'ligacao', 'visita', 'observacao'
);

create type public.template_category as enum (
  'primeiro_contato', 'follow_up', 'apresentacao', 'negociacao'
);

-- Clientes
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_name text not null,
  type public.client_type not null default 'hotel',
  city text,
  state text,
  phone text,
  whatsapp text,
  email text,
  website text,
  contact_name text,
  contact_role text,
  notes text,
  status public.client_status not null default 'nao_contatado',
  created_at timestamptz not null default now(),
  last_contact_at timestamptz,
  next_follow_up_at timestamptz
);

create index clients_user_id_idx on public.clients (user_id);
create index clients_status_idx on public.clients (user_id, status);
create index clients_follow_up_idx on public.clients (user_id, next_follow_up_at);
create index clients_company_name_idx on public.clients (user_id, company_name);

-- Histórico de atividades
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  type public.activity_type not null,
  content text,
  created_at timestamptz not null default now()
);

create index activities_client_id_idx on public.activities (client_id, created_at desc);
create index activities_user_id_idx on public.activities (user_id);

-- Modelos de mensagem
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category public.template_category not null default 'primeiro_contato',
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index message_templates_user_id_idx on public.message_templates (user_id);

-- Configurações do usuário
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  days_without_contact integer not null default 7,
  updated_at timestamptz not null default now()
);

-- updated_at trigger para templates
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger message_templates_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

-- Ao criar usuário: settings default
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.clients enable row level security;
alter table public.activities enable row level security;
alter table public.message_templates enable row level security;
alter table public.user_settings enable row level security;

-- Policies: clients
create policy "clients_select_own"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Policies: activities
create policy "activities_select_own"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "activities_insert_own"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "activities_update_own"
  on public.activities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "activities_delete_own"
  on public.activities for delete
  using (auth.uid() = user_id);

-- Policies: message_templates
create policy "templates_select_own"
  on public.message_templates for select
  using (auth.uid() = user_id);

create policy "templates_insert_own"
  on public.message_templates for insert
  with check (auth.uid() = user_id);

create policy "templates_update_own"
  on public.message_templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "templates_delete_own"
  on public.message_templates for delete
  using (auth.uid() = user_id);

-- Policies: user_settings
create policy "settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
