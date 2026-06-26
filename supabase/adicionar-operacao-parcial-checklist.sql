insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
values
  ('OP01','Operação Parcial','Monitor de controle de fluxo','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP02','Operação Parcial','Megafones','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP03','Operação Parcial','Bastão luminoso','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP04','Operação Parcial','Botoeiras de sinaleiro','Verificar disponibilidade, integridade e funcionamento',true,true)
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  aplicavel_operacao_parcial = excluded.aplicavel_operacao_parcial,
  ativo = excluded.ativo;

insert into public.checklist_itens_estacoes (checklist_item_id, estacao_id, aplicavel)
select ci.id, e.id, true
from public.checklist_itens ci
cross join public.estacoes e
where ci.categoria = 'Operação Parcial'
on conflict do nothing;
