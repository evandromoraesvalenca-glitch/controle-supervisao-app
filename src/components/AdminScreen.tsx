"use client";

import * as React from "react";
import { Edit3, Plus, ToggleRight } from "lucide-react";
import { checklistItensIniciais, estacoesIniciais } from "@/lib/checklist-data";

export function AdminScreen() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase text-linha-orange">Área administrativa</p>
        <h2 className="text-2xl font-bold text-linha-blue">Configurações da plataforma</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Estações" description="Cadastrar, editar ou desativar estações.">
          <ActionButton label="Cadastrar estação" />
          {estacoesIniciais.map((station) => (
            <div key={station.id} className="flex items-center justify-between rounded bg-slate-100 p-3">
              <span className="font-bold text-linha-blue">{station.nome}</span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-green-100 px-2 py-1 text-xs font-bold text-green-800">Ativa</span>
                <Edit3 className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          ))}
        </AdminPanel>
        <AdminPanel title="Itens do checklist" description="Cadastrar, editar, desativar e aplicar itens por estação.">
          <ActionButton label="Cadastrar item" />
          <div className="max-h-96 space-y-2 overflow-auto pr-1">
            {checklistItensIniciais.map((item) => (
              <div key={item.id} className="rounded bg-slate-100 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-linha-blue px-2 py-1 text-xs font-bold text-white">{item.codigo}</span>
                  <span className="text-sm font-bold text-linha-blue">{item.categoria}</span>
                  {!item.aplicavel_operacao_parcial && <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Indisponível OPA</span>}
                  <Edit3 className="ml-auto h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.descricao}</p>
              </div>
            ))}
          </div>
        </AdminPanel>
        <AdminPanel title="Usuários e perfis" description="Gerenciar usuários, RE, status ativo e perfil de acesso.">
          <ActionButton label="Adicionar usuário" />
          {["Supervisor", "CCO", "Coordenação/Gerência"].map((perfil) => (
            <div key={perfil} className="rounded bg-slate-100 p-3">
              <p className="font-bold text-linha-blue">{perfil}</p>
              <p className="text-sm text-slate-600">{perfil === "Coordenação/Gerência" ? "Acompanha tudo e reabre inspeções finalizadas." : perfil === "Supervisor" ? "Inicia, finaliza, consulta e anexa fotos." : "Acompanha histórico, dashboard e registros operacionais."}</p>
            </div>
          ))}
        </AdminPanel>
        <AdminPanel title="Regras operacionais" description="Definir itens aplicáveis por estação e indisponíveis na operação parcial assistida.">
          <ActionButton label="Configurar aplicabilidade" />
          <div className="space-y-2 text-sm text-slate-700">
            <p className="rounded bg-slate-100 p-3">Itens EL04, EL05, EL06, PCM, Radar, Bodycams, Temperatura/A-C e QR Code iniciam como indisponíveis na operação parcial.</p>
            <p className="rounded bg-slate-100 p-3">Escadas rolantes podem ser configuradas individualmente por estação na tabela checklist_itens_estacoes.</p>
          </div>
        </AdminPanel>
      </div>
    </section>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="mb-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-linha-blue bg-white font-bold text-linha-blue">
      {label.includes("Configurar") ? <ToggleRight className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      {label}
    </button>
  );
}

function AdminPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg bg-white p-4 shadow-panel">
      <h3 className="text-lg font-bold text-linha-blue">{title}</h3>
      <p className="mb-4 text-sm text-slate-600">{description}</p>
      <div className="space-y-2">{children}</div>
    </article>
  );
}

