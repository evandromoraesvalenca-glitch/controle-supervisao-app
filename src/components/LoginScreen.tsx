"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import type { Usuario } from "@/types";

export function LoginScreen({ onLogin }: { onLogin: (user: Usuario) => void }) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onLogin({
      id: crypto.randomUUID(),
      nome: String(data.get("nome") || "Responsável Operacional"),
      email: "",
      re: String(data.get("re") || ""),
      perfil: String(data.get("perfil") || "supervisor") as Usuario["perfil"],
      ativo: true
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linha-blue px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg bg-white p-6 shadow-panel sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <LogoMark />
          <div>
            <p className="text-sm font-semibold text-linha-orange">Linha 6</p>
            <h1 className="text-2xl font-bold text-linha-blue">Acesso operacional</h1>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nome do responsável</span>
            <input name="nome" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">RE</span>
            <input name="re" required className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3" />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Perfil</span>
            <select name="perfil" className="mt-1 h-12 w-full rounded-lg border border-slate-300 px-3">
              <option value="supervisor">Supervisor</option>
              <option value="cco">CCO</option>
              <option value="coordenacao-gerencia">Coordenação/Gerência</option>
            </select>
          </label>
        </div>
        <button className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-linha-orange text-base font-bold text-white">
          <ShieldCheck className="h-5 w-5" />
          Entrar e iniciar
        </button>
      </form>
    </main>
  );
}

