"use client";

import * as React from "react";
import { AlertCircle, BarChart3, CalendarDays, TrendingDown, TrendingUp, UsersRound } from "lucide-react";
import { estacoesIniciais } from "@/lib/checklist-data";
import { fetchLevantamentosEfetivo } from "@/lib/storage";
import type { LevantamentoEfetivo } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

export function StaffingDashboardScreen() {
  const [registros, setRegistros] = React.useState<LevantamentoEfetivo[]>([]);
  const [data, setData] = React.useState(today());

  React.useEffect(() => {
    fetchLevantamentosEfetivo().then(setRegistros);
  }, []);

  const registrosDoDia = registros.filter((item) => item.data_referencia === data);
  const total = registrosDoDia.reduce((sum, item) => sum + item.efetivo_total, 0);
  const lideres = registrosDoDia.reduce((sum, item) => sum + item.lideres, 0);
  const aas = registrosDoDia.reduce((sum, item) => sum + item.aas, 0);
  const aa = registrosDoDia.reduce((sum, item) => sum + item.aa, 0);
  const estacoesPreenchidas = new Set(registrosDoDia.map((item) => item.estacao)).size;
  const semPreenchimento = estacoesIniciais.filter((estacao) => !registrosDoDia.some((item) => item.estacao === estacao.nome));

  const efetivoPorEstacao = estacoesIniciais.map((estacao) => {
    const registrosDaEstacao = registrosDoDia.filter((item) => item.estacao === estacao.nome);
    return {
      estacao: estacao.nome,
      lideres: registrosDaEstacao.reduce((sum, item) => sum + item.lideres, 0),
      aas: registrosDaEstacao.reduce((sum, item) => sum + item.aas, 0),
      aa: registrosDaEstacao.reduce((sum, item) => sum + item.aa, 0),
      total: registrosDaEstacao.reduce((sum, item) => sum + item.efetivo_total, 0),
      supervisores: registrosDaEstacao.map((item) => item.supervisor).join(", "),
      observacoes: registrosDaEstacao.map((item) => item.observacao).filter(Boolean)
    };
  });

  const estacoesComEfetivo = efetivoPorEstacao.filter((item) => item.total > 0);
  const maiorEfetivo = [...estacoesComEfetivo].sort((a, b) => b.total - a.total)[0];
  const menorEfetivo = [...estacoesComEfetivo].sort((a, b) => a.total - b.total)[0];
  const maxEstacao = Math.max(1, ...efetivoPorEstacao.map((item) => item.total));

  const porSupervisor = Array.from(new Set(registrosDoDia.map((item) => item.supervisor))).map((supervisor) => ({
    supervisor,
    total: registrosDoDia.filter((item) => item.supervisor === supervisor).reduce((sum, item) => sum + item.efetivo_total, 0)
  }));
  const maxSupervisor = Math.max(1, ...porSupervisor.map((item) => item.total));

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-linha-orange">Dashboard</p>
          <h2 className="text-2xl font-bold text-linha-blue">Visualização Geral do Efetivo</h2>
        </div>
        <label className="block sm:w-56">
          <span className="text-sm font-semibold text-slate-700">Data de referência</span>
          <input type="date" value={data} onChange={(event) => setData(event.target.value)} className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Efetivo total" value={total} icon={UsersRound} />
        <Metric label="Líderes" value={lideres} />
        <Metric label="AAS" value={aas} />
        <Metric label="AA" value={aa} />
        <Metric label="Estações preenchidas" value={estacoesPreenchidas} icon={CalendarDays} />
        <Metric label="Sem preenchimento" value={semPreenchimento.length} danger icon={AlertCircle} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <HighlightCard title="Estação com maior efetivo" station={maiorEfetivo?.estacao || "Sem lançamento"} value={maiorEfetivo?.total ?? 0} icon={TrendingUp} />
        <HighlightCard title="Estação com menor efetivo" station={menorEfetivo?.estacao || "Sem lançamento"} value={menorEfetivo?.total ?? 0} icon={TrendingDown} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_.8fr]">
        <section className="rounded-lg bg-white p-4 shadow-panel">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-linha-blue">
            <BarChart3 className="h-5 w-5 text-linha-orange" />
            Efetivo por estação em {formatDate(data)}
          </h3>
          <div className="space-y-3">
            {efetivoPorEstacao.map((registro) => {
              const percent = (registro.total / maxEstacao) * 100;
              return (
                <div key={registro.estacao} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-linha-blue">{registro.estacao}</p>
                      {registro.total > 0 ? (
                        <p className="text-sm font-semibold text-slate-600">
                          Líderes {registro.lideres} · AAS {registro.aas} · AA {registro.aa} · Supervisor {registro.supervisores}
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-amber-700">Sem lançamento</p>
                      )}
                    </div>
                    <strong className={registro.total > 0 ? "text-2xl text-linha-blue" : "text-2xl text-slate-300"}>{registro.total}</strong>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-200">
                    <div className="h-3 rounded-full bg-linha-orange" style={{ width: `${percent}%` }} />
                  </div>
                  {registro.observacoes.map((observacao) => (
                    <p key={observacao} className="mt-2 rounded bg-white p-2 text-sm text-slate-600">{observacao}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg bg-white p-4 shadow-panel">
          <h3 className="mb-3 text-lg font-bold text-linha-blue">Resumo por supervisor</h3>
          <div className="space-y-3">
            {porSupervisor.length === 0 && <p className="font-semibold text-slate-500">Nenhum lançamento para a data selecionada.</p>}
            {porSupervisor.map((item) => (
              <div key={item.supervisor} className="rounded-lg bg-slate-100 p-3">
                <div className="flex justify-between gap-3">
                  <span className="font-bold text-slate-700">{item.supervisor}</span>
                  <span className="font-black text-linha-blue">{item.total}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white">
                  <div className="h-2 rounded-full bg-linha-blue" style={{ width: `${(item.total / maxSupervisor) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function HighlightCard({ title, station, value, icon: Icon }: { title: string; station: string; value: number; icon: React.ElementType }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase text-linha-orange">
        <Icon className="h-5 w-5" />
        {title}
      </div>
      <p className="text-xl font-black text-linha-blue">{station}</p>
      <p className="text-sm font-semibold text-slate-500">Efetivo: {value}</p>
    </div>
  );
}

function Metric({ label, value, danger, icon: Icon }: { label: string; value: number; danger?: boolean; icon?: React.ElementType }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        {Icon && <Icon className={danger ? "h-5 w-5 text-red-600" : "h-5 w-5 text-linha-orange"} />}
      </div>
      <p className={danger ? "mt-2 text-3xl font-black text-red-600" : "mt-2 text-3xl font-black text-linha-blue"}>{value}</p>
    </div>
  );
}
