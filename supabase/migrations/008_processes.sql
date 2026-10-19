-- 008: módulo Processos Públicos (SEMA/INCRA/CARTÓRIO/etc.) — tabela processes + RLS
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz,
  number text,
  protocol text,
  organ text,
  kind text,
  title text not null,
  client_id uuid,
  document_id uuid,
  status text default 'andamento',
  notes text,
  history jsonb default '[]'::jsonb,
  next_action_date date,
  last_checked_at timestamptz
);
alter table public.processes add column if not exists owner_id uuid;
alter table public.processes add column if not exists updated_at timestamptz;
alter table public.processes add column if not exists number text;
alter table public.processes add column if not exists protocol text;
alter table public.processes add column if not exists organ text;
alter table public.processes add column if not exists kind text;
alter table public.processes add column if not exists title text;
alter table public.processes add column if not exists client_id uuid;
alter table public.processes add column if not exists document_id uuid;
alter table public.processes add column if not exists status text;
alter table public.processes add column if not exists notes text;
alter table public.processes add column if not exists history jsonb;
alter table public.processes add column if not exists next_action_date date;
alter table public.processes add column if not exists last_checked_at timestamptz;
create index if not exists processes_owner_created_idx on public.processes (owner_id, created_at desc);

alter table public.processes enable row level security;
drop policy if exists "processes_select_own" on public.processes;
create policy "processes_select_own" on public.processes for select using (auth.uid() = owner_id);
drop policy if exists "processes_insert_own" on public.processes;
create policy "processes_insert_own" on public.processes for insert with check (auth.uid() = owner_id);
drop policy if exists "processes_update_own" on public.processes;
create policy "processes_update_own" on public.processes for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "processes_delete_own" on public.processes;
create policy "processes_delete_own" on public.processes for delete using (auth.uid() = owner_id);
