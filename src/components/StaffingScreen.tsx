"use client";

import * as React from "react";
import { Save, UsersRound } from "lucide-react";
import { estacoesIniciais } from "@/lib/checklist-data";
import { calculateStaffingTotal, normalizeStaffingCount } from "@/lib/staffing";
import { fetchLevantamentosEfetivo, saveLevantamentoEfetivo } from "@/lib/storage";
import type { LevantamentoEfetivo, Usuario } from "@/types";

const supervisores = ["Evandro", "Lucas", "Ana", "Audrey", "Dackson", "Junior", "Marta", "A definir"];

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
  const [lideres, setLideres] = React.useState("");
  const [aas, setAas] = React.useState("");
  const [aa, setAa] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const total = calculateStaffingTotal(lideres, aas, aa);

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

  async function refreshRegistros() {
    setRegistros(await fetchLevantamentosEfetivo());
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase text-linha-orange">Distribuição</p>
        <h2 className="text-xl font-bold text-linha-blue sm:text-2xl">Lançamento de efetivo</h2>
      </div>

      <form
        className="rounded-lg bg-white p-4 shadow-panel"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const supervisor = String(form.get("supervisor") || "");
          const lideresInformados = normalizeStaffingCount(form.get("lideres"));
          const aasInformados = normalizeStaffingCount(form.get("aas"));
          const aaInformados = normalizeStaffingCount(form.get("aa"));
          const totalInformado = calculateStaffingTotal(lideresInformados, aasInformados, aaInformados);

          if (totalInformado === 0) {
            setMessage("Informe pelo menos uma pessoa antes de salvar o lançamento.");
            return;
          }

          const now = new Date().toISOString();
          const registro: LevantamentoEfetivo = {
            id: crypto.randomUUID(),
            data_referencia: String(form.get("data") || today()),
            hora_preenchimento: String(form.get("hora") || nowTime()),
            estacao: String(form.get("estacao") || ""),
            supervisor,
            lideres: lideresInformados,
            aas: aasInformados,
            aa: aaInformados,
            efetivo_total: totalInformado,
            observacao: String(form.get("observacao") || ""),
            usuario_id: user.id,
            criado_em: now,
            atualizado_em: now
          };
          try {
            setIsSaving(true);
            setMessage("");
            await saveLevantamentoEfetivo(registro);
            await refreshRegistros();
            setMessage(`Registro salvo. Efetivo total: ${totalInformado}.`);
            setLideres("");
            setAas("");
            setAa("");
          } catch (error) {
            setMessage(`Não foi possível salvar no Supabase: ${getErrorMessage(error)}`);
          } finally {
            setIsSaving(false);
          }
        }}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-orange-100 text-linha-orange">
            <UsersRound className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-linha-blue">Novo lançamento</h3>
            <p className="text-xs font-semibold text-slate-500">Informe data, horário e efetivo da estação.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Data</span>
            <input name="data" type="date" defaultValue={today()} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Horário</span>
            <input name="hora" type="time" defaultValue={nowTime()} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Estação</span>
            <select name="estacao" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {estacoesIniciais.map((estacao) => <option key={estacao.id}>{estacao.nome}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Supervisor</span>
            <select name="supervisor" required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {supervisores.map((supervisor) => <option key={supervisor}>{supervisor}</option>)}
            </select>
          </label>
          <NumberField name="lideres" label="LAS" value={lideres} onChange={setLideres} />
          <NumberField name="aas" label="AAS" value={aas} onChange={setAas} />
          <NumberField name="aa" label="AA" value={aa} onChange={setAa} />
          <div className="rounded-lg bg-slate-100 p-3">
            <p className="text-xs font-semibold text-slate-500">Efetivo total</p>
            <p className="text-3xl font-black text-linha-blue">{total}</p>
          </div>
        </div>
        <label className="mt-3 block">
          <span className="text-sm font-semibold text-slate-700">Observações</span>
          <textarea name="observacao" className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-3 text-sm" />
        </label>
        <button disabled={isSaving} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-linha-orange text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">
          <Save className="h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
        {message && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Efetivo total" value={totalHoje} />
        <Metric label="LAS" value={totalLideres} />
        <Metric label="AAS" value={totalAas} />
        <Metric label="AA" value={totalAa} />
        <Metric label="Estações preenchidas" value={estacoesPreenchidas} />
        <Metric label="Sem preenchimento" value={semPreenchimento.length} danger />
      </div>
    </section>
  );
}

function NumberField({ name, label, value, onChange }: { name: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input name={name} inputMode="numeric" type="number" min={0} step={1} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
    </label>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-panel">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={danger ? "text-2xl font-black text-red-600" : "text-2xl font-black text-linha-blue"}>{value}</p>
    </div>
  );
}
