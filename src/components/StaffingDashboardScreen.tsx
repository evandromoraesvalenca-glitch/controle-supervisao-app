"use client";

import * as React from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eraser,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  UsersRound
} from "lucide-react";
import { estacoesIniciais } from "@/lib/checklist-data";
import { deleteLevantamentoEfetivo, fetchLevantamentosEfetivo } from "@/lib/storage";
import { nowDate } from "@/lib/utils";
import type { LevantamentoEfetivo } from "@/types";

type StatusGerencial = "Concluído" | "Em andamento" | "Pendente" | "Atenção";
type DashboardView = "geral" | "estacoes" | "status" | "supervisores" | "resumo" | "tabela";

type ExecutiveRow = {
  id: string;
  data: string;
  hora: string;
  estacao: string;
  supervisor: string;
  categoria: string;
  status: StatusGerencial;
  observacao: string;
  total: number;
  isPending?: boolean;
};

const statusOptions: Array<StatusGerencial | "Todos"> = ["Todos", "Concluído", "Em andamento", "Pendente", "Atenção"];

function today() {
  return nowDate();
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string) {
  if (!value) return "Sem atualização";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function toDateTime(registro: LevantamentoEfetivo) {
  const hora = String(registro.hora_preenchimento || "00:00").slice(0, 5);
  return new Date(`${registro.data_referencia}T${hora}:00`);
}

function periodDate(data: string, hora: string, fallback: string) {
  return new Date(`${data}T${hora || fallback}:00`);
}

function resolveStatus(registro: LevantamentoEfetivo): StatusGerencial {
  if (registro.observacao?.trim()) return "Atenção";
  if (registro.efetivo_total <= 0) return "Em andamento";
  return "Concluído";
}

function statusStyle(status: StatusGerencial) {
  const styles = {
    "Concluído": "bg-emerald-50 text-emerald-700 ring-emerald-100",
    "Em andamento": "bg-blue-50 text-blue-700 ring-blue-100",
    Pendente: "bg-orange-50 text-orange-700 ring-orange-100",
    Atenção: "bg-rose-50 text-rose-700 ring-rose-100"
  };
  return styles[status];
}

function statusBarColor(status: StatusGerencial) {
  const colors = {
    "Concluído": "bg-emerald-400",
    "Em andamento": "bg-blue-500",
    Pendente: "bg-linha-orange",
    Atenção: "bg-rose-400"
  };
  return colors[status];
}

export function StaffingDashboardScreen() {
  const [registros, setRegistros] = React.useState<LevantamentoEfetivo[]>([]);
  const [inicioData, setInicioData] = React.useState(today());
  const [inicioHora, setInicioHora] = React.useState("00:00");
  const [fimData, setFimData] = React.useState(today());
  const [fimHora, setFimHora] = React.useState("23:59");
  const [estacaoFiltro, setEstacaoFiltro] = React.useState("Todas");
  const [supervisorFiltro, setSupervisorFiltro] = React.useState("Todos");
  const [statusFiltro, setStatusFiltro] = React.useState<(typeof statusOptions)[number]>("Todos");
  const [selectedStation, setSelectedStation] = React.useState("");
  const [activeView, setActiveView] = React.useState<DashboardView>("geral");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    refreshRegistros();
  }, []);

  async function refreshRegistros() {
    try {
      setIsLoading(true);
      setError("");
      setRegistros(await fetchLevantamentosEfetivo());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os dados do Supabase.");
    } finally {
      setIsLoading(false);
    }
  }

  async function apagarRegistro(registro: LevantamentoEfetivo) {
    const confirmado = window.confirm(`Apagar lançamento de ${registro.estacao} - ${registro.supervisor}?`);
    if (!confirmado) return;
    await deleteLevantamentoEfetivo(registro.id);
    await refreshRegistros();
  }

  function limparFiltros() {
    setInicioData(today());
    setInicioHora("00:00");
    setFimData(today());
    setFimHora("23:59");
    setEstacaoFiltro("Todas");
    setSupervisorFiltro("Todos");
    setStatusFiltro("Todos");
    setSelectedStation("");
  }

  const inicioPeriodo = periodDate(inicioData, inicioHora, "00:00");
  const fimPeriodo = periodDate(fimData, fimHora, "23:59");

  const registrosPeriodo = React.useMemo(() => {
    return registros
      .filter((item) => {
        const dataHora = toDateTime(item);
        return dataHora >= inicioPeriodo && dataHora <= fimPeriodo;
      })
      .sort((a, b) => toDateTime(b).getTime() - toDateTime(a).getTime());
  }, [registros, inicioPeriodo, fimPeriodo]);

  const supervisores = React.useMemo(() => {
    return Array.from(new Set(registrosPeriodo.map((item) => item.supervisor).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [registrosPeriodo]);

  const filtrosAtivos = {
    estacao: selectedStation || estacaoFiltro,
    supervisor: supervisorFiltro,
    status: statusFiltro
  };

  const registrosFiltrados = React.useMemo(() => {
    return registrosPeriodo.filter((item) => {
      const status = resolveStatus(item);
      const stationMatch = filtrosAtivos.estacao === "Todas" || !filtrosAtivos.estacao || item.estacao === filtrosAtivos.estacao;
      const supervisorMatch = filtrosAtivos.supervisor === "Todos" || item.supervisor === filtrosAtivos.supervisor;
      const statusMatch = filtrosAtivos.status === "Todos" || status === filtrosAtivos.status;
      return stationMatch && supervisorMatch && statusMatch;
    });
  }, [registrosPeriodo, filtrosAtivos.estacao, filtrosAtivos.supervisor, filtrosAtivos.status]);

  const pendingStations = estacoesIniciais
    .filter((estacao) => !registrosPeriodo.some((item) => item.estacao === estacao.nome))
    .filter((estacao) => filtrosAtivos.estacao === "Todas" || !filtrosAtivos.estacao || estacao.nome === filtrosAtivos.estacao)
    .filter(() => filtrosAtivos.supervisor === "Todos")
    .filter(() => filtrosAtivos.status === "Todos" || filtrosAtivos.status === "Pendente");

  const executiveRows: ExecutiveRow[] = [
    ...registrosFiltrados.map((registro): ExecutiveRow => ({
      id: registro.id,
      data: registro.data_referencia,
      hora: registro.hora_preenchimento,
      estacao: registro.estacao,
      supervisor: registro.supervisor,
      categoria: "Efetivo operacional",
      status: resolveStatus(registro),
      observacao: registro.observacao || "Lançamento registrado sem observação.",
      total: registro.efetivo_total
    })),
    ...pendingStations.map((estacao): ExecutiveRow => ({
      id: `pendente-${estacao.id}`,
      data: fimData,
      hora: "-",
      estacao: estacao.nome,
      supervisor: "A definir",
      categoria: "Efetivo pendente",
      status: "Pendente" as const,
      observacao: "Aguardando lançamento no período selecionado.",
      total: 0,
      isPending: true
    }))
  ].sort((a, b) => {
    if (a.isPending && !b.isPending) return 1;
    if (!a.isPending && b.isPending) return -1;
    return `${b.data} ${b.hora}`.localeCompare(`${a.data} ${a.hora}`);
  });

  const totalRegistros = executiveRows.length;
  const concluidos = executiveRows.filter((item) => item.status === "Concluído").length;
  const emAndamento = executiveRows.filter((item) => item.status === "Em andamento").length;
  const pendentes = executiveRows.filter((item) => item.status === "Pendente").length;
  const atencao = executiveRows.filter((item) => item.status === "Atenção").length;
  const percentualConclusao = totalRegistros ? Math.round((concluidos / totalRegistros) * 100) : 0;
  const totalEfetivo = registrosFiltrados.reduce((sum, item) => sum + item.efetivo_total, 0);
  const ultimaAtualizacao = registrosPeriodo[0]?.atualizado_em || registrosPeriodo[0]?.criado_em;

  const efetivoPorEstacao = estacoesIniciais.map((estacao) => {
    const rows = registrosFiltrados.filter((item) => item.estacao === estacao.nome);
    return {
      estacao: estacao.nome,
      registros: rows.length,
      efetivo: rows.reduce((sum, item) => sum + item.efetivo_total, 0),
      status: pendingStations.some((item) => item.nome === estacao.nome) ? "Pendente" : rows.some((item) => resolveStatus(item) === "Atenção") ? "Atenção" : rows.length ? "Concluído" : "Pendente"
    };
  });

  const estacoesComVolume = efetivoPorEstacao.filter((item) => item.registros > 0 || item.status === "Pendente");
  const maxEstacao = Math.max(1, ...efetivoPorEstacao.map((item) => item.registros));
  const maiorVolume = [...efetivoPorEstacao].sort((a, b) => b.registros - a.registros)[0];

  const statusDistribution = statusOptions
    .filter((status): status is StatusGerencial => status !== "Todos")
    .map((status) => ({ status, total: executiveRows.filter((item) => item.status === status).length }));
  const maxStatus = Math.max(1, ...statusDistribution.map((item) => item.total));

  const porSupervisor = Array.from(new Set(registrosFiltrados.map((item) => item.supervisor).filter(Boolean))).map((supervisor) => ({
    supervisor,
    registros: registrosFiltrados.filter((item) => item.supervisor === supervisor).length,
    efetivo: registrosFiltrados.filter((item) => item.supervisor === supervisor).reduce((sum, item) => sum + item.efetivo_total, 0)
  })).sort((a, b) => b.registros - a.registros);
  const maxSupervisor = Math.max(1, ...porSupervisor.map((item) => item.registros));

  const pontosAtencao = [
    pendentes ? `${pendentes} estação(ões) sem lançamento no período.` : "",
    atencao ? `${atencao} registro(s) com observação para acompanhamento.` : "",
    emAndamento ? `${emAndamento} registro(s) sem efetivo informado.` : ""
  ].filter(Boolean);
  const viewOptions: Array<{ id: DashboardView; label: string; description: string; icon: React.ElementType }> = [
    { id: "geral", label: "Geral", description: "Indicadores", icon: BarChart3 },
    { id: "estacoes", label: "Estações", description: "Por local", icon: CalendarDays },
    { id: "status", label: "Status", description: "Situação", icon: CheckCircle2 },
    { id: "supervisores", label: "Supervisores", description: "Distribuição", icon: UsersRound },
    { id: "resumo", label: "Resumo", description: "Insights", icon: TrendingUp },
    { id: "tabela", label: "Tabela", description: "Registros", icon: Search }
  ];

  return (
    <section className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wide text-linha-orange">Controle da Supervisão</p>
            <h2 className="mt-1 text-2xl font-black text-linha-blue sm:text-3xl">Dashboard Gerencial da Supervisão</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Visão executiva dos lançamentos de efetivo, pendências por estação e distribuição de responsáveis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={refreshRegistros} className="inline-flex h-10 items-center gap-2 rounded-lg bg-linha-blue px-3 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
            <button onClick={limparFiltros} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
              <Eraser className="h-4 w-4" />
              Limpar filtros
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          <FilterField label="Data inicial" type="date" value={inicioData} onChange={setInicioData} />
          <FilterField label="Hora inicial" type="time" value={inicioHora} onChange={setInicioHora} />
          <FilterField label="Data final" type="date" value={fimData} onChange={setFimData} />
          <FilterField label="Hora final" type="time" value={fimHora} onChange={setFimHora} />
          <SelectField label="Estação" value={filtrosAtivos.estacao || "Todas"} onChange={(value) => { setSelectedStation(""); setEstacaoFiltro(value); }} options={["Todas", ...estacoesIniciais.map((item) => item.nome)]} />
          <SelectField label="Supervisor" value={supervisorFiltro} onChange={setSupervisorFiltro} options={["Todos", ...supervisores]} />
          <SelectField label="Status" value={statusFiltro} onChange={(value) => setStatusFiltro(value as (typeof statusOptions)[number])} options={statusOptions} />
        </div>
      </section>

      {isLoading && <LoadingState />}
      {error && !isLoading && <ErrorState message={error} />}

      {!isLoading && !error && (
        <>
          <DashboardViewSelector activeView={activeView} options={viewOptions} onChange={setActiveView} />

          {executiveRows.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {activeView === "geral" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    <ExecutiveMetric label="Total de registros" value={totalRegistros} icon={BarChart3} />
                    <ExecutiveMetric label="Pendentes" value={pendentes} icon={Clock3} tone="orange" />
                    <ExecutiveMetric label="Em andamento" value={emAndamento} icon={RefreshCw} tone="blue" />
                    <ExecutiveMetric label="Concluídos" value={concluidos} icon={CheckCircle2} tone="green" />
                    <ExecutiveMetric label="Atenção" value={atencao} icon={AlertCircle} tone="red" />
                    <ExecutiveMetric label="Conclusão" value={`${percentualConclusao}%`} icon={TrendingUp} />
                  </div>
                  <ExecutivePanel title="Situação geral" subtitle="Leitura rápida para acompanhamento operacional.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Insight label="Estação com maior volume" value={maiorVolume?.registros ? maiorVolume.estacao : "Sem registros"} detail={`${maiorVolume?.registros || 0} registro(s)`} />
                      <Insight label="Conclusão geral" value={`${percentualConclusao}%`} detail={`${concluidos} de ${totalRegistros} registro(s)`} />
                      <Insight label="Efetivo total lançado" value={totalEfetivo} detail="Soma dos lançamentos filtrados" />
                      <Insight label="Última atualização" value={formatDateTime(ultimaAtualizacao)} detail="Com base no Supabase" />
                    </div>
                  </ExecutivePanel>
                </div>
              )}

              {activeView === "estacoes" && (
                <ExecutivePanel title="Visão por estação" subtitle="Volume de registros por estação no período.">
                  <div className="space-y-3">
                    {estacoesComVolume.map((item) => (
                      <button
                        key={item.estacao}
                        onClick={() => setSelectedStation(item.estacao)}
                        className={`w-full rounded-xl border p-3 text-left transition hover:border-linha-orange ${selectedStation === item.estacao ? "border-linha-orange bg-orange-50" : "border-slate-200 bg-slate-50"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-linha-blue">{item.estacao}</p>
                            <p className="text-xs font-semibold text-slate-500">Registros {item.registros} · Efetivo {item.efetivo}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle(item.status as StatusGerencial)}`}>{item.status}</span>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-white">
                          <div className="h-2.5 rounded-full bg-linha-orange" style={{ width: `${(item.registros / maxEstacao) * 100}%` }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </ExecutivePanel>
              )}

              {activeView === "status" && (
                <ExecutivePanel title="Visão por status" subtitle="Distribuição gerencial da situação atual.">
                  <div className="space-y-3">
                    {statusDistribution.map((item) => (
                      <div key={item.status} className="rounded-xl bg-slate-50 p-3">
                        <div className="flex justify-between gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle(item.status)}`}>{item.status}</span>
                          <strong className="text-linha-blue">{item.total}</strong>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-white">
                          <div className={`h-2.5 rounded-full ${statusBarColor(item.status)}`} style={{ width: `${(item.total / maxStatus) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ExecutivePanel>
              )}

              {activeView === "supervisores" && (
                <ExecutivePanel title="Visão por supervisor" subtitle="Acompanhamento da distribuição dos lançamentos.">
                  <div className="space-y-3">
                    {porSupervisor.length === 0 && <p className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-500">Sem lançamentos para o filtro aplicado.</p>}
                    {porSupervisor.map((item) => (
                      <div key={item.supervisor} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-bold text-linha-blue">{item.supervisor}</p>
                            <p className="text-xs font-semibold text-slate-500">Efetivo total {item.efetivo}</p>
                          </div>
                          <strong className="text-xl text-linha-blue">{item.registros}</strong>
                        </div>
                        <div className="mt-3 h-2.5 rounded-full bg-slate-100">
                          <div className="h-2.5 rounded-full bg-linha-blue" style={{ width: `${(item.registros / maxSupervisor) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ExecutivePanel>
              )}

              {activeView === "resumo" && (
                <ExecutivePanel title="Resumo Gerencial" subtitle="Leitura rápida dos principais sinais do período.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Insight label="Estação com maior volume" value={maiorVolume?.registros ? maiorVolume.estacao : "Sem registros"} detail={`${maiorVolume?.registros || 0} registro(s)`} />
                    <Insight label="Conclusão geral" value={`${percentualConclusao}%`} detail={`${concluidos} de ${totalRegistros} registro(s)`} />
                    <Insight label="Efetivo total lançado" value={totalEfetivo} detail="Soma dos lançamentos filtrados" />
                    <Insight label="Última atualização" value={formatDateTime(ultimaAtualizacao)} detail="Com base no Supabase" />
                  </div>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-black text-linha-blue">Principais pontos de atenção</p>
                    {pontosAtencao.length > 0 ? (
                      <ul className="space-y-2 text-sm font-semibold text-slate-600">
                        {pontosAtencao.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm font-semibold text-slate-500">Nenhum ponto crítico identificado para os filtros aplicados.</p>
                    )}
                  </div>
                </ExecutivePanel>
              )}

              {activeView === "tabela" && (
                <ExecutivePanel title="Tabela executiva" subtitle="Últimos registros e pendências do período.">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="hidden grid-cols-[110px_1fr_1fr_150px_130px_1.5fr_56px] gap-3 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 lg:grid">
                    <span>Data</span>
                    <span>Estação</span>
                    <span>Supervisor</span>
                    <span>Categoria</span>
                    <span>Status</span>
                    <span>Próximo passo</span>
                    <span></span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {executiveRows.slice(0, 12).map((row) => {
                      const original = registros.find((item) => item.id === row.id);
                      return (
                        <article key={row.id} className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[110px_1fr_1fr_150px_130px_1.5fr_56px] lg:items-center">
                          <div className="font-bold text-slate-700">{formatDate(row.data)} {row.hora !== "-" && <span className="block text-xs font-semibold text-slate-400">{row.hora}</span>}</div>
                          <div className="font-bold text-linha-blue">{row.estacao}</div>
                          <div className="font-semibold text-slate-600">{row.supervisor}</div>
                          <div className="font-semibold text-slate-500">{row.categoria}</div>
                          <div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle(row.status)}`}>{row.status}</span></div>
                          <div className="font-medium text-slate-500">{row.observacao}</div>
                          <div>
                            {original && (
                              <button onClick={() => apagarRegistro(original)} className="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-700" title="Apagar lançamento">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
                </ExecutivePanel>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

function DashboardViewSelector({ activeView, options, onChange }: { activeView: DashboardView; options: Array<{ id: DashboardView; label: string; description: string; icon: React.ElementType }>; onChange: (view: DashboardView) => void }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 px-1 text-xs font-black uppercase tracking-wide text-slate-500">Selecionar visão</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {options.map(({ id, label, description, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex min-h-[62px] items-center gap-2 rounded-xl border px-3 text-left transition ${active ? "border-linha-orange bg-orange-50 text-linha-blue" : "border-slate-200 bg-slate-50 text-slate-600"}`}
            >
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${active ? "bg-linha-orange text-white" : "bg-white text-linha-blue"}`}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black">{label}</span>
                <span className="block truncate text-xs font-semibold opacity-75">{description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FilterField({ label, type, value, onChange }: { label: string; type: "date" | "time"; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-linha-orange focus:bg-white" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-linha-orange focus:bg-white">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ExecutiveMetric({ label, value, icon: Icon, tone = "neutral" }: { label: string; value: number | string; icon: React.ElementType; tone?: "neutral" | "orange" | "blue" | "green" | "red" }) {
  const tones = {
    neutral: "bg-slate-100 text-linha-blue",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700"
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black text-linha-blue">{value}</p>
    </div>
  );
}

function ExecutivePanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4">
        <h3 className="text-lg font-black text-linha-blue">{title}</h3>
        {subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Insight({ label, value, detail }: { label: string; value: React.ReactNode; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-black text-linha-blue">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white shadow-sm" />)}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <Search className="mx-auto h-10 w-10 text-slate-300" />
      <h3 className="mt-3 text-lg font-black text-linha-blue">Nenhum dado encontrado</h3>
      <p className="mt-1 text-sm font-semibold text-slate-500">Ajuste o período ou limpe os filtros para ampliar a consulta.</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700">
      Não foi possível carregar o dashboard: {message}
    </div>
  );
}
