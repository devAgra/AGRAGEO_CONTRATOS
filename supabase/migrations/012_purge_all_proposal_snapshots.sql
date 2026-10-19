-- 012: Purga DEFINITIVA de snapshots antigos da Proposta Comercial.
-- O app (agrageo-suite.js, decisao de render na abertura) agora reconstroi a proposta
-- a partir do template novo sempre que o snapshot salvo nao contiver a tabela nova
-- (th "ITEM" + "DADOS DA CONTRATADA"). Para evitar qualquer resquicio em tela, este
-- script remove content.full e content.editTexts de TODAS as propostas do banco.
-- Ao reabrir cada proposta, o codigo gera o layout novo limpo; edicoes feitas depois
-- disso sao salvas normalmente no formato novo.

UPDATE public.documents
SET content = (content - 'full' - 'editTexts')
WHERE document_type = 'proposal'
  AND content IS NOT NULL
  AND (content ? 'full' OR content ? 'editTexts');

-- Verificacao: deve retornar 0 linhas.
SELECT id, number
FROM public.documents
WHERE document_type = 'proposal'
  AND content IS NOT NULL
  AND (content ? 'full' OR content ? 'editTexts');
