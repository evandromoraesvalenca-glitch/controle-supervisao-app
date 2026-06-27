"use client";

import * as React from "react";
import { ClipboardCheck, Pencil, Save, Trash2, UserMinus, X } from "lucide-react";
import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { downloadInspectionPdf } from "@/lib/exporters";
import { deleteLevantamentoEfetivo, fetchAusencias, fetchInspecoes, fetchLevantamentosEfetivo, updateLevantamentoEfetivo } from "@/lib/storage";
import { formatDate, summarize } from "@/lib/utils";
import type { Ausencia, Inspecao, LevantamentoEfetivo } from "@/types";

type RegistroFiltro = "todos" | "checklists" | "efetivo" | "ausencias";

const tipoAusenciaLabel: Record<Ausencia["tipo"], string> = {
  falta: "Falta",
  "banco-de-horas": "Banco de horas",
  atestado: "Atestado",
  "home-office": "Home office"
};

const filtrosRegistro: Array<{ value: RegistroFiltro; label: string; description: string }> = [
  { value: "todos", label: "Todos", description: "Ver todos os registros" },
  { value: "checklists", label: "Checklists", description: "Inspeções salvas" },
  { value: "efetivo", label: "Efetivo", description: "Distribuição lançada" },
  { value: "ausencias", label: "Ausências", description: "Faltas e registros" }
];

const supervisoresEfetivo = ["Evandro", "Lucas", "Ana", "Audrey", "Dackson", "Junior", "Marta", "A definir"];

