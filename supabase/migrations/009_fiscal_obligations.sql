-- 009: obrigações tributárias da empresa (PGDAS-D, DCTFWeb etc.) com sino de lembrete
create table if not exists public.fiscal_obligations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  organ text default '',
  due_day int not null default 5,
  period text not null default 'M', -- M mensal | T trimestral | A anual
  active boolean not null default true,
  obs text default '',
  done jsonb not null default '{}'::jsonb, -- {"2026-10":"sem_movimento","2026-09":"pago",...}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.fiscal_obligations enable row level security;
drop policy if exists fiscal_owner_all on public.fiscal_obligations;
create policy fiscal_owner_all on public.fiscal_obligations
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create index if not exists fiscal_obligations_owner_idx on public.fiscal_obligations(owner_id, due_day);
