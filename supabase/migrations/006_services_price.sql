-- 006: preço padrão e ART/RRT nos serviços (meduração de valor por serviço)
alter table public.services add column if not exists price numeric(12,2);
alter table public.services add column if not exists art text;
