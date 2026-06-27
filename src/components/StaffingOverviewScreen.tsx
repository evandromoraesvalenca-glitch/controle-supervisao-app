"use client";

import * as React from "react";
import { RefreshCw, UsersRound } from "lucide-react";
import { estacoesIniciais } from "@/lib/checklist-data";
import { fetchLevantamentosEfetivo } from "@/lib/storage";
import { nowDate } from "@/lib/utils";
import type { LevantamentoEfetivo } from "@/types";

function toDateTime(registro: LevantamentoEfetivo) {
  const hora = String(registro.hora_preenchimento || "00:00").slice(0, 5);
  return new Date(`${registro.data_referencia}T${hora}:00`);
}

export function StaffingOverviewScreen() {
  const [registros, setRegistros] = React.useState<LevantamentoEfetivo[]>([]);
  const [inicioData, setInicioData] = React.useState(nowDate());
  const [inicioHora, setInicioHora] = React.useState("00:00");
  const [fimData, setFimData] = React.useState(nowDate());
  const [fimHora, setFimHora] = React.useState("23:59");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const refresh = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setRegistros(await fetchLevantamentosEfetivo());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível carregar os dados do Supabase.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const inicio = new Date(`${inicioData}T${inicioHora}:00`);
  const fim = new Date(`${fimData}T${fimHora}:00`);
  const registrosPeriodo = registros.filter((registro) => {
    const dataHora = toDateTime(registro);
    return dataHora >= inicio && dataHora <= fim;
  });

  const porEstacao = estacoesIniciais.map((estacao) => {
    const rows = registrosPeriodo.filter((registro) => registro.estacao === estacao.nome);
    const las = rows.reduce((sum, registro) => sum + registro.lideres, 0);
    const aas = rows.reduce((sum, registro) => sum + registro.aas, 0);
    const aa = rows.reduce((sum, registro) => sum + registro.aa, 0);
    return { id: estacao.id, nome: estacao.nome, las, aas, aa, total: las + aas + aa };
  });

  const totais = porEstacao.reduce(
    (acc, estacao) => ({ las: acc.las + estacao.las, aas: acc.aas + estacao.aas, aa: acc.aa + estacao.aa, total: acc.total + estacao.total }),
    { las: 0, aas: 0, aa: 0, total: 0 }
  );

  return (
    <section className="space-y-4">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-linha-orange">Efetivo operacional</p>
            <h2 className="mt-1 text-2xl font-black text-linha-blue">Visualização Geral do Efetivo</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Quantidade de profissionais por estação no período selecionado.</p>
          </div>
          <button onClick={refresh} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-linha-blue text-white" title="Atualizar dados">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <FilterField label="Data inicial" type="date" value={inicioData} onChange={setInicioData} />
          <FilterField label="Hora inicial" type="time" value={inicioHora} onChange={setInicioHora} />
          <FilterField label="Data final" type="date" value={fimData} onChange={setFimData} />
          <FilterField label="Hora final" type="time" value={fimHora} onChange={setFimHora} />
        </div>
      </section>

      {isLoading && <div className="h-48 animate-pulse rounded-lg bg-white shadow-sm" />}
      {error && !isLoading && <div className="rounded-lg bg-red-50 p-4 text-sm font-bold text-red-700">Não foi possível carregar o dashboard: {error}</div>}

      {!isLoading && !error && (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px_54px] gap-1 bg-slate-100 px-2 py-3 text-center text-xs font-black uppercase text-slate-500 sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_90px] sm:px-3">
            <span className="text-left">Estação</span><span>LAS</span><span>AAS</span><span>AA</span><span>Total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {porEstacao.map((estacao) => (
              <article key={estacao.id} className="grid min-h-14 grid-cols-[minmax(0,1fr)_44px_44px_44px_54px] items-center gap-1 px-2 py-2 text-center sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_90px] sm:px-3">
                <div className="flex min-w-0 items-center gap-2 text-left">
                  <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-orange-50 text-linha-orange sm:grid"><UsersRound className="h-4 w-4" /></span>
                  <strong className="min-w-0 text-sm text-linha-blue">{estacao.nome}</strong>
                </div>
                <strong className="text-sm text-slate-700">{estacao.las}</strong>
                <strong className="text-sm text-slate-700">{estacao.aas}</strong>
                <strong className="text-sm text-slate-700">{estacao.aa}</strong>
                <strong className="text-base text-linha-blue">{estacao.total}</strong>
              </article>
            ))}
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_44px_44px_44px_54px] items-center gap-1 border-t-2 border-linha-orange bg-linha-blue px-2 py-4 text-center text-white sm:grid-cols-[minmax(0,1fr)_80px_80px_80px_90px] sm:px-3">
            <strong className="text-left text-xs uppercase sm:text-sm">Total geral</strong>
            <strong>{totais.las}</strong><strong>{totais.aas}</strong><strong>{totais.aa}</strong><strong className="text-lg text-orange-300">{totais.total}</strong>
          </div>
        </section>
      )}
    </section>
  );
}

function FilterField({ label, type, value, onChange }: { label: string; type: "date" | "time"; value: string; onChange: (value: string) => void }) {
  return <label className="block"><span className="text-xs font-bold text-slate-600">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm font-semibold text-linha-blue" /></label>;
}
