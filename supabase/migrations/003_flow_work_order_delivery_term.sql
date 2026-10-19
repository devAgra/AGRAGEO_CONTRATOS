-- Fluxo profissional: Proposta -> Contrato -> Ordem de Serviço -> Termo de Entrega
-- Expande os CHECKs da tabela documents para aceitar os novos tipos e status.
-- Idempotente: pode ser executada mais de uma vez sem erro.

alter table public.documents drop constraint if exists documents_document_type_check;
alter table public.documents add constraint documents_document_type_check
  check (document_type in ('proposal','contract','work_order','delivery_term','other'));

alter table public.documents drop constraint if exists documents_status_check;
alter table public.documents add constraint documents_status_check
  check (status in ('draft','sent','approved','converted','active','expired','cancelled','delivered'));

-- Colunas auxiliares do fluxo (backfill a partir do jsonb content, que já guarda origin_proposal).
alter table public.documents add column if not exists origin_proposal text;
alter table public.documents add column if not exists sent_at timestamptz;
alter table public.documents add column if not exists has_os boolean not null default false;
alter table public.documents add column if not exists has_term boolean not null default false;

update public.documents
   set origin_proposal = content->>'origin_proposal'
 where (origin_proposal is null or origin_proposal = '')
   and jsonb_typeof(content) = 'object'
   and content ? 'origin_proposal';

-- Vincula automaticamente documentos antigos que citam o número de um contrato existente.
update public.documents d
   set origin_proposal = c.number
 from public.documents c
 where c.document_type = 'contract'
   and c.owner_id = d.owner_id
   and (d.origin_proposal is null or d.origin_proposal = '')
   and d.content->>'origin_proposal' = c.number;

create index if not exists documents_type_idx on public.documents(owner_id, document_type);
