import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { supabase } from "@/lib/supabase";
import { calculateStaffingTotal, normalizeStaffingCount } from "@/lib/staffing";
import type { Ausencia, Inspecao, LevantamentoEfetivo, Resposta, Usuario } from "@/types";

const USER_KEY = "linha6_usuario_demo";

export const demoUser: Usuario = {
  id: "demo-supervisor",
  nome: "Supervisor Operacional",
  email: "",
  re: "000001",
  perfil: "supervisor",
  ativo: true
};

function readUser(): Usuario {
  if (typeof window === "undefined") return demoUser;
  const stored = window.localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : demoUser;
}

function writeUser(user: Usuario) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const isOnlineStorageEnabled = true;

export function getStoredUser(): Usuario {
  return readUser();
}

export function setStoredUser(user: Usuario) {
  writeUser(user);
}

export function clearStoredUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(USER_KEY);
}

function requireSupabase() {
  if (!supabase) throw new Error("Supabase não configurado.");
  return supabase;
}

export async function carregarRegistros<T>(tabela: string): Promise<T[]> {
  const client = requireSupabase();
  const { data, error } = await client.from(tabela).select("*");
  if (error) throw error;
  return (data || []) as T[];
}

export async function salvarNovoRegistro<T extends Record<string, unknown>>(tabela: string, registro: T) {
  const client = requireSupabase();
  const { data, error } = await client.from(tabela).insert(registro).select().single();
  if (error) throw error;
  return data as T;
}

export async function editarRegistro<T extends Record<string, unknown>>(tabela: string, id: string, registro: Partial<T>) {
  const client = requireSupabase();
  const { data, error } = await client.from(tabela).update(registro as Record<string, unknown>).eq("id", id).select().single();
  if (error) throw error;
  return data as T;
}

export async function excluirRegistro(tabela: string, id: string) {
  const client = requireSupabase();
  const { error } = await client.from(tabela).delete().eq("id", id);
  if (error) throw error;
}

export async function getInspecoes(): Promise<Inspecao[]> {
  return fetchInspecoes();
}

export async function fetchInspecoes(): Promise<Inspecao[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("app_inspecoes")
    .select("payload")
    .order("atualizado_em", { ascending: false });

  if (!error) return (data || []).map((row) => row.payload as unknown as Inspecao);

  const relational = await fetchInspecoesRelacionais();
  if (relational) return relational;

  throw error;
}

export async function saveInspecao(inspecao: Inspecao) {
  return saveInspecaoRemota(inspecao);
}

export async function saveInspecaoRemota(inspecao: Inspecao) {
  const client = requireSupabase();
  const { error } = await client
    .from("app_inspecoes")
    .upsert(
      {
        id: inspecao.id,
        estacao_id: inspecao.estacao_id,
        data: inspecao.data,
        status: inspecao.status,
        payload: inspecao,
        atualizado_em: new Date().toISOString()
      },
      { onConflict: "id" }
    );

  if (!error) return;

  const savedRelational = await saveInspecaoRelacional(inspecao);
  if (!savedRelational) throw error;
}

export async function updateInspecao(inspecao: Inspecao) {
  return saveInspecaoRemota(inspecao);
}

export async function deleteInspecao(id: string) {
  return excluirRegistro("app_inspecoes", id);
}

async function fetchInspecoesRelacionais(): Promise<Inspecao[] | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("inspecoes")
    .select("id,estacao_id,data,horario_inicio,horario_fim,turno,status,responsavel_nome,responsavel_re,estacoes(nome),inspecao_respostas(status,observacao,foto_url,foto_urls,respondido_em,checklist_itens(codigo,categoria))")
    .order("data", { ascending: false });

  if (error) return null;

  return (data || []).map((row: any) => {
    const stationName = row.estacoes?.nome || row.estacao_id;
    const station = estacoesIniciais.find((item) => item.nome === stationName);
    const stationId = station?.id || String(row.estacao_id);
    const itens = getChecklistItensPorEstacao(stationId);
    const respostas: Record<string, Resposta> = {};

    for (const resposta of row.inspecao_respostas || []) {
      const item = itens.find((checkItem) => checkItem.codigo === resposta.checklist_itens?.codigo && checkItem.categoria === resposta.checklist_itens?.categoria);
      if (!item) continue;
      respostas[item.id] = {
        checklist_item_id: item.id,
        status: resposta.status,
        observacao: resposta.observacao || "",
        fotos: resposta.foto_urls?.length ? resposta.foto_urls : resposta.foto_url ? [resposta.foto_url] : [],
        respondido_por: row.responsavel_nome || "Supabase",
        respondido_em: resposta.respondido_em
      };
    }

    return {
      id: row.id,
      estacao_id: stationId,
      usuario_id: "supabase",
      data: row.data,
      horario_inicio: String(row.horario_inicio || "").slice(0, 5),
      horario_fim: row.horario_fim ? String(row.horario_fim).slice(0, 5) : undefined,
      turno: row.turno,
      status: row.status,
      responsavel_nome: row.responsavel_nome || "Supervisor Operacional",
      responsavel_re: row.responsavel_re || "000001",
      respostas
    } as Inspecao;
  });
}

