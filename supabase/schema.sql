create extension if not exists "pgcrypto";

create type perfil_usuario as enum ('administrador', 'supervisor', 'consulta');
create type turno_inspecao as enum ('Manhã', 'Tarde', 'Noite', 'Operação Parcial');
create type status_inspecao as enum ('rascunho', 'em_andamento', 'finalizada', 'reaberta');
create type status_resposta as enum ('OK', 'NOK', 'NA');

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null unique,
  re text not null,
  perfil perfil_usuario not null default 'supervisor',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.estacoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.checklist_itens (
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

create table public.checklist_itens_estacoes (
  id uuid primary key default gen_random_uuid(),
  checklist_item_id uuid not null references public.checklist_itens(id) on delete cascade,
  estacao_id uuid not null references public.estacoes(id) on delete cascade,
  aplicavel boolean not null default true,
  observacao_padrao text,
  unique (checklist_item_id, estacao_id)
);

create table public.inspecoes (
  id uuid primary key default gen_random_uuid(),
  estacao_id uuid not null references public.estacoes(id),
  usuario_id uuid not null references public.usuarios(id),
  data date not null default current_date,
  horario_inicio time not null default current_time,
  horario_fim time,
  turno turno_inspecao not null,
  status status_inspecao not null default 'rascunho',
  created_at timestamptz not null default now()
);

create table public.inspecao_respostas (
  id uuid primary key default gen_random_uuid(),
  inspecao_id uuid not null references public.inspecoes(id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_itens(id),
  status status_resposta not null,
  observacao text,
  foto_url text,
  foto_urls text[] not null default '{}',
  respondido_por uuid not null references public.usuarios(id),
  respondido_em timestamptz not null default now(),
  unique (inspecao_id, checklist_item_id),
  constraint nok_exige_observacao check (status <> 'NOK' or nullif(trim(coalesce(observacao, '')), '') is not null),
  constraint nok_exige_foto check (status <> 'NOK' or array_length(foto_urls, 1) is not null or foto_url is not null)
);

create or replace function public.usuario_ativo()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where id = auth.uid() and ativo = true
  );
$$;

create or replace function public.usuario_perfil()
returns perfil_usuario
language sql
security definer
set search_path = public
as $$
  select perfil from public.usuarios where id = auth.uid() and ativo = true;
$$;

alter table public.usuarios enable row level security;
alter table public.estacoes enable row level security;
alter table public.checklist_itens enable row level security;
alter table public.checklist_itens_estacoes enable row level security;
alter table public.inspecoes enable row level security;
alter table public.inspecao_respostas enable row level security;

create policy "usuarios ativos veem dados basicos"
on public.usuarios for select
to authenticated
using (public.usuario_ativo());

create policy "administrador gerencia usuarios"
on public.usuarios for all
to authenticated
using (public.usuario_perfil() = 'administrador')
with check (public.usuario_perfil() = 'administrador');

create policy "usuarios ativos veem estacoes"
on public.estacoes for select
to authenticated
using (public.usuario_ativo());

create policy "administrador gerencia estacoes"
on public.estacoes for all
to authenticated
using (public.usuario_perfil() = 'administrador')
with check (public.usuario_perfil() = 'administrador');

create policy "usuarios ativos veem itens"
on public.checklist_itens for select
to authenticated
using (public.usuario_ativo());

create policy "administrador gerencia itens"
on public.checklist_itens for all
to authenticated
using (public.usuario_perfil() = 'administrador')
with check (public.usuario_perfil() = 'administrador');

create policy "usuarios ativos veem aplicabilidade"
on public.checklist_itens_estacoes for select
to authenticated
using (public.usuario_ativo());

create policy "administrador gerencia aplicabilidade"
on public.checklist_itens_estacoes for all
to authenticated
using (public.usuario_perfil() = 'administrador')
with check (public.usuario_perfil() = 'administrador');

create policy "autenticado ativo ve inspecoes"
on public.inspecoes for select
to authenticated
using (public.usuario_ativo());

create policy "supervisor cria inspecoes"
on public.inspecoes for insert
to authenticated
with check (
  public.usuario_ativo()
  and public.usuario_perfil() in ('supervisor', 'administrador')
  and usuario_id = auth.uid()
);

create policy "supervisor edita inspecoes nao finalizadas"
on public.inspecoes for update
to authenticated
using (
  public.usuario_ativo()
  and (
    public.usuario_perfil() = 'administrador'
    or (public.usuario_perfil() = 'supervisor' and status <> 'finalizada')
  )
)
with check (
  public.usuario_ativo()
  and (
    public.usuario_perfil() = 'administrador'
    or (public.usuario_perfil() = 'supervisor' and status <> 'finalizada')
  )
);

create policy "autenticado ativo ve respostas"
on public.inspecao_respostas for select
to authenticated
using (public.usuario_ativo());

create policy "supervisor responde inspecoes abertas"
on public.inspecao_respostas for insert
to authenticated
with check (
  public.usuario_ativo()
  and public.usuario_perfil() in ('supervisor', 'administrador')
  and exists (
    select 1 from public.inspecoes i
    where i.id = inspecao_id and (i.status <> 'finalizada' or public.usuario_perfil() = 'administrador')
  )
);

create policy "supervisor edita respostas abertas"
on public.inspecao_respostas for update
to authenticated
using (
  public.usuario_ativo()
  and exists (
    select 1 from public.inspecoes i
    where i.id = inspecao_id and (i.status <> 'finalizada' or public.usuario_perfil() = 'administrador')
  )
)
with check (
  public.usuario_ativo()
  and exists (
    select 1 from public.inspecoes i
    where i.id = inspecao_id and (i.status <> 'finalizada' or public.usuario_perfil() = 'administrador')
  )
);

insert into storage.buckets (id, name, public)
values ('inspecao-fotos', 'inspecao-fotos', false)
on conflict (id) do nothing;

create policy "usuarios ativos enviam fotos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'inspecao-fotos' and public.usuario_ativo());

create policy "usuarios ativos leem fotos"
on storage.objects for select
to authenticated
using (bucket_id = 'inspecao-fotos' and public.usuario_ativo());
