"use client";

import { ClipboardCheck, FolderOpen, LayoutDashboard, UserMinus, UsersRound } from "lucide-react";
import type { Usuario } from "@/types";

type HomeAction = "estacoes" | "ausencia" | "efetivo" | "dashboardEfetivo" | "registros";

export function HomeMenu({ user, onOpen }: { user: Usuario; onOpen: (action: HomeAction) => void }) {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Início</p>
        <h2 className="text-2xl font-bold text-linha-blue">Olá, {user.nome}</h2>
      </div>
      <div className="grid gap-3">
        <MenuButton title="Checklist" description="Escolher estação e iniciar checklist de pré-abertura." icon={ClipboardCheck} onClick={() => onOpen("estacoes")} />
        <MenuButton title="Registrar ausência" description="Informar falta ou banco de horas de colaborador." icon={UserMinus} onClick={() => onOpen("ausencia")} />
        <MenuButton title="Distribuição" description="Lançar o efetivo diário por estação." icon={UsersRound} onClick={() => onOpen("efetivo")} />
        <MenuButton title="Dashboard Efetivo" description="Seguir para a visualização geral do efetivo lançado." icon={LayoutDashboard} onClick={() => onOpen("dashboardEfetivo")} />
        <MenuButton title="Registros salvos" description="Visualizar checklists e ausências salvas." icon={FolderOpen} onClick={() => onOpen("registros")} />
      </div>
    </section>
  );
}

function MenuButton({ title, description, icon: Icon, onClick }: { title: string; description: string; icon: React.ElementType; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex min-h-28 items-center gap-4 rounded-lg bg-white p-5 text-left shadow-panel ring-1 ring-slate-200 hover:ring-linha-orange">
      <Icon className="h-9 w-9 shrink-0 text-linha-orange" />
      <span>
        <strong className="block text-2xl text-linha-blue">{title}</strong>
        <span className="mt-1 block text-sm font-semibold text-slate-600">{description}</span>
      </span>
    </button>
  );
}
