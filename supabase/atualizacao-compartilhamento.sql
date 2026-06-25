create table if not exists public.app_inspecoes (
  id text primary key,
  estacao_id text not null,
  data date not null,
  status text not null,
  payload jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.app_inspecoes disable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.app_inspecoes to anon, authenticated;
grant select, insert, update, delete on public.ausencias to anon, authenticated;
grant select, insert, update, delete on public.levantamentos_efetivo to anon, authenticated;
