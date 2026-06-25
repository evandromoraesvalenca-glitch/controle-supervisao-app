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
