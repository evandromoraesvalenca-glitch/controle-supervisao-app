"use client";

import { ArrowLeft, LogOut, TrainFront } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import type { Usuario } from "@/types";

type Tab = "inicio" | "estacoes" | "ausencia" | "efetivo" | "dashboardEfetivo" | "registros" | "historico" | "dashboard" | "admin";

export function AppShell({
  active,
  user,
  onNavigate,
  onLogout,
  children
}: {
  active: Tab;
  user: Usuario;
  onNavigate: (tab: Tab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur no-print">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <LogoMark compact />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-linha-orange">
              <TrainFront className="h-4 w-4" />
              Linha 6
            </div>
            <h1 className="truncate text-lg font-bold text-linha-blue sm:text-2xl">Controle-Supervisão</h1>
          </div>
          <div className="hidden text-right text-sm sm:block">
            <p className="font-semibold text-linha-blue">{user.nome}</p>
            <p className="text-slate-500">RE {user.re} · {user.perfil}</p>
          </div>
          <button onClick={onLogout} className="rounded-lg p-3 text-slate-600 hover:bg-slate-100" title="Sair">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-5 sm:py-8">
        {active !== "inicio" && (
          <button
            onClick={() => onNavigate("inicio")}
            className="mb-4 flex h-12 items-center gap-2 rounded-lg bg-white px-4 font-bold text-linha-blue shadow-panel ring-1 ring-slate-200 no-print"
          >
            <ArrowLeft className="h-5 w-5 text-linha-orange" />
            Voltar ao menu principal
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
