create extension if not exists pgcrypto;

create table if not exists public.app_inspecoes (
  id uuid primary key default gen_random_uuid(),
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
  hora_preenchimento text not null,
  estacao text not null,
  supervisor text not null,
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

create unique index if not exists levantamentos_efetivo_unico_idx
on public.levantamentos_efetivo (data_referencia, estacao, supervisor);

alter table public.app_inspecoes enable row level security;
alter table public.ausencias enable row level security;
alter table public.levantamentos_efetivo enable row level security;

drop policy if exists "app_inspecoes_select_publico" on public.app_inspecoes;
drop policy if exists "app_inspecoes_insert_publico" on public.app_inspecoes;
drop policy if exists "app_inspecoes_update_publico" on public.app_inspecoes;
drop policy if exists "app_inspecoes_delete_publico" on public.app_inspecoes;

drop policy if exists "ausencias_select_publico" on public.ausencias;
drop policy if exists "ausencias_insert_publico" on public.ausencias;
drop policy if exists "ausencias_update_publico" on public.ausencias;
drop policy if exists "ausencias_delete_publico" on public.ausencias;

drop policy if exists "levantamentos_select_publico" on public.levantamentos_efetivo;
drop policy if exists "levantamentos_insert_publico" on public.levantamentos_efetivo;
drop policy if exists "levantamentos_update_publico" on public.levantamentos_efetivo;
drop policy if exists "levantamentos_delete_publico" on public.levantamentos_efetivo;

create policy "app_inspecoes_select_publico" on public.app_inspecoes
for select to anon, authenticated using (true);

create policy "app_inspecoes_insert_publico" on public.app_inspecoes
for insert to anon, authenticated with check (true);

create policy "app_inspecoes_update_publico" on public.app_inspecoes
for update to anon, authenticated using (true) with check (true);

create policy "app_inspecoes_delete_publico" on public.app_inspecoes
for delete to anon, authenticated using (true);

create policy "ausencias_select_publico" on public.ausencias
for select to anon, authenticated using (true);

create policy "ausencias_insert_publico" on public.ausencias
for insert to anon, authenticated with check (true);

create policy "ausencias_update_publico" on public.ausencias
for update to anon, authenticated using (true) with check (true);

create policy "ausencias_delete_publico" on public.ausencias
for delete to anon, authenticated using (true);

create policy "levantamentos_select_publico" on public.levantamentos_efetivo
for select to anon, authenticated using (true);

create policy "levantamentos_insert_publico" on public.levantamentos_efetivo
for insert to anon, authenticated with check (true);

create policy "levantamentos_update_publico" on public.levantamentos_efetivo
for update to anon, authenticated using (true) with check (true);

create policy "levantamentos_delete_publico" on public.levantamentos_efetivo
for delete to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.app_inspecoes to anon, authenticated;
grant select, insert, update, delete on public.ausencias to anon, authenticated;
grant select, insert, update, delete on public.levantamentos_efetivo to anon, authenticated;