async function saveInspecaoRelacional(inspecao: Inspecao) {
  const client = requireSupabase();
  const stationName = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
  const { data: station } = await client.from("estacoes").select("id").eq("nome", stationName).maybeSingle();
  const { data: usuario } = await client.from("usuarios").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!station?.id || !usuario?.id) return false;

  const { error: inspecaoError } = await client.from("inspecoes").upsert(
    {
      id: inspecao.id,
      estacao_id: station.id,
      usuario_id: usuario.id,
      data: inspecao.data,
      horario_inicio: inspecao.horario_inicio,
      horario_fim: inspecao.horario_fim || null,
      turno: inspecao.turno,
      status: inspecao.status,
      responsavel_nome: inspecao.responsavel_nome,
      responsavel_re: inspecao.responsavel_re
    },
    { onConflict: "id" }
  );
  if (inspecaoError) return false;

  await client.from("inspecao_respostas").delete().eq("inspecao_id", inspecao.id);
  const itens = getChecklistItensPorEstacao(inspecao.estacao_id);
  const respostas = Object.values(inspecao.respostas).filter((resposta) => resposta.status);
  if (respostas.length === 0) return true;

  const { data: remoteItems } = await client.from("checklist_itens").select("id,codigo,categoria");
  const rows = respostas.flatMap((resposta) => {
    const item = itens.find((checkItem) => checkItem.id === resposta.checklist_item_id);
    const remoteItem = remoteItems?.find((remote) => remote.codigo === item?.codigo && remote.categoria === item?.categoria);
    if (!remoteItem) return [];
    return [{
      inspecao_id: inspecao.id,
      checklist_item_id: remoteItem.id,
      status: resposta.status,
      observacao: resposta.observacao || null,
      foto_url: resposta.fotos[0] || null,
      foto_urls: resposta.fotos || [],
      respondido_por: usuario.id,
      respondido_em: resposta.respondido_em || new Date().toISOString()
    }];
  });

  if (rows.length === 0) return true;
  const { error } = await client.from("inspecao_respostas").insert(rows);
  return !error;
}

export async function getInspecao(id: string) {
  const inspecoes = await fetchInspecoes();
  return inspecoes.find((inspecao) => inspecao.id === id);
}

export async function getAusencias(): Promise<Ausencia[]> {
  return fetchAusencias();
}

export async function fetchAusencias(): Promise<Ausencia[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("ausencias")
    .select("id,colaborador,tipo,registrado_por,registrado_em")
    .order("registrado_em", { ascending: false });

  if (error) throw error;
  return (data || []) as Ausencia[];
}

export async function saveAusencia(ausencia: Ausencia) {
  return saveAusenciaRemota(ausencia);
}

export async function saveAusenciaRemota(ausencia: Ausencia) {
  const client = requireSupabase();
  const { error } = await client.from("ausencias").insert({
    id: ausencia.id,
    colaborador: ausencia.colaborador,
    tipo: ausencia.tipo,
    registrado_por: ausencia.registrado_por,
    registrado_em: ausencia.registrado_em
  });

  if (error) throw error;
}

export async function updateAusencia(ausencia: Ausencia) {
  return editarRegistro<Ausencia & Record<string, unknown>>("ausencias", ausencia.id, ausencia);
}

export async function deleteAusencia(id: string) {
  return excluirRegistro("ausencias", id);
}

export async function getLevantamentosEfetivo(): Promise<LevantamentoEfetivo[]> {
  return fetchLevantamentosEfetivo();
}

