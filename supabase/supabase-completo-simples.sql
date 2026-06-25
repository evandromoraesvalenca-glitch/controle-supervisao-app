create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  re text,
  perfil text not null default 'supervisor',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.estacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_itens (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  categoria text not null,
  descricao text not null,
  controle_especifico text not null,
  aplicavel_operacao_parcial boolean not null default true,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (codigo, categoria)
);

create table if not exists public.checklist_itens_estacoes (
  id uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references public.checklist_itens(id) on delete cascade,
  estacao_id uuid not null references public.estacoes(id) on delete cascade,
  aplicavel boolean not null default true,
  observacao_padrao text,
  unique (checklist_item_id, estacao_id)
);

create table if not exists public.inspecoes (
  id uuid primary key default gen_random_uuid(),
  estacao_id uuid references public.estacoes(id),
  usuario_id uuid references public.usuarios(id),
  data date not null default current_date,
  horario_inicio time not null default current_time,
  horario_fim time,
  turno text not null,
  status text not null default 'rascunho',
  responsavel_nome text,
  responsavel_re text,
  created_at timestamptz not null default now()
);

create table if not exists public.inspecao_respostas (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  checklist_item_id uuid references public.checklist_itens(id),
  status text not null,
  observacao text,
  foto_url text,
  foto_urls text[] not null default '{}',
  respondido_por uuid references public.usuarios(id),
  respondido_em timestamptz not null default now(),
  unique (inspecao_id, checklist_item_id)
);

create table if not exists public.app_inspecoes (
  id text primary key,
  estacao_id text not null,
  data date not null,
  status text not null,
  payload jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.ausencias (
  id uuid primary key default gen_random_uuid(),
  colaborador text not null,
  tipo text not null,
  registrado_por text,
  registrado_em timestamptz not null default now()
);

create table if not exists public.levantamentos_efetivo (
  id uuid primary key default gen_random_uuid(),
  data_referencia date not null default current_date,
  hora_preenchimento time not null default current_time,
  estacao text not null,
  supervisor text not null,
  lideres integer not null default 0,
  aas integer not null default 0,
  aa integer not null default 0,
  efetivo_total integer not null default 0,
  observacao text,
  usuario_nome text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (data_referencia, estacao, supervisor)
);

alter table public.usuarios disable row level security;
alter table public.estacoes disable row level security;
alter table public.checklist_itens disable row level security;
alter table public.checklist_itens_estacoes disable row level security;
alter table public.inspecoes disable row level security;
alter table public.inspecao_respostas disable row level security;
alter table public.app_inspecoes disable row level security;
alter table public.ausencias disable row level security;
alter table public.levantamentos_efetivo disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
insert into public.estacoes (nome, ativa) values
  ('JoÃ£o Paulo I', true),
  ('Freguesia do Ã“', true),
  ('Santa Marina', true),
  ('Ãgua Branca', true),
  ('SESC Pompeia', true),
  ('Perdizes', true)
on conflict (nome) do update set ativa = excluded.ativa;

insert into public.usuarios (nome, email, re, perfil, ativo) values
  ('Supervisor Operacional', 'supervisor@linha6.local', '000001', 'supervisor', true),
  ('Administrador', 'admin@linha6.local', '000000', 'administrador', true)
on conflict do nothing;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'EL' || lpad(n::text, 2, '0'), 'Elevadores',
  'Verificar funcionamento, interfones e displays internos e externos, botÃµes e limpeza',
  'Funcionamento, comunicaÃ§Ã£o, displays, botÃµes e limpeza',
  n not in (4, 5, 6), true
from generate_series(1, 6) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  aplicavel_operacao_parcial = excluded.aplicavel_operacao_parcial,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'ER' || lpad(n::text, 2, '0'), 'Escadas Rolantes',
  'Verificar funcionamento, corrimÃ£os, pentes, degraus, limpeza e ruÃ­dos',
  'Funcionamento, corrimÃ£os, pentes, degraus, limpeza e ruÃ­dos', true, true
from generate_series(1, 21) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo)
select 'BL' || lpad(n::text, 2, '0'), 'Bloqueios / PainÃ©is',
  'Verificar funcionamento, limpeza e qualquer dano',
  'Funcionamento, limpeza e danos', true, true
