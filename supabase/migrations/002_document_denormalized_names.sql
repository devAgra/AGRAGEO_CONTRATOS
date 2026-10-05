-- Keeps document snapshots stable even if a client/service is renamed later.
alter table public.documents add column if not exists client_name text;
alter table public.documents add column if not exists service_name text;
