"use client";

import * as React from "react";
import { Save, UserMinus } from "lucide-react";
import { saveAusencia } from "@/lib/storage";
import type { Ausencia, Usuario } from "@/types";

const tiposAusencia: Array<{ value: Ausencia["tipo"]; label: string }> = [
  { value: "falta", label: "Falta" },
  { value: "banco-de-horas", label: "Banco de horas" },
  { value: "atestado", label: "Atestado" },
  { value: "home-office", label: "Home office" }
];

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

export function AbsenceScreen({ user }: { user: Usuario }) {
  const [message, setMessage] = React.useState("");

  return (
    <section className="mx-auto max-w-3xl rounded-lg bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-100 text-linha-orange">
          <UserMinus className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase text-linha-orange">Registro</p>
          <h2 className="text-2xl font-bold text-linha-blue">Registrar ausência</h2>
        </div>
      </div>
      <form
        className="grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const ausencia = {
            id: crypto.randomUUID(),
            colaborador: String(form.get("colaborador") || ""),
            tipo: form.get("tipo") as Ausencia["tipo"],
            registrado_por: user.nome,
            registrado_em: new Date().toISOString()
          };
          try {
            await saveAusencia(ausencia);
            setMessage("Registro salvo.");
          } catch (error) {
            setMessage(`Não foi possível salvar no Supabase: ${getErrorMessage(error)}`);
          }
        }}
      >
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nome do colaborador</span>
          <input name="colaborador" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Tipo de registro</span>
          <select name="tipo" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3">
            {tiposAusencia.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
            ))}
          </select>
        </label>
        <button className="flex h-14 items-center justify-center gap-2 rounded-lg bg-linha-orange text-lg font-bold text-white">
          <Save className="h-5 w-5" />
          Salvar registro
        </button>
        {message && <p className="rounded-lg bg-green-50 p-3 text-sm font-bold text-green-800">{message}</p>}
      </form>
    </section>
  );
}

