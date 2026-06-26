insert into public.estacoes (nome, ativa) values
  ('João Paulo I', true),
  ('Freguesia do Ó', true),
  ('Santa Marina', true),
  ('Água Branca', true),
  ('SESC Pompeia', true),
  ('Perdizes', true)
on conflict (nome) do update set ativa = excluded.ativa;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'EL' || lpad(n::text, 2, '0'), 'Elevadores',
  'Verificar funcionamento, interfones e displays internos e externos, botões e limpeza',
  'Funcionamento, comunicação, displays, botões e limpeza',
  n not in (4, 5, 6), true
from generate_series(1, 6) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  aplicavel_operacao_parcial = excluded.aplicavel_operacao_parcial,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'ER' || lpad(n::text, 2, '0'), 'Escadas Rolantes',
  'Verificar funcionamento, corrimãos, pentes, degraus, limpeza e ruídos',
  'Funcionamento, corrimãos, pentes, degraus, limpeza e ruídos', true, true
from generate_series(1, 21) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'BL' || lpad(n::text, 2, '0'), 'Bloqueios / Painéis',
  'Verificar funcionamento, limpeza e qualquer dano',
  'Funcionamento, limpeza e danos', true, true
from generate_series(1, 15) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo) values
  ('BL16 PCD','Bloqueios / Painéis','Verificar funcionamento, limpeza e qualquer dano','Acessibilidade, funcionamento, limpeza e danos',true,true),
  ('PFP','Portas de Plataforma 1','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PSE','Portas de Plataforma 1','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PDM 02-23','Portas de Plataforma 1','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PDM 01-24','Portas de Plataforma 1','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PSV','Portas de Plataforma 1','Verificar fechamento e limpeza','Fechamento e limpeza',true,true),
  ('PCM','Portas de Plataforma 1','Verificar funcionamento','Funcionamento',false,true),
  ('Radar','Portas de Plataforma 1','Verificar funcionamento','Funcionamento',false,true),
  ('PFP','Portas de Plataforma 2','Verificar funcionamento, limpeza, obstáculo e dano','Funcionamento, limpeza, obstáculos e danos',true,true),
  ('PSE','Portas de Plataforma 2','Verificar funcionamento, limpeza, obstáculo e dano','Funcionamento, limpeza, obstáculos e danos',true,true),
  ('PDM 02-23','Portas de Plataforma 2','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PDM 01-24','Portas de Plataforma 2','Verificar fechamento, limpeza e dano','Fechamento, limpeza e danos',true,true),
  ('PSV','Portas de Plataforma 2','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PCM','Portas de Plataforma 2','Verificar fechamento e limpeza','Fechamento e limpeza',false,true),
  ('Radar','Portas de Plataforma 2','Verificar funcionamento','Funcionamento',false,true),
  ('IL01','Iluminação','Salas Operacionais','Verificar funcionamento',true,true),
  ('IL02','Iluminação','Circulação Interna','Verificar funcionamento',true,true),
  ('IL03','Iluminação','Circulação Externa','Verificar funcionamento',true,true),
  ('INC01','Dispositivos de Detecção e Combate a Incêndio','Hidrantes','Verificar funcionamento, lacre intacto e danos',true,true),
  ('INC02','Dispositivos de Detecção e Combate a Incêndio','Extintores','Verificar funcionamento e qualquer dano',true,true),
  ('INC03','Dispositivos de Detecção e Combate a Incêndio','Dispositivo de Acionamento Manual','Verificar funcionamento e qualquer dano',true,true),
  ('SS01','Saúde e Segurança','Rota de evacuação','Verificar se está livre de obstruções',true,true),
  ('SS02','Saúde e Segurança','Sinalização de saída de emergência','Verificar aparência e iluminação',true,true),
  ('SS03','Saúde e Segurança','Portas de saída de emergência','Verificar se não estão trancadas',true,true),
  ('AMB01','Ambiente Geral da Estação','Forro de teto','Verificar revestimento faltando, descolando, infiltração e limpeza',true,true),
  ('AMB02','Ambiente Geral da Estação','Portas e portões da área pública','Verificar conservação, funcionamento e limpeza',true,true),
  ('AMB03','Ambiente Geral da Estação','Revestimentos de paredes','Verificar revestimento faltando, descolando, infiltração e limpeza',true,true),
  ('AMB04','Ambiente Geral da Estação','Lixeiras, porta-maca e bancos','Verificar condição e limpeza',true,true),
  ('AMB05','Ambiente Geral da Estação','Escadas fixas, corrimãos e guarda-corpos','Verificar condição e limpeza',true,true),
  ('AMB06','Ambiente Geral da Estação','Cerâmicas de piso interno','Verificar revestimento faltando, descolando, infiltração e limpeza',true,true),
  ('AMB07','Ambiente Geral da Estação','Pisos da área pública, piso tátil, rampas e grelhas','Verificar revestimento faltando, descolando, infiltração e limpeza',true,true),
  ('AMB08','Ambiente Geral da Estação','Comunicação visual','Verificar conservação e limpeza',true,true),
  ('AMB09','Ambiente Geral da Estação','Sistema de sonorização PAS e multimídia PIS','Verificar funcionamento do sistema',true,true),
  ('AMB10','Ambiente Geral da Estação','Pontos comerciais','Verificar integridade, segurança e limpeza',true,true),
  ('AMB11','Ambiente Geral da Estação','Sanitários públicos','Verificar conservação, limpeza, torneiras, papel higiênico, sabonete e local',true,true),
  ('AMB12','Ambiente Geral da Estação','CFTV','Verificar funcionamento do sistema',true,true),
  ('AMB13','Ambiente Geral da Estação','Bodycams','Verificar funcionamento e integridade dos itens',false,true),
  ('AMB14','Ambiente Geral da Estação','Rádios TETRA','Verificar funcionamento e integridade',true,true),
  ('AMB15','Ambiente Geral da Estação','Temperatura da área / A/C','Verificar ventilação, qualidade e temperatura do ar',false,true),
  ('QR01','Máquinas de Autoatendimento de Vendas de QR Code','Máquinas de autoatendimento de vendas de QR Code','Verificar funcionamento',false,true),
  ('OPA01','Operação Parcial Assistida','Tapumes','Verificar limpeza, dano, integridade da estrutura, fixação, ausência de frestas e riscos de queda',true,true),
  ('OPA02','Operação Parcial Assistida','Sinalização provisória','Verificar posicionamento, limpeza, integridade, visibilidade, legibilidade e coerência com os fluxos operacionais temporários',true,true),
  ('OPA03','Operação Parcial Assistida','Sinal luminoso para embarque','Verificar limpeza, dano e funcionamento',true,true),
  ('OPA04','Operação Parcial Assistida','Responsável EPC','Confirmar prontidão para a operação do lado da obra',true,true),
  ('OPA05','Operação Parcial Assistida','Ventilação principal','Verificar funcionamento do PCL e alarmes',true,true),
  ('OP01','Operação Parcial','Monitor de controle de fluxo','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP02','Operação Parcial','Megafones','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP03','Operação Parcial','Bastão luminoso','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('OP04','Operação Parcial','Botoeiras de sinaleiro','Verificar disponibilidade, integridade e funcionamento',true,true),
  ('DF01','Direcionadores de Fluxo','Direcionadores de fluxos','Verificar posicionamento correto, integridade, segregação adequada dos fluxos, visibilidade para os passageiros e ausência de obstáculos',true,true)
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  aplicavel_operacao_parcial = excluded.aplicavel_operacao_parcial,
  ativo = excluded.ativo;

insert into public.checklist_itens_estacoes (checklist_item_id, estacao_id, aplicavel)
select ci.id, e.id, true
from public.checklist_itens ci
cross join public.estacoes e
on conflict (checklist_item_id, estacao_id) do nothing;
