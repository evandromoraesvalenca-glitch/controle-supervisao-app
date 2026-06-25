"use client";

import * as React from "react";
import { ClipboardCheck, UserMinus } from "lucide-react";
import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { downloadInspectionPdf } from "@/lib/exporters";
import { fetchAusencias, fetchInspecoes, fetchLevantamentosEfetivo } from "@/lib/storage";
import { formatDate, summarize } from "@/lib/utils";
import type { Ausencia, Inspecao, LevantamentoEfetivo } from "@/types";

export function SavedRecordsScreen() {
  const [inspecoes, setInspecoes] = React.useState<Inspecao[]>([]);
  const [ausencias, setAusencias] = React.useState<Ausencia[]>([]);
  const [efetivo, setEfetivo] = React.useState<LevantamentoEfetivo[]>([]);

  React.useEffect(() => {
    fetchInspecoes().then(setInspecoes);
    fetchAusencias().then(setAusencias);
    fetchLevantamentosEfetivo().then(setEfetivo);
  }, []);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Consulta</p>
        <h2 className="text-2xl font-bold text-linha-blue">Registros salvos</h2>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Distribuição de efetivo</h3>
        </div>
        <div className="space-y-3">
          {efetivo.length === 0 && <p className="font-semibold text-slate-500">Nenhum lançamento de efetivo salvo.</p>}
          {efetivo.map((registro) => (
            <article key={registro.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-bold text-linha-blue">{registro.estacao}</p>
              <p className="text-sm text-slate-600">
                {new Date(`${registro.data_referencia}T00:00:00`).toLocaleDateString("pt-BR")} · {registro.supervisor} · Líderes {registro.lideres} · AAS {registro.aas} · AA {registro.aa} · Total {registro.efetivo_total}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Checklists</h3>
        </div>
        <div className="space-y-3">
          {inspecoes.length === 0 && <p className="font-semibold text-slate-500">Nenhum checklist salvo.</p>}
          {inspecoes.map((inspecao) => {
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
      </div>

      <div className="rounded-lg bg-white p-4 shadow-panel">
        <div className="mb-3 flex items-center gap-2">
          <UserMinus className="h-5 w-5 text-linha-orange" />
          <h3 className="text-lg font-bold text-linha-blue">Ausências</h3>
        </div>
        <div className="space-y-3">
          {ausencias.length === 0 && <p className="font-semibold text-slate-500">Nenhuma ausência registrada.</p>}
          {ausencias.map((ausencia) => (
            <article key={ausencia.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-bold text-linha-blue">{ausencia.colaborador}</p>
              <p className="text-sm text-slate-600">
                {ausencia.tipo === "falta" ? "Falta" : "Banco de horas"} · {new Date(ausencia.registrado_em).toLocaleString("pt-BR")} · {ausencia.registrado_por}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
