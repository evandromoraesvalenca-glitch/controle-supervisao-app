"use client";

import * as React from "react";
import { Save, UsersRound } from "lucide-react";
import { estacoesIniciais } from "@/lib/checklist-data";
import { fetchLevantamentosEfetivo, saveLevantamentoEfetivo } from "@/lib/storage";
import type { LevantamentoEfetivo, Usuario } from "@/types";

const supervisores = ["Evandro", "Lucas", "Ana", "Audrey", "Dackson", "A definir"];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    return [record.message, record.details, record.hint, record.code]
      .filter(Boolean)
      .map(String)
      .join(" | ") || JSON.stringify(record);
  }
  return String(error || "Erro desconhecido");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function StaffingScreen({ user }: { user: Usuario }) {
  const [registros, setRegistros] = React.useState<LevantamentoEfetivo[]>([]);
  const [lideres, setLideres] = React.useState(0);
  const [aas, setAas] = React.useState(0);
  const [aa, setAa] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const total = lideres + aas + aa;

  React.useEffect(() => {
    fetchLevantamentosEfetivo().then(setRegistros);
  }, []);

  const registrosHoje = registros.filter((item) => item.data_referencia === today());
  const totalHoje = registrosHoje.reduce((sum, item) => sum + item.efetivo_total, 0);
  const totalLideres = registrosHoje.reduce((sum, item) => sum + item.lideres, 0);
  const totalAas = registrosHoje.reduce((sum, item) => sum + item.aas, 0);
  const totalAa = registrosHoje.reduce((sum, item) => sum + item.aa, 0);
  const estacoesPreenchidas = new Set(registrosHoje.map((item) => item.estacao)).size;
  const semPreenchimento = estacoesIniciais.filter((estacao) => !registrosHoje.some((item) => item.estacao === estacao.nome));

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Distribuição</p>
        <h2 className="text-2xl font-bold text-linha-blue">Levantamento diário de efetivo</h2>
      </div>

      <form
        className="rounded-lg bg-white p-5 shadow-panel"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const supervisor = String(form.get("supervisor") || "");
          if (/marcia|márcia/i.test(supervisor)) {
            setMessage("Supervisora Márcia/Marcia não pode ser cadastrada.");
            return;
          }
          const now = new Date().toISOString();
          const registro = {
            id: crypto.randomUUID(),
            data_referencia: String(form.get("data") || today()),
            hora_preenchimento: nowTime(),
            estacao: String(form.get("estacao") || ""),
            supervisor,
            lideres,
            aas,
            aa,
            efetivo_total: total,
            observacao: String(form.get("observacao") || ""),
            usuario_id: user.id,
            criado_em: now,
            atualizado_em: now
          };
          try {
            await saveLevantamentoEfetivo(registro);
            setRegistros(await fetchLevantamentosEfetivo());
            setMessage("Lançamento salvo no Supabase.");
            setLideres(0);
            setAas(0);
            setAa(0);
          } catch (error) {
            setMessage(`Não foi possível salvar no Supabase: ${getErrorMessage(error)}`);
          }
        }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-linha-orange">
            <UsersRound className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-linha-blue">Novo lançamento</h3>
            <p className="text-sm font-semibold text-slate-500">Efetivo total calculado automaticamente.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Data</span>
            <input name="data" type="date" defaultValue={today()} required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Estação</span>
            <select name="estacao" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3">
              {estacoesIniciais.map((estacao) => <option key={estacao.id}>{estacao.nome}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Supervisor responsável</span>
            <select name="supervisor" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3">
              {supervisores.map((supervisor) => <option key={supervisor}>{supervisor}</option>)}
            </select>
          </label>
          <NumberField label="Líderes" value={lideres} onChange={setLideres} />
          <NumberField label="AAS" value={aas} onChange={setAas} />
          <NumberField label="AA" value={aa} onChange={setAa} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Observações</span>
            <textarea name="observacao" className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3" />
          </label>
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm font-semibold text-slate-500">Efetivo total</p>
            <p className="text-4xl font-black text-linha-blue">{total}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">Hora automática: {nowTime()}</p>
          </div>
        </div>
        <button className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-linha-orange text-lg font-bold text-white">
          <Save className="h-5 w-5" />
          Salvar distribuição
        </button>
        {message && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Efetivo total" value={totalHoje} />
        <Metric label="Líderes" value={totalLideres} />
        <Metric label="AAS" value={totalAas} />
        <Metric label="AA" value={totalAa} />
        <Metric label="Estações preenchidas" value={estacoesPreenchidas} />
        <Metric label="Sem preenchimento" value={semPreenchimento.length} danger />
      </div>

      <div className="rounded-lg bg-white p-4 shadow-panel">
        <h3 className="mb-3 text-lg font-bold text-linha-blue">Distribuição do dia</h3>
        <div className="space-y-2">
          {estacoesIniciais.map((estacao) => {
            const registro = registrosHoje.find((item) => item.estacao === estacao.nome);
            return (
              <div key={estacao.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-bold text-linha-blue">{estacao.nome}</p>
                {registro ? (
                  <p className="text-slate-600">Líderes {registro.lideres} · AAS {registro.aas} · AA {registro.aa} · Total {registro.efetivo_total} · {registro.supervisor} · {registro.hora_preenchimento}</p>
                ) : (
                  <p className="font-semibold text-amber-700">Sem preenchimento</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input type="number" min={0} step={1} value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value || 0)))} className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
    </label>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-panel">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={danger ? "text-3xl font-black text-red-600" : "text-3xl font-black text-linha-blue"}>{value}</p>
    </div>
  );
}