export async function fetchLevantamentosEfetivo(): Promise<LevantamentoEfetivo[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("levantamentos_efetivo")
    .select("id,data_referencia,hora_preenchimento,estacao,supervisor,lideres,aas,aa,efetivo_total,observacao,usuario_id,criado_em,atualizado_em")
    .order("data_referencia", { ascending: false })
    .order("hora_preenchimento", { ascending: false });

  if (error) throw error;

  return (data || []).map(normalizeLevantamentoEfetivo);
}

export async function saveLevantamentoEfetivo(registro: LevantamentoEfetivo) {
  return saveLevantamentoEfetivoRemoto(registro);
}

export async function saveLevantamentoEfetivoRemoto(registro: LevantamentoEfetivo) {
  const client = requireSupabase();
  const normalized = normalizeLevantamentoEfetivo(registro);
  const payload = {
    data_referencia: normalized.data_referencia,
    hora_preenchimento: normalized.hora_preenchimento,
    estacao: normalized.estacao,
    supervisor: normalized.supervisor,
    lideres: normalized.lideres,
    aas: normalized.aas,
    aa: normalized.aa,
    efetivo_total: normalized.efetivo_total,
    observacao: normalized.observacao,
    usuario_id: normalized.usuario_id,
    atualizado_em: new Date().toISOString()
  };

  const { data: existing, error: selectError } = await client
    .from("levantamentos_efetivo")
    .select("id")
    .eq("data_referencia", normalized.data_referencia)
    .eq("estacao", normalized.estacao)
    .eq("supervisor", normalized.supervisor)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) throw selectError;

  const request = existing?.id
    ? client.from("levantamentos_efetivo").update(payload).eq("id", existing.id)
    : client.from("levantamentos_efetivo").insert({ ...payload, id: normalized.id, criado_em: normalized.criado_em });

  const { data, error } = await request
    .select("id,data_referencia,hora_preenchimento,estacao,supervisor,lideres,aas,aa,efetivo_total,observacao,usuario_id,criado_em,atualizado_em")
    .single();

  if (error) throw error;
  const saved = normalizeLevantamentoEfetivo(data);
  assertStaffingValues(saved, normalized);
  return saved;
}

export async function updateLevantamentoEfetivo(registro: LevantamentoEfetivo) {
  const client = requireSupabase();
  const normalized = normalizeLevantamentoEfetivo(registro);
  const { data, error } = await client
    .from("levantamentos_efetivo")
    .update({
      data_referencia: normalized.data_referencia,
      hora_preenchimento: normalized.hora_preenchimento,
      estacao: normalized.estacao,
      supervisor: normalized.supervisor,
      lideres: normalized.lideres,
      aas: normalized.aas,
      aa: normalized.aa,
      efetivo_total: normalized.efetivo_total,
      observacao: normalized.observacao,
      usuario_id: normalized.usuario_id,
      atualizado_em: new Date().toISOString()
    })
    .eq("id", normalized.id)
    .select("id,data_referencia,hora_preenchimento,estacao,supervisor,lideres,aas,aa,efetivo_total,observacao,usuario_id,criado_em,atualizado_em")
    .single();

  if (error) throw error;
  const saved = normalizeLevantamentoEfetivo(data);
  assertStaffingValues(saved, normalized);
  return saved;
}

export async function deleteLevantamentoEfetivo(id: string) {
  return excluirRegistro("levantamentos_efetivo", id);
}

function normalizeLevantamentoEfetivo(registro: any): LevantamentoEfetivo {
  const lideres = normalizeStaffingCount(registro.lideres);
  const aas = normalizeStaffingCount(registro.aas);
  const aa = normalizeStaffingCount(registro.aa);

  return {
    ...registro,
    lideres,
    aas,
    aa,
    efetivo_total: calculateStaffingTotal(lideres, aas, aa),
    observacao: registro.observacao || "",
    usuario_id: registro.usuario_id || "supabase"
  } as LevantamentoEfetivo;
}

function assertStaffingValues(saved: LevantamentoEfetivo, expected: LevantamentoEfetivo) {
  if (
    saved.lideres !== expected.lideres ||
    saved.aas !== expected.aas ||
    saved.aa !== expected.aa ||
    saved.efetivo_total !== expected.efetivo_total
  ) {
    throw new Error("O Supabase não confirmou os valores informados no lançamento de efetivo.");
  }
}
