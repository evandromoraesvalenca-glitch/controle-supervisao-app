export type Perfil = "supervisor" | "cco" | "coordenacao-gerencia";
export type Turno = "Manhã" | "Tarde" | "Noite" | "Operação Parcial";
export type StatusResposta = "OK" | "NOK" | "NA" | null;
export type StatusInspecao = "rascunho" | "em_andamento" | "finalizada" | "reaberta";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  re: string;
  perfil: Perfil | "las";
  ativo: boolean;
};

export type Estacao = {
  id: string;
  nome: string;
  ativa: boolean;
};

export type ChecklistItem = {
  id: string;
  codigo: string;
  categoria: string;
  descricao: string;
  controle_especifico: string;
  aplicavel_operacao_parcial: boolean;
  ativo: boolean;
};

export type Resposta = {
  checklist_item_id: string;
  status: StatusResposta;
  observacao: string;
  fotos: string[];
  respondido_por?: string;
  respondido_em?: string;
};

export type Inspecao = {
  id: string;
  estacao_id: string;
  usuario_id: string;
  data: string;
  horario_inicio: string;
  horario_fim?: string;
  turno: Turno;
  status: StatusInspecao;
  responsavel_nome: string;
  responsavel_re: string;
  respostas: Record<string, Resposta>;
};

export type Ausencia = {
  id: string;
  colaborador: string;
  tipo: "falta" | "banco-de-horas" | "atestado" | "home-office";
  registrado_por: string;
  registrado_em: string;
};

export type LevantamentoEfetivo = {
  id: string;
  data_referencia: string;
  hora_preenchimento: string;
  estacao: string;
  supervisor: string;
  lideres: number;
  aas: number;
  aa: number;
  efetivo_total: number;
  observacao: string;
  usuario_id: string;
  criado_em: string;
  atualizado_em: string;
};