export function SavedRecordsScreen() {
  const [inspecoes, setInspecoes] = React.useState<Inspecao[]>([]);
  const [ausencias, setAusencias] = React.useState<Ausencia[]>([]);
  const [efetivo, setEfetivo] = React.useState<LevantamentoEfetivo[]>([]);
  const [filtro, setFiltro] = React.useState<RegistroFiltro>("todos");
  const [dataFiltro, setDataFiltro] = React.useState("");
  const [editingEfetivoId, setEditingEfetivoId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    fetchInspecoes().then(setInspecoes);
    fetchAusencias().then(setAusencias);
    fetchLevantamentosEfetivo().then(setEfetivo);
  }, []);

  async function refreshEfetivo() {
    setEfetivo(await fetchLevantamentosEfetivo());
  }

  async function salvarEdicaoEfetivo(event: React.FormEvent<HTMLFormElement>, registro: LevantamentoEfetivo) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lideres = Math.max(0, Number(form.get("lideres") || 0));
    const aas = Math.max(0, Number(form.get("aas") || 0));
    const aa = Math.max(0, Number(form.get("aa") || 0));
    const atualizado: LevantamentoEfetivo = {
      ...registro,
      data_referencia: String(form.get("data_referencia") || registro.data_referencia),
      hora_preenchimento: String(form.get("hora_preenchimento") || registro.hora_preenchimento),
      estacao: String(form.get("estacao") || registro.estacao),
      supervisor: String(form.get("supervisor") || registro.supervisor),
      lideres,
      aas,
      aa,
      efetivo_total: lideres + aas + aa,
      observacao: String(form.get("observacao") || ""),
      atualizado_em: new Date().toISOString()
    };

    await updateLevantamentoEfetivo(atualizado);
    await refreshEfetivo();
    setEditingEfetivoId(null);
    setMessage("Lançamento de efetivo atualizado.");
  }

  async function excluirEfetivo(registro: LevantamentoEfetivo) {
    if (!window.confirm(`Excluir lançamento de ${registro.estacao} - ${registro.supervisor}?`)) return;
    await deleteLevantamentoEfetivo(registro.id);
    await refreshEfetivo();
    setMessage("Lançamento de efetivo excluído.");
  }

  const inspecoesFiltradas = dataFiltro ? inspecoes.filter((inspecao) => inspecao.data === dataFiltro) : inspecoes;
  const efetivoFiltrado = dataFiltro ? efetivo.filter((registro) => registro.data_referencia === dataFiltro) : efetivo;
  const ausenciasFiltradas = dataFiltro ? ausencias.filter((ausencia) => ausencia.registrado_em.slice(0, 10) === dataFiltro) : ausencias;

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Consulta</p>
        <h2 className="text-2xl font-bold text-linha-blue">Registros salvos</h2>
      </div>

      <section className="rounded-lg bg-white p-3 shadow-panel">
        <p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-slate-500">Escolha o tipo de registro</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {filtrosRegistro.map((item) => {
            const active = filtro === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setFiltro(item.value)}
                className={active ? "rounded-lg border border-linha-orange bg-orange-50 p-3 text-left text-linha-blue" : "rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-slate-600"}
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className="block text-xs font-semibold">{item.description}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1 block px-1 text-xs font-black uppercase tracking-wide text-slate-500">Filtrar por data</span>
            <input
              type="date"
              value={dataFiltro}
              onChange={(event) => setDataFiltro(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-linha-blue"
            />
          </label>
          <button
            type="button"
            onClick={() => setDataFiltro("")}
            className="h-11 rounded-lg bg-slate-100 px-4 text-sm font-bold text-linha-blue ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!dataFiltro}
          >
            Limpar data
          </button>
        </div>
      </section>

      {message && <p className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}

      {(filtro === "todos" || filtro === "efetivo") && <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Distribuição de efetivo</h3>
        </div>
        <div className="space-y-3">
          {efetivoFiltrado.length === 0 && <p className="font-semibold text-slate-500">Nenhum lançamento de efetivo encontrado.</p>}
          {efetivoFiltrado.map((registro) => (
            <article key={registro.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              {editingEfetivoId === registro.id ? (
                <form className="grid gap-3" onSubmit={(event) => salvarEdicaoEfetivo(event, registro)}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <EditField label="Data" name="data_referencia" type="date" defaultValue={registro.data_referencia} />
                    <EditField label="Horário" name="hora_preenchimento" type="time" defaultValue={registro.hora_preenchimento} />
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-500">Estação</span>
                      <select name="estacao" defaultValue={registro.estacao} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
                        {estacoesIniciais.map((estacao) => <option key={estacao.id}>{estacao.nome}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-slate-500">Supervisor</span>
                      <select name="supervisor" defaultValue={registro.supervisor} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
                        {supervisoresEfetivo.map((supervisor) => <option key={supervisor}>{supervisor}</option>)}
                      </select>
                    </label>
                    <EditField label="LAS" name="lideres" type="number" defaultValue={String(registro.lideres)} />
                    <EditField label="AAS" name="aas" type="number" defaultValue={String(registro.aas)} />
                    <EditField label="AA" name="aa" type="number" defaultValue={String(registro.aa)} />
                  </div>
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-500">Observação</span>
                    <textarea name="observacao" defaultValue={registro.observacao} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-linha-orange font-bold text-white">
                      <Save className="h-4 w-4" />
                      Salvar alteração
                    </button>
                    <button type="button" onClick={() => setEditingEfetivoId(null)} className="flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-200 font-bold text-linha-blue">
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="font-bold text-linha-blue">{registro.estacao}</p>
                  <p className="text-sm text-slate-600">
                    {new Date(`${registro.data_referencia}T00:00:00`).toLocaleDateString("pt-BR")} · {registro.hora_preenchimento} · {registro.supervisor} · LAS {registro.lideres} · AAS {registro.aas} · AA {registro.aa} · Total {registro.efetivo_total}
                  </p>
                  {registro.observacao && <p className="mt-1 text-sm text-slate-500">{registro.observacao}</p>}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button onClick={() => setEditingEfetivoId(registro.id)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white font-bold text-linha-blue ring-1 ring-slate-200">
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                    <button onClick={() => excluirEfetivo(registro)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-red-50 font-bold text-red-700 ring-1 ring-red-100">
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </div>}

      {(filtro === "todos" || filtro === "checklists") && <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Checklists</h3>
        </div>
        <div className="space-y-3">
          {inspecoesFiltradas.length === 0 && <p className="font-semibold text-slate-500">Nenhum checklist encontrado.</p>}
          {inspecoesFiltradas.map((inspecao) => {
            const station = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
            const stats = summarize(inspecao, getChecklistItensPorEstacao(inspecao.estacao_id));
            return (
              <article key={inspecao.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-bold text-linha-blue">{station}</p>
                <p className="text-sm text-slate-600">
                  {formatDate(inspecao.data)} · {inspecao.turno} · {inspecao.responsavel_nome} · {inspecao.status}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-700">
                  OK {stats.ok} · NOK {stats.nok} · N/A {stats.na} · Pendentes {stats.pendentes.length}
                </p>
                <button
                  onClick={() => downloadInspectionPdf(inspecao)}
                  className="mt-3 h-11 rounded-lg bg-linha-orange px-4 font-bold text-white"
                >
                  Baixar PDF
                </button>
              </article>
            );
          })}
        </div>
      </div>}

      {(filtro === "todos" || filtro === "ausencias") && <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <UserMinus className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Ausências</h3>
        </div>
        <div className="space-y-3">
          {ausenciasFiltradas.length === 0 && <p className="font-semibold text-slate-500">Nenhuma ausência encontrada.</p>}
          {ausenciasFiltradas.map((ausencia) => (
            <article key={ausencia.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-bold text-linha-blue">{ausencia.colaborador}</p>
              <p className="text-sm text-slate-600">
                {tipoAusenciaLabel[ausencia.tipo] || ausencia.tipo} · {new Date(ausencia.registrado_em).toLocaleString("pt-BR")} · {ausencia.registrado_por}
              </p>
            </article>
          ))}
        </div>
      </div>}
    </section>
  );
}

function EditField({ label, name, type, defaultValue }: { label: string; name: string; type: "date" | "time" | "number"; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input name={name} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? 1 : undefined} defaultValue={defaultValue} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
    </label>
  );
}
