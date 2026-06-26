-- Atualiza os tipos aceitos para registros de ausencia.
-- Rode este SQL no Supabase se o cadastro de "Atestado" ou "Home office"
-- for bloqueado por restricao/check antigo da tabela.

alter table public.ausencias
  drop constraint if exists ausencias_tipo_check;

alter table public.ausencias
  add constraint ausencias_tipo_check
  check (tipo in ('falta', 'banco-de-horas', 'atestado', 'home-office'));
