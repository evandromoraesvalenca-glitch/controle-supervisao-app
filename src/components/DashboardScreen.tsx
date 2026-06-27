"use client";

import * as React from "react";
import { checklistItensIniciais, categorias, estacoesIniciais } from "@/lib/checklist-data";
import { fetchInspecoes } from "@/lib/storage";
import { nowDate, summarize } from "@/lib/utils";
import type { Inspecao } from "@/types";

export function DashboardScreen({ refreshKey }: { refreshKey: number }) {
  const [inspecoes, setInspecoes] = React.useState<Inspecao[]>([]);
  React.useEffect(() => {
    fetchInspecoes().then(setInspecoes);
  }, [refreshKey]);

  const totalItens = inspecoes.reduce((sum, inspecao) => sum + summarize(inspecao, checklistItensIniciais).total, 0);
  const ok = inspecoes.reduce((sum, inspecao) => sum + summarize(inspecao, checklistItensIniciais).ok, 0);
  const nok = inspecoes.reduce((sum, inspecao) => sum + summarize(inspecao, checklistItensIniciais).nok, 0);
  const na = inspecoes.reduce((sum, inspecao) => sum + summarize(inspecao, checklistItensIniciais).na, 0);
  const pendentes = inspecoes.filter((inspecao) => inspecao.status !== "finalizada").length;
  const today = nowDate();

  const nokPorEstacao = estacoesIniciais.map((station) => ({
    label: station.nome,
    value: inspecoes
      .filter((inspecao) => inspecao.estacao_id === station.id)
      .reduce((sum, inspecao) => sum + summarize(inspecao, checklistItensIniciais).nok, 0)
  }));

  const nokPorCategoria = categorias.map((categoria) => ({
    label: categoria,
    value: checklistItensIniciais
      .filter((item) => item.categoria === categoria)
      .reduce((sum, item) => sum + inspecoes.filter((inspecao) => inspecao.respostas[item.id]?.status === "NOK").length, 0)
  }));

  const recorrentes = checklistItensIniciais
    .map((item) => ({ label: `${item.codigo} · ${item.descricao}`, value: inspecoes.filter((inspecao) => inspecao.respostas[item.id]?.status === "NOK").length }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Tela 7</p>
        <h2 className="text-2xl font-bold text-linha-blue">Dashboard operacional</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <DashMetric label="Inspeções hoje" value={inspecoes.filter((item) => item.data === today).length} />
        <DashMetric label="Itens verificados" value={totalItens} />
        <DashMetric label="OK" value={ok} />
        <DashMetric label="NOK" value={nok} danger />
        <DashMetric label="N/A" value={na} />
        <DashMetric label="Pendentes" value={pendentes} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <BarPanel title="NOK por estação" rows={nokPorEstacao} />
        <BarPanel title="NOK por categoria" rows={nokPorCategoria} />
        <BarPanel title="Itens mais recorrentes com NOK" rows={recorrentes} />
        <div className="rounded-lg bg-white p-4 shadow-panel">
          <h3 className="mb-3 text-lg font-bold text-linha-blue">Última inspeção por estação</h3>
          <div className="space-y-2">
            {estacoesIniciais.map((station) => {
              const last = inspecoes.filter((inspecao) => inspecao.estacao_id === station.id).sort((a, b) => b.id.localeCompare(a.id))[0];
              return (
                <div key={station.id} className="flex justify-between rounded bg-slate-100 p-3 text-sm">
                  <span className="font-bold text-linha-blue">{station.nome}</span>
                  <span className="text-slate-600">{last ? `${last.data} · ${last.status}` : "Sem registro"}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashMetric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={danger ? "text-3xl font-black text-red-600" : "text-3xl font-black text-linha-blue"}>{value}</p>
    </div>
  );
}

function BarPanel({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <h3 className="mb-3 text-lg font-bold text-linha-blue">{title}</h3>
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-slate-500">Sem NOK registrado.</p>}
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="line-clamp-1 font-semibold text-slate-700">{row.label}</span>
              <span className="font-bold text-linha-blue">{row.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-linha-orange" style={{ width: `${(row.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