from generate_series(1, 15) n
on conflict (codigo, categoria) do update set
  descricao = excluded.descricao,
  controle_especifico = excluded.controle_especifico,
  ativo = excluded.ativo;

insert into public.checklist_itens (codigo, categoria, descricao, controle_especifico, aplicavel_operacao_parcial, ativo) values
  ('BL16 PCD','Bloqueios / PainÃ©is','Verificar funcionamento, limpeza e qualquer dano','Acessibilidade, funcionamento, limpeza e danos',true,true),
  ('PFP','Portas de Plataforma 1','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PSE','Portas de Plataforma 1','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PDM 02-23','Portas de Plataforma 1','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PDM 01-24','Portas de Plataforma 1','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PSV','Portas de Plataforma 1','Verificar fechamento e limpeza','Fechamento e limpeza',true,true),
  ('PCM','Portas de Plataforma 1','Verificar funcionamento','Funcionamento',false,true),
  ('Radar','Portas de Plataforma 1','Verificar funcionamento','Funcionamento',false,true),
  ('PFP','Portas de Plataforma 2','Verificar funcionamento, limpeza, obstÃ¡culo e dano','Funcionamento, limpeza, obstÃ¡culos e danos',true,true),
  ('PSE','Portas de Plataforma 2','Verificar funcionamento, limpeza, obstÃ¡culo e dano','Funcionamento, limpeza, obstÃ¡culos e danos',true,true),
  ('PDM 02-23','Portas de Plataforma 2','Verificar abertura, limpeza e dano','Abertura, limpeza e danos',true,true),
  ('PDM 01-24','Portas de Plataforma 2','Verificar fechamento, limpeza e dano','Fechamento, limpeza e danos',true,true),
  ('PSV','Portas de Plataforma 2','Verificar travamento, limpeza e dano','Travamento, limpeza e danos',true,true),
  ('PCM','Portas de Plataforma 2','Verificar fechamento e limpeza','Fechamento e limpeza',false,true),
  ('Radar','Portas de Plataforma 2','Verificar funcionamento','Funcionamento',false,true),
  ('IL01','IluminaÃ§Ã£o','Salas Operacionais','Verificar funcionamento',true,true),
  ('IL02','IluminaÃ§Ã£o','CirculaÃ§Ã£o Interna','Verificar funcionamento',true,true),
  ('IL03','IluminaÃ§Ã£o','CirculaÃ§Ã£o Externa','Verificar funcionamento',true,true),
  ('INC01','Dispositivos de DetecÃ§Ã£o e Combate a IncÃªndio','Hidrantes','Verificar funcionamento, lacre intacto e danos',true,true),
  ('INC02','Dispositivos de DetecÃ§Ã£o e Combate a IncÃªndio','Extintores','Verificar funcionamento e qualquer dano',true,true),
  ('INC03','Dispositivos de DetecÃ§Ã£o e Combate a IncÃªndio','Dispositivo de Acionamento Manual','Verificar funcionamento e qualquer dano',true,true),
  ('SS01','SaÃºde e SeguranÃ§a','Rota de evacuaÃ§Ã£o','Verificar se estÃ¡ livre de obstruÃ§Ãµes',true,true),
  ('SS02','SaÃºde e SeguranÃ§a','SinalizaÃ§Ã£o de saÃ­da de emergÃªncia','Verificar aparÃªncia e iluminaÃ§Ã£o',true,true),
  ('SS03','SaÃºde e SeguranÃ§a','Portas de saÃ­da de emergÃªncia','Verificar se nÃ£o estÃ£o trancadas',true,true),
  ('AMB01','Ambiente Geral da EstaÃ§Ã£o','Forro de teto','Verificar revestimento faltando, descolando, infiltraÃ§Ã£o e limpeza',true,true),
  ('AMB02','Ambiente Geral da EstaÃ§Ã£o','Portas e portÃµes da Ã¡rea pÃºblica','Verificar conservaÃ§Ã£o, funcionamento e limpeza',true,true),
  ('AMB03','Ambiente Geral da EstaÃ§Ã£o','Revestimentos de paredes','Verificar revestimento faltando, descolando, infiltraÃ§Ã£o e limpeza',true,true),
  ('AMB04','Ambiente Geral da EstaÃ§Ã£o','Lixeiras, porta-maca e bancos','Verificar condiÃ§Ã£o e limpeza',true,true),
  ('AMB05','Ambiente Geral da EstaÃ§Ã£o','Escadas fixas, corrimÃ£os e guarda-corpos','Verificar condiÃ§Ã£o e limpeza',true,true),
  ('AMB06','Ambiente Geral da EstaÃ§Ã£o','CerÃ¢micas de piso interno','Verificar revestimento faltando, descolando, infiltraÃ§Ã£o e limpeza',true,true),
  ('AMB07','Ambiente Geral da EstaÃ§Ã£o','Pisos da Ã¡rea pÃºblica, piso tÃ¡til, rampas e grelhas','Verificar revestimento faltando, descolando, infiltraÃ§Ã£o e limpeza',true,true),
  ('AMB08','Ambiente Geral da EstaÃ§Ã£o','ComunicaÃ§Ã£o visual','Verificar conservaÃ§Ã£o e limpeza',true,true),
  ('AMB09','Ambiente Geral da EstaÃ§Ã£o','Sistema de sonorizaÃ§Ã£o PAS e multimÃ­dia PIS','Verificar funcionamento do sistema',true,true),
  ('AMB10','Ambiente Geral da EstaÃ§Ã£o','Pontos comerciais','Verificar integridade, seguranÃ§a e limpeza',true,true),
  ('AMB11','Ambiente Geral da EstaÃ§Ã£o','SanitÃ¡rios pÃºblicos','Verificar conservaÃ§Ã£o, limpeza, torneiras, papel higiÃªnico, sabonete e local',true,true),
  ('AMB12','Ambiente Geral da EstaÃ§Ã£o','CFTV','Verificar funcionamento do sistema',true,true),
  ('AMB13','Ambiente Geral da EstaÃ§Ã£o','Bodycams','Verificar funcionamento e integridade dos itens',false,true),
  ('AMB14','Ambiente Geral da EstaÃ§Ã£o','RÃ¡dios TETRA','Verificar funcionamento e integridade',true,true),
  ('AMB15','Ambiente Geral da EstaÃ§Ã£o','Temperatura da Ã¡rea / A/C','Verificar ventilaÃ§Ã£o, qualidade e temperatura do ar',false,true),
  ('QR01','MÃ¡quinas de Autoatendimento de Vendas de QR Code','MÃ¡quinas de autoatendimento de vendas de QR Code','Verificar funcionamento',false,true),
  ('OPA01','OperaÃ§Ã£o Parcial Assistida','Tapumes','Verificar limpeza, dano, integridade da estrutura, fixaÃ§Ã£o, ausÃªncia de frestas e riscos de queda',true,true),
  ('OPA02','OperaÃ§Ã£o Parcial Assistida','SinalizaÃ§Ã£o provisÃ³ria','Verificar posicionamento, limpeza, integridade, visibilidade, legibilidade e coerÃªncia com os fluxos operacionais temporÃ¡rios',true,true),
  ('OPA03','OperaÃ§Ã£o Parcial Assistida','Sinal luminoso para embarque','Verificar limpeza, dano e funcionamento',true,true),
  ('OPA04','OperaÃ§Ã£o Parcial Assistida','ResponsÃ¡vel EPC','Confirmar prontidÃ£o para a operaÃ§Ã£o do lado da obra',true,true),
  ('OPA05','OperaÃ§Ã£o Parcial Assistida','VentilaÃ§Ã£o principal','Verificar funcionamento do PCL e alarmes',true,true),
  ('DF01','Direcionadores de Fluxo','Direcionadores de fluxos','Verificar posicionamento correto, integridade, segregaÃ§Ã£o adequada dos fluxos, visibilidade para os passageiros e ausÃªncia de obstÃ¡culos',true,true)
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
