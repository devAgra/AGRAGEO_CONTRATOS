-- 005: catálogo de serviços — códigos profissionais (CFO/CREA-MT, CFT), categoria e responsável técnico
alter table public.services add column if not exists codes text;
alter table public.services add column if not exists category text;
alter table public.services add column if not exists responsible text;
