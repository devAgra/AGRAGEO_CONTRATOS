-- ============================================================
-- 007_requests.sql — Módulo "Solicitações" (CRM) da Agrageo Suite
-- Registra demandas recebidas de clientes (WhatsApp/e-mail/indicação),
-- com áreas/matrículas, documentos e status de acompanhamento,
-- permitindo gerar a Proposta Comercial em 1 clique.
-- Rode este arquivo no SQL Editor do Supabase (ou via setup_database.js).
-- ============================================================

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid,
  number text,                                  -- REQ-2026-0001
  title text not null,                          -- escopo resumido da demanda
  client_id uuid references public.clients(id) on delete set null,
  client_name text default '',                  -- nome do solicitante (mesmo sem cadastro)
  email text default '',
  phone text default '',
  source text default 'WhatsApp',               -- WhatsApp | E-mail | Indicação | Site | Ligação | Presencial
  status text not null default 'novo'
    check (status in ('novo','em_analise','orcamento','negociando','convertido','ganhou','perdido')),
  location text default '',                     -- município/UF do imóvel
  deadline text default '',                     -- prazo desejado pelo cliente
  description text default '',                  -- texto completo da demanda (colado do WhatsApp)
  areas jsonb default '[]'::jsonb,              -- [{line:"Matrícula 914 (CRI Vera/MT): 3.678,40 ha"}, ...]
  documents jsonb default '[]'::jsonb,          -- docs recebidos pendentes etc.
  requested_items text default '',              -- o que o cliente solicita (orçamento, ART...)
  proposal_id uuid,                             -- proposta gerada a partir desta solicitação
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requests_owner_idx   on public.requests (owner_id);
create index if not exists requests_status_idx  on public.requests (status);
create index if not exists requests_client_idx  on public.requests (client_id);
create index if not exists requests_created_idx on public.requests (created_at desc);

alter table public.requests enable row level security;

drop policy if exists "requests_select_own" on public.requests;
create policy "requests_select_own" on public.requests
  for select using (auth.uid() = owner_id or owner_id is null);

drop policy if exists "requests_insert_own" on public.requests;
create policy "requests_insert_own" on public.requests
  for insert with check (auth.uid() = owner_id or owner_id is null);

drop policy if exists "requests_update_own" on public.requests;
create policy "requests_update_own" on public.requests
  for update using (auth.uid() = owner_id or owner_id is null);

drop policy if exists "requests_delete_own" on public.requests;
create policy "requests_delete_own" on public.requests
  for delete using (auth.uid() = owner_id or owner_id is null);
