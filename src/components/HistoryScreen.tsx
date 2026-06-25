"use client";

import * as React from "react";
import { Download, FileText, Printer } from "lucide-react";
import { checklistItensIniciais, estacoesIniciais } from "@/lib/checklist-data";
import { downloadInspectionPdf, downloadInspectionsExcel } from "@/lib/exporters";
import { fetchInspecoes, saveInspecao } from "@/lib/storage";
import { formatDate, summarize } from "@/lib/utils";
import type { Inspecao, Usuario } from "@/types";

export function HistoryScreen({ user, refreshKey }: { user: Usuario; refreshKey: number }) {
  const [inspecoes, setInspecoes] = React.useState<Inspecao[]>([]);
  const [filters, setFilters] = React.useState({ estacao: "", data: "", responsavel: "", turno: "", status: "", nok: false });

  React.useEffect(() => {
    fetchInspecoes().then(setInspecoes);
  }, [refreshKey]);

  const filtered = inspecoes.filter((inspecao) => {
    const stats = summarize(inspecao, checklistItensIniciais);
    return (
      (!filters.estacao || inspecao.estacao_id === filters.estacao) &&
      (!filters.data || inspecao.data === filters.data) &&
      (!filters.responsavel || inspecao.responsavel_nome.toLowerCase().includes(filters.responsavel.toLowerCase())) &&
      (!filters.turno || inspecao.turno === filters.turno) &&
      (!filters.status || inspecao.status === filters.status) &&
      (!filters.nok || stats.nok > 0)
    );
  });

  function reabrir(inspecao: Inspecao) {
    const next = { ...inspecao, status: "reaberta" as const };
    saveInspecao(next);
    fetchInspecoes().then(setInspecoes);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-linha-orange">Tela 6</p>
          <h2 className="text-2xl font-bold text-linha-blue">Histórico de inspeções</h2>
        </div>
        <button onClick={() => downloadInspectionsExcel(filtered)} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-linha-blue px-4 font-bold text-white">
          <Download className="h-4 w-4" />
          Exportar Excel
        </button>
      </div>
      <div className="grid gap-3 rounded-lg bg-white p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-6">
        <select className="h-11 rounded-lg border border-slate-300 px-3" value={filters.estacao} onChange={(e) => setFilters({ ...filters, estacao: e.target.value })}>
          <option value="">Todas estações</option>
          {estacoesIniciais.map((station) => <option key={station.id} value={station.id}>{station.nome}</option>)}
        </select>
        <input type="date" className="h-11 rounded-lg border border-slate-300 px-3" value={filters.data} onChange={(e) => setFilters({ ...filters, data: e.target.value })} />
        <input placeholder="Responsável" className="h-11 rounded-lg border border-slate-300 px-3" value={filters.responsavel} onChange={(e) => setFilters({ ...filters, responsavel: e.target.value })} />
        <select className="h-11 rounded-lg border border-slate-300 px-3" value={filters.turno} onChange={(e) => setFilters({ ...filters, turno: e.target.value })}>
          <option value="">Turnos</option>
          <option>Manhã</option>
          <option>Tarde</option>
          <option>Noite</option>
          <option>Operação Parcial</option>
        </select>
        <select className="h-11 rounded-lg border border-slate-300 px-3" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Status</option>
          <option value="rascunho">Rascunho</option>
          <option value="em_andamento">Em andamento</option>
          <option value="finalizada">Finalizada</option>
          <option value="reaberta">Reaberta</option>
        </select>
        <label className="flex h-11 items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm font-semibold">
          <input type="checkbox" checked={filters.nok} onChange={(e) => setFilters({ ...filters, nok: e.target.checked })} />
          Apenas NOK
        </label>
      </div>
      <div className="space-y-3">
        {filtered.map((inspecao) => {
          const station = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
          const stats = summarize(inspecao, checklistItensIniciais);
          return (
            <article key={inspecao.id} className="rounded-lg bg-white p-4 shadow-panel">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-linha-blue">{station}</h3>
                  <p className="text-sm text-slate-600">{formatDate(inspecao.data)} · {inspecao.turno} · {inspecao.responsavel_nome} · {inspecao.status}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-sm font-bold">
                  <span className="rounded bg-green-100 px-3 py-2 text-green-800">OK {stats.ok}</span>
                  <span className="rounded bg-red-100 px-3 py-2 text-red-800">NOK {stats.nok}</span>
                  <span className="rounded bg-slate-100 px-3 py-2 text-slate-700">N/A {stats.na}</span>
                  <span className="rounded bg-amber-100 px-3 py-2 text-amber-800">Pend. {stats.pendentes.length}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => downloadInspectionPdf(inspecao)} className="flex h-11 items-center gap-2 rounded-lg bg-linha-orange px-4 font-bold text-white">
                  <FileText className="h-4 w-4" />
                  Baixar PDF
                </button>
                <button onClick={() => window.print()} className="flex h-11 items-center gap-2 rounded-lg bg-slate-200 px-4 font-bold text-linha-blue">
                  <Printer className="h-4 w-4" />
                  Imprimir
                </button>
                {inspecao.status === "finalizada" && user.perfil === "coordenacao-gerencia" && (
                  <button onClick={() => reabrir(inspecao)} className="h-11 rounded-lg border border-linha-blue px-4 font-bold text-linha-blue">
                    Reabrir
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <div className="rounded-lg bg-white p-8 text-center font-semibold text-slate-500 shadow-panel">Nenhuma inspeção encontrada.</div>}
      </div>
    </section>
  );
}

