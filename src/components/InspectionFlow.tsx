"use client";

import * as React from "react";
import { AlertTriangle, ArrowLeft, Camera, Check, ChevronRight, Lock, Save, X } from "lucide-react";
import { categorias, estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { fetchInspecoes, saveInspecao } from "@/lib/storage";
import { cx, formatDate, isAplicavel, nowDate, nowTime, summarize } from "@/lib/utils";
import type { ChecklistItem, Estacao, Inspecao, Resposta, StatusResposta, Turno, Usuario } from "@/types";

type Step = "estacoes" | "inicio" | "checklist" | "resumo";

export function InspectionFlow({ user, onSaved }: { user: Usuario; onSaved: () => void }) {
  const [step, setStep] = React.useState<Step>("estacoes");
  const [selectedStation, setSelectedStation] = React.useState<Estacao | null>(null);
  const [inspecao, setInspecao] = React.useState<Inspecao | null>(null);
  const [activeCategory, setActiveCategory] = React.useState(categorias[0]);

  function startStation(station: Estacao) {
    setSelectedStation(station);
    setInspecao({
      id: crypto.randomUUID(),
      estacao_id: station.id,
      usuario_id: user.id,
      data: nowDate(),
      horario_inicio: nowTime(),
      turno: "Manhã",
      status: "rascunho",
      responsavel_nome: user.nome,
      responsavel_re: user.re,
      respostas: {}
    });
    setStep("inicio");
  }

  function resumeInspection(nextInspection: Inspecao) {
    const station = estacoesIniciais.find((stationItem) => stationItem.id === nextInspection.estacao_id) || null;
    setSelectedStation(station);
    setInspecao(nextInspection);
    setStep(nextInspection.status === "rascunho" ? "inicio" : "checklist");
  }

  async function updateInspection(next: Inspecao) {
    setInspecao(next);
    await saveInspecao(next);
    onSaved();
  }

  async function startChecklist() {
    if (!inspecao) return;
    const next = { ...inspecao, status: "em_andamento" as const };
    await updateInspection(next);
    setStep("checklist");
  }

  function setResposta(item: ChecklistItem, patch: Partial<Resposta>) {
    if (!inspecao || (inspecao.status === "finalizada" && user.perfil !== "coordenacao-gerencia")) return;
    const current = inspecao.respostas[item.id] || {
      checklist_item_id: item.id,
      status: null,
      observacao: "",
      fotos: []
    };
    const nextResposta = {
      ...current,
      ...patch,
      respondido_por: user.id,
      respondido_em: new Date().toISOString()
    };
    void updateInspection({
      ...inspecao,
      respostas: {
        ...inspecao.respostas,
        [item.id]: nextResposta
      }
    });
  }

  async function attachPhotos(item: ChecklistItem, files: FileList | null) {
    if (!files?.length) return;
    const current = inspecao?.respostas[item.id]?.fotos || [];
    const names = Array.from(files).map((file) => file.name);
    setResposta(item, { fotos: [...current, ...names] });
  }

  async function finalizar() {
    if (!inspecao) return;
    await updateInspection({ ...inspecao, status: "finalizada", horario_fim: nowTime() });
  }

  if (step === "estacoes") {
    return (
      <section>
        <div className="mb-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-linha-orange">Tela 2</p>
          <h2 className="text-2xl font-bold text-linha-blue">Escolha a estação</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {estacoesIniciais.map((station) => (
            <button
              key={station.id}
              onClick={() => startStation(station)}
              className="flex min-h-28 items-center justify-between rounded-lg bg-white p-5 text-left text-xl font-bold text-linha-blue shadow-panel ring-1 ring-slate-200 hover:ring-linha-orange"
            >
              {station.nome}
              <ChevronRight className="h-6 w-6 text-linha-orange" />
            </button>
          ))}
        </div>
        <Drafts onResume={resumeInspection} />
      </section>
    );
  }

  if (!inspecao || !selectedStation) return null;

  const itensDaEstacao = getChecklistItensPorEstacao(selectedStation.id);
  const categoriasDaEstacao = Array.from(new Set(itensDaEstacao.map((item) => item.categoria)));

  if (step === "inicio") {
    return (
      <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-panel">
        <button onClick={() => setStep("estacoes")} className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ArrowLeft className="h-4 w-4" />
          Trocar estação
        </button>
        <h2 className="text-2xl font-bold text-linha-blue">Início da inspeção</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label="Estação selecionada" value={selectedStation.nome} />
          <Info label="Data automática" value={formatDate(inspecao.data)} />
          <Info label="Horário de início" value={inspecao.horario_inicio} />
          <Info label="Responsável" value={inspecao.responsavel_nome} />
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">RE do responsável</span>
            <input
              value={inspecao.responsavel_re}
              onChange={(event) => setInspecao({ ...inspecao, responsavel_re: event.target.value })}
              className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Turno</span>
            <select
              value={inspecao.turno}
              onChange={(event) => setInspecao({ ...inspecao, turno: event.target.value as Turno })}
              className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3"
            >
              <option>Manhã</option>
              <option>Tarde</option>
              <option>Noite</option>
              <option>Operação Parcial</option>
            </select>
          </label>
        </div>
        <button onClick={startChecklist} className="mt-6 h-14 w-full rounded-lg bg-linha-orange text-lg font-bold text-white">
          Iniciar Checklist
        </button>
      </section>
    );
  }

  const stats = summarize(inspecao, itensDaEstacao);
  const progress = Math.round(((stats.ok + stats.nok + stats.na) / stats.total) * 100);
  const locked = inspecao.status === "finalizada" && user.perfil !== "coordenacao-gerencia";

  if (step === "resumo") {
    const nokItems = itensDaEstacao.filter((item) => inspecao.respostas[item.id]?.status === "NOK");
    return (
      <section className="space-y-5">
        <SummaryHeader inspecao={inspecao} station={selectedStation} />
        <div className="grid gap-3 sm:grid-cols-5">
          <Metric label="Total" value={stats.total} />
          <Metric label="OK" value={stats.ok} />
          <Metric label="NOK" value={stats.nok} danger />
          <Metric label="N/A" value={stats.na} />
          <Metric label="Pendentes" value={stats.pendentes.length + stats.invalidos.length} />
        </div>
        <div className="rounded-lg bg-white p-5 shadow-panel">
          <h3 className="text-lg font-bold text-linha-blue">Itens NOK</h3>
          <div className="mt-3 space-y-3">
            {nokItems.length === 0 && <p className="text-slate-500">Nenhum item NOK registrado.</p>}
            {nokItems.map((item) => {
              const resposta = inspecao.respostas[item.id];
              return (
                <div key={item.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="font-bold text-red-800">{item.codigo} · {item.descricao}</p>
                  <p className="text-sm text-red-700">{resposta.observacao || "Sem observação"}</p>
                  <p className="mt-1 text-xs text-red-700">Fotos: {resposta.fotos.join(", ") || "pendente"}</p>
                </div>
              );
            })}
          </div>
        </div>
        {!stats.podeFinalizar && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Existem itens pendentes ou NOK sem observação{inspecao.turno !== "Operação Parcial" ? "/foto" : ""}.
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 no-print">
          <button onClick={() => setStep("checklist")} className="h-14 rounded-lg bg-slate-200 font-bold text-linha-blue">
            Voltar e corrigir
          </button>
          <button
            disabled={!stats.podeFinalizar || locked}
            onClick={finalizar}
            className="h-14 rounded-lg bg-linha-orange font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Finalizar Inspeção
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <SummaryHeader inspecao={inspecao} station={selectedStation} />
      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-4 text-sm font-bold text-linha-blue shadow-panel">
          <Lock className="h-4 w-4" />
          Inspeção finalizada. A edição está bloqueada para usuários comuns.
        </div>
      )}
      <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
          <span>Progresso do checklist</span>
          <span>{progress}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-200">
          <div className="h-3 rounded-full bg-linha-orange" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 no-print">
        {categoriasDaEstacao.map((categoria) => (
          <button
            key={categoria}
            onClick={() => setActiveCategory(categoria)}
            className={cx(
              "min-h-11 shrink-0 rounded-lg px-4 text-sm font-bold",
              activeCategory === categoria ? "bg-linha-blue text-white" : "bg-white text-linha-blue"
            )}
          >
            {categoria}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {itensDaEstacao
          .filter((item) => item.categoria === activeCategory)
          .map((item) => (
            <ChecklistCard
              key={item.id}
              item={item}
              inspecao={inspecao}
              locked={locked}
              setResposta={setResposta}
              attachPhotos={attachPhotos}
            />
          ))}
      </div>
      <div className="sticky bottom-0 grid gap-3 bg-slate-100 py-3 sm:grid-cols-2 no-print">
        <button disabled={locked} onClick={() => updateInspection(inspecao)} className="flex h-14 items-center justify-center gap-2 rounded-lg bg-white font-bold text-linha-blue shadow-panel disabled:opacity-50">
          <Save className="h-5 w-5" />
          Salvar parcial
        </button>
        <button onClick={() => setStep("resumo")} className="h-14 rounded-lg bg-linha-orange font-bold text-white">
          Ver resumo
        </button>
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-100 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-linha-blue">{value}</p>
    </div>
  );
}

function SummaryHeader({ inspecao, station }: { inspecao: Inspecao; station: Estacao }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <div className="grid gap-3 sm:grid-cols-4">
        <Info label="Estação" value={station.nome} />
        <Info label="Data" value={formatDate(inspecao.data)} />
        <Info label="Início" value={inspecao.horario_inicio} />
        <Info label="Turno" value={inspecao.turno} />
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className={cx("rounded-lg bg-white p-4 shadow-panel", danger && "ring-2 ring-red-200")}>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={cx("text-3xl font-black", danger ? "text-red-600" : "text-linha-blue")}>{value}</p>
    </div>
  );
}

function ChecklistCard({
  item,
  inspecao,
  locked,
  setResposta,
  attachPhotos
}: {
  item: ChecklistItem;
  inspecao: Inspecao;
  locked: boolean;
  setResposta: (item: ChecklistItem, patch: Partial<Resposta>) => void;
  attachPhotos: (item: ChecklistItem, files: FileList | null) => void;
}) {
  const resposta = inspecao.respostas[item.id] || { checklist_item_id: item.id, status: null, observacao: "", fotos: [] };
  const aplicavel = isAplicavel(item, inspecao);
  const exigeFotoNok = inspecao.turno !== "Operação Parcial";
  const statusButtons: Array<{ value: StatusResposta; label: string; icon: React.ElementType }> = [
    { value: "OK", label: "OK", icon: Check },
    { value: "NOK", label: "NOK", icon: AlertTriangle },
    { value: "NA", label: "N/A", icon: X }
  ];
  const missingEvidence = resposta.status === "NOK" && (!resposta.observacao.trim() || (exigeFotoNok && resposta.fotos.length === 0));

  return (
    <article className={cx("rounded-lg bg-white p-4 shadow-panel ring-1", missingEvidence ? "ring-red-300" : "ring-slate-200", !aplicavel && "bg-slate-50")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-linha-blue px-2 py-1 text-sm font-bold text-white">{item.codigo}</span>
            {!aplicavel && <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Indisponível na operação parcial</span>}
          </div>
          <h3 className="mt-3 text-lg font-bold text-linha-blue">{item.descricao}</h3>
          <p className="mt-1 text-sm text-slate-600">{item.controle_especifico}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-72">
          {statusButtons.map((button) => {
            const Icon = button.icon;
            const active = resposta.status === button.value || (!aplicavel && button.value === "NA" && !resposta.status);
            return (
              <button
                key={button.label}
                disabled={locked}
                onClick={() => setResposta(item, { status: button.value })}
                className={cx(
                  "flex h-12 items-center justify-center gap-1 rounded-lg text-sm font-black disabled:cursor-not-allowed disabled:opacity-50",
                  active ? "bg-linha-orange text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {button.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Observações {resposta.status === "NOK" && <strong className="text-red-600">*</strong>}</span>
          <textarea
            disabled={locked}
            value={resposta.observacao}
            onChange={(event) => setResposta(item, { observacao: event.target.value })}
            className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3 disabled:bg-slate-100"
            placeholder="Registre detalhes quando necessário"
          />
        </label>
        <div>
          <span className="text-sm font-semibold text-slate-700">Fotos {resposta.status === "NOK" && exigeFotoNok && <strong className="text-red-600">*</strong>}</span>
          <label className={cx("mt-1 flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-sm font-semibold text-slate-600", !locked && "cursor-pointer")}>
            <Camera className="mb-2 h-5 w-5 text-linha-orange" />
            Anexar fotos
            <input disabled={locked} type="file" accept="image/*" multiple className="hidden" onChange={(event) => attachPhotos(item, event.target.files)} />
          </label>
          {resposta.fotos.length > 0 && <p className="mt-2 text-xs text-slate-500">{resposta.fotos.join(", ")}</p>}
        </div>
      </div>
      {missingEvidence && (
        <p className="mt-3 text-sm font-bold text-red-700">
          {exigeFotoNok ? "Item NOK exige observação e foto como evidência." : "Item NOK exige observação."}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Respondido em: {resposta.respondido_em ? new Date(resposta.respondido_em).toLocaleString("pt-BR") : "pendente"} · Usuário: {inspecao.responsavel_nome}
      </p>
    </article>
  );
}

function Drafts({ onResume }: { onResume: (inspecao: Inspecao) => void }) {
  const [drafts, setDrafts] = React.useState<Inspecao[]>([]);

  React.useEffect(() => {
    fetchInspecoes().then((inspecoes) => setDrafts(inspecoes.filter((inspecao) => inspecao.status !== "finalizada").slice(0, 4)));
  }, []);

  if (drafts.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg bg-white p-4 shadow-panel">
      <h3 className="text-lg font-bold text-linha-blue">Continuar inspeção salva</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {drafts.map((draft) => {
          const station = estacoesIniciais.find((item) => item.id === draft.estacao_id)?.nome || draft.estacao_id;
          return (
            <button
              key={draft.id}
              onClick={() => onResume(draft)}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left hover:border-linha-orange"
            >
              <p className="font-bold text-linha-blue">{station}</p>
              <p className="text-sm text-slate-600">{formatDate(draft.data)} · {draft.turno} · {draft.status}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

