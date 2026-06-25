import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { supabase } from "@/lib/supabase";
import type { Ausencia, Inspecao, LevantamentoEfetivo, Resposta, Usuario } from "@/types";

const INSPECOES_KEY = "linha6_inspecoes";
const USER_KEY = "linha6_usuario_demo";
const AUSENCIAS_KEY = "linha6_ausencias";
const EFETIVO_KEY = "linha6_levantamentos_efetivo";

export const demoUser: Usuario = {
  id: "demo-supervisor",
  nome: "Supervisor Operacional",
  email: "",
  re: "000001",
  perfil: "supervisor",
  ativo: true
};

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  return stored ? JSON.parse(stored) : fallback;
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export const isOnlineStorageEnabled = Boolean(supabase);

export function getStoredUser(): Usuario {
  return readLocal(USER_KEY, demoUser);
}

export function setStoredUser(user: Usuario) {
  writeLocal(USER_KEY, user);
}

export function getInspecoes(): Inspecao[] {
  return readLocal<Inspecao[]>(INSPECOES_KEY, []);
}

export async function fetchInspecoes(): Promise<Inspecao[]> {
  if (!supabase) return getInspecoes();
  const { data, error } = await supabase
    .from("app_inspecoes")
    .select("payload")
    .order("atualizado_em", { ascending: false });

  if (!error) {
    const inspecoes = (data || []).map((row) => row.payload as unknown as Inspecao);
    writeLocal(INSPECOES_KEY, inspecoes);
    return inspecoes;
  }

  const relational = await fetchInspecoesRelacionais();
  if (relational) return relational;

  console.warn("Falha ao buscar checklists no Supabase", error.message);
  return getInspecoes();
}

export function saveInspecao(inspecao: Inspecao) {
  const inspecoes = getInspecoes();
  const index = inspecoes.findIndex((item) => item.id === inspecao.id);
  const next = index >= 0 ? inspecoes.map((item) => (item.id === inspecao.id ? inspecao : item)) : [inspecao, ...inspecoes];
  writeLocal(INSPECOES_KEY, next);
  void saveInspecaoRemota(inspecao);
}

export async function saveInspecaoRemota(inspecao: Inspecao) {
  if (!supabase) return;
  const { error } = await supabase
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
  if (!savedRelational) console.warn("Falha ao salvar checklist no Supabase", error.message);
}

