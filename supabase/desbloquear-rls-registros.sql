create extension if not exists pgcrypto;

create table if not exists public.app_inspecoes (
  id uuid primary key default gen_random_uuid(),
  estacao_id text,
  data date,
  status text,
  payload jsonb,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.ausencias (
  id uuid primary key default gen_random_uuid(),
  colaborador text,
  tipo text,
  registrado_por text,
  registrado_em timestamptz not null default now()
);

create table if not exists public.levantamentos_efetivo (
  id uuid primary key default gen_random_uuid(),
  data_referencia date not null default current_date,
  hora_preenchimento text,
  estacao text,
  supervisor text,
  lideres integer not null default 0,
  aas integer not null default 0,
  aa integer not null default 0,
  efetivo_total integer not null default 0,
  observacao text,
  usuario_id text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.app_inspecoes add column if not exists estacao_id text;
alter table public.app_inspecoes add column if not exists data date;
alter table public.app_inspecoes add column if not exists status text;
alter table public.app_inspecoes add column if not exists payload jsonb;
alter table public.app_inspecoes add column if not exists atualizado_em timestamptz not null default now();

alter table public.ausencias add column if not exists colaborador text;
alter table public.ausencias add column if not exists tipo text;
alter table public.ausencias add column if not exists registrado_por text;
alter table public.ausencias add column if not exists registrado_em timestamptz not null default now();

alter table public.levantamentos_efetivo add column if not exists data_referencia date not null default current_date;
alter table public.levantamentos_efetivo add column if not exists hora_preenchimento text;
alter table public.levantamentos_efetivo add column if not exists estacao text;
alter table public.levantamentos_efetivo add column if not exists supervisor text;
alter table public.levantamentos_efetivo add column if not exists lideres integer not null default 0;
alter table public.levantamentos_efetivo add column if not exists aas integer not null default 0;
alter table public.levantamentos_efetivo add column if not exists aa integer not null default 0;
alter table public.levantamentos_efetivo add column if not exists efetivo_total integer not null default 0;
alter table public.levantamentos_efetivo add column if not exists observacao text;
alter table public.levantamentos_efetivo add column if not exists usuario_id text;
alter table public.levantamentos_efetivo add column if not exists criado_em timestamptz not null default now();
alter table public.levantamentos_efetivo add column if not exists atualizado_em timestamptz not null default now();

alter table public.levantamentos_efetivo
alter column hora_preenchimento type text
using hora_preenchimento::text;

alter table public.app_inspecoes disable row level security;
alter table public.ausencias disable row level security;
alter table public.levantamentos_efetivo disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.app_inspecoes to anon, authenticated;
grant select, insert, update, delete on public.ausencias to anon, authenticated;
grant select, insert, update, delete on public.levantamentos_efetivo to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
