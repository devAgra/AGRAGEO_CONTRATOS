-- Agrageo Suite: schema inicial seguro
-- Execute via Supabase migrations. Nunca coloque service_role key no frontend.
create extension if not exists pgcrypto;

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Agrageo Consultoria',
  cnpj text,
  address text,
  city text default 'Várzea Grande - MT',
  phone text,
  email text,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  document text,
  representative text,
  email text,
  phone text,
  address text,
  city text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  default_scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_models (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  document_type text not null check (document_type in ('proposal','contract','other')),
  content jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clauses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  document_type text not null check (document_type in ('proposal','contract','other')),
  status text not null default 'draft' check (status in ('draft','sent','approved','active','expired','cancelled')),
  client_id uuid references public.clients(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  model_id uuid references public.document_models(id) on delete set null,
  title text,
  value numeric(14,2) not null default 0,
  deadline text,
  payment_terms text,
  validity text,
  content jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, number)
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version integer not null,
  content jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id, version)
);

create index if not exists clients_owner_idx on public.clients(owner_id);
create index if not exists services_owner_idx on public.services(owner_id);
create index if not exists documents_owner_idx on public.documents(owner_id);
create index if not exists documents_status_idx on public.documents(owner_id,status);

alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.document_models enable row level security;
alter table public.clauses enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.company_settings enable row level security;

-- Usuário autenticado só acessa os próprios registros.
create policy "clients own rows" on public.clients for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "services own rows" on public.services for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "models own rows" on public.document_models for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "clauses own rows" on public.clauses for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "documents own rows" on public.documents for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "versions own rows" on public.document_versions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- A configuração empresarial pode ser restrita posteriormente a uma tabela de perfis/admin.
create policy "company settings authenticated" on public.company_settings for select to authenticated using (true);
create policy "company settings insert authenticated" on public.company_settings for insert to authenticated with check (true);
create policy "company settings update authenticated" on public.company_settings for update to authenticated using (true) with check (true);

-- Atualização automática de updated_at.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$ declare t text; begin
  foreach t in array array['company_settings','clients','services','document_models','clauses','documents'] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I',t,t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end $$;