async function fetchInspecoesRelacionais(): Promise<Inspecao[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("inspecoes")
    .select("id,estacao_id,data,horario_inicio,horario_fim,turno,status,responsavel_nome,responsavel_re,estacoes(nome),inspecao_respostas(status,observacao,foto_url,foto_urls,respondido_em,checklist_itens(codigo,categoria))")
    .order("data", { ascending: false });

  if (error) return null;

  const inspecoes = (data || []).map((row: any) => {
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

  writeLocal(INSPECOES_KEY, inspecoes);
  return inspecoes;
}

async function saveInspecaoRelacional(inspecao: Inspecao) {
  if (!supabase) return false;
  const stationName = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
  const { data: station } = await supabase.from("estacoes").select("id").eq("nome", stationName).maybeSingle();
  const { data: usuario } = await supabase.from("usuarios").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (!station?.id || !usuario?.id) return false;

  const { error: inspecaoError } = await supabase.from("inspecoes").upsert(
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

  await supabase.from("inspecao_respostas").delete().eq("inspecao_id", inspecao.id);
  const itens = getChecklistItensPorEstacao(inspecao.estacao_id);
  const respostas = Object.values(inspecao.respostas).filter((resposta) => resposta.status);
  if (respostas.length === 0) return true;

  const { data: remoteItems } = await supabase.from("checklist_itens").select("id,codigo,categoria");
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
  const { error } = await supabase.from("inspecao_respostas").insert(rows);
  return !error;
}

export function getInspecao(id: string) {
  return getInspecoes().find((inspecao) => inspecao.id === id);
}

export function getAusencias(): Ausencia[] {
  return readLocal<Ausencia[]>(AUSENCIAS_KEY, []);
}

export async function fetchAusencias(): Promise<Ausencia[]> {
  if (!supabase) return getAusencias();
  const { data, error } = await supabase
    .from("ausencias")
    .select("id,colaborador,tipo,registrado_por,registrado_em")
    .order("registrado_em", { ascending: false });

  if (error) {
    console.warn("Falha ao buscar ausências no Supabase", error.message);
    return getAusencias();
  }

  const ausencias = (data || []) as Ausencia[];
  writeLocal(AUSENCIAS_KEY, ausencias);
  return ausencias;
}

export function saveAusencia(ausencia: Ausencia) {
  writeLocal(AUSENCIAS_KEY, [ausencia, ...getAusencias()]);
}

export async function saveAusenciaRemota(ausencia: Ausencia) {
  if (!supabase) return;
  const { error } = await supabase.from("ausencias").insert({
    id: ausencia.id,
    colaborador: ausencia.colaborador,
    tipo: ausencia.tipo,
    registrado_por: ausencia.registrado_por,
    registrado_em: ausencia.registrado_em
  });

  if (error) console.warn("Falha ao salvar ausência no Supabase", error.message);
}

export function getLevantamentosEfetivo(): LevantamentoEfetivo[] {
  return readLocal<LevantamentoEfetivo[]>(EFETIVO_KEY, []);
}

export async function fetchLevantamentosEfetivo(): Promise<LevantamentoEfetivo[]> {
  if (!supabase) return getLevantamentosEfetivo();
  const { data, error } = await supabase
    .from("levantamentos_efetivo")
    .select("id,data_referencia,hora_preenchimento,estacao,supervisor,lideres,aas,aa,efetivo_total,observacao,criado_em,atualizado_em")
    .order("data_referencia", { ascending: false })
    .order("hora_preenchimento", { ascending: false });

  if (error) {
    console.warn("Falha ao buscar efetivo no Supabase", error.message);
    return getLevantamentosEfetivo();
  }

  const registros = (data || []).map((item) => ({
    ...item,
    observacao: item.observacao || "",
    usuario_id: "supabase"
  })) as LevantamentoEfetivo[];
  writeLocal(EFETIVO_KEY, registros);
  return registros;
}

export function saveLevantamentoEfetivo(registro: LevantamentoEfetivo) {
  const registros = getLevantamentosEfetivo();
  const index = registros.findIndex(
    (item) =>
      item.data_referencia === registro.data_referencia &&
      item.estacao === registro.estacao &&
      item.supervisor === registro.supervisor
  );
  const next = index >= 0 ? registros.map((item, itemIndex) => (itemIndex === index ? { ...registro, id: item.id, criado_em: item.criado_em } : item)) : [registro, ...registros];
  writeLocal(EFETIVO_KEY, next);
  return index >= 0 ? "updated" : "created";
}

export async function saveLevantamentoEfetivoRemoto(registro: LevantamentoEfetivo) {
  if (!supabase) return "local" as const;
  const { error } = await supabase
    .from("levantamentos_efetivo")
    .upsert(
      {
        id: registro.id,
        data_referencia: registro.data_referencia,
        hora_preenchimento: registro.hora_preenchimento,
        estacao: registro.estacao,
        supervisor: registro.supervisor,
        lideres: registro.lideres,
        aas: registro.aas,
        aa: registro.aa,
        efetivo_total: registro.efetivo_total,
        observacao: registro.observacao,
        usuario_nome: registro.usuario_id,
        criado_em: registro.criado_em,
        atualizado_em: new Date().toISOString()
      },
      { onConflict: "data_referencia,estacao,supervisor" }
    );

  if (error) {
    console.warn("Falha ao salvar efetivo no Supabase", error.message);
    return "local" as const;
  }

  return "remote" as const;
}
