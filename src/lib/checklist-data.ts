import type { ChecklistItem, Estacao } from "@/types";

export const estacoesIniciais: Estacao[] = [
  { id: "joao-paulo-i", nome: "João Paulo I", ativa: true },
  { id: "freguesia-do-o", nome: "Freguesia do Ó", ativa: true },
  { id: "santa-marina", nome: "Santa Marina", ativa: true },
  { id: "agua-branca", nome: "Água Branca", ativa: true },
  { id: "sesc-pompeia", nome: "SESC Pompeia", ativa: true },
  { id: "perdizes", nome: "Perdizes", ativa: true }
];

const item = (
  codigo: string,
  categoria: string,
  descricao: string,
  controle_especifico: string,
  aplicavel_operacao_parcial = true
): ChecklistItem => ({
  id: `${categoria}-${codigo}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-"),
  codigo,
  categoria,
  descricao,
  controle_especifico,
  aplicavel_operacao_parcial,
  ativo: true
});

const faixa = (prefixo: string, inicio: number, fim: number, largura = 2) =>
  Array.from({ length: fim - inicio + 1 }, (_, index) => `${prefixo}${String(inicio + index).padStart(largura, "0")}`);

export const checklistItensIniciais: ChecklistItem[] = [
  ...faixa("EL", 1, 6).map((codigo) =>
    item(
      codigo,
      "Elevadores",
      "Verificar funcionamento, interfones e displays internos e externos, botões e limpeza",
      "Funcionamento, comunicação, displays, botões e limpeza",
      !["EL04", "EL05", "EL06"].includes(codigo)
    )
  ),
  ...faixa("ER", 1, 21).map((codigo) =>
    item(
      codigo,
      "Escadas Rolantes",
      "Verificar funcionamento, corrimãos, pentes, degraus, limpeza e ruídos",
      "Funcionamento, corrimãos, pentes, degraus, limpeza e ruídos"
    )
  ),
  ...faixa("BL", 1, 15).map((codigo) =>
    item(codigo, "Bloqueios / Painéis", "Verificar funcionamento, limpeza e qualquer dano", "Funcionamento, limpeza e danos")
  ),
  item("BL16 PCD", "Bloqueios / Painéis", "Verificar funcionamento, limpeza e qualquer dano", "Acessibilidade, funcionamento, limpeza e danos"),
  item("PFP", "Portas de Plataforma 1", "Verificar travamento, limpeza e dano", "Travamento, limpeza e danos"),
  item("PSE", "Portas de Plataforma 1", "Verificar travamento, limpeza e dano", "Travamento, limpeza e danos"),
  item("PDM 02-23", "Portas de Plataforma 1", "Verificar abertura, limpeza e dano", "Abertura, limpeza e danos"),
  item("PDM 01-24", "Portas de Plataforma 1", "Verificar abertura, limpeza e dano", "Abertura, limpeza e danos"),
  item("PSV", "Portas de Plataforma 1", "Verificar fechamento e limpeza", "Fechamento e limpeza"),
  item("PCM", "Portas de Plataforma 1", "Verificar funcionamento", "Funcionamento", false),
  item("Radar", "Portas de Plataforma 1", "Verificar funcionamento", "Funcionamento", false),
  item("PFP", "Portas de Plataforma 2", "Verificar funcionamento, limpeza, obstáculo e dano", "Funcionamento, limpeza, obstáculos e danos"),
  item("PSE", "Portas de Plataforma 2", "Verificar funcionamento, limpeza, obstáculo e dano", "Funcionamento, limpeza, obstáculos e danos"),
  item("PDM 02-23", "Portas de Plataforma 2", "Verificar abertura, limpeza e dano", "Abertura, limpeza e danos"),
  item("PDM 01-24", "Portas de Plataforma 2", "Verificar fechamento, limpeza e dano", "Fechamento, limpeza e danos"),
  item("PSV", "Portas de Plataforma 2", "Verificar travamento, limpeza e dano", "Travamento, limpeza e danos"),
  item("PCM", "Portas de Plataforma 2", "Verificar fechamento e limpeza", "Fechamento e limpeza", false),
  item("Radar", "Portas de Plataforma 2", "Verificar funcionamento", "Funcionamento", false),
  item("IL01", "Iluminação", "Salas Operacionais", "Verificar funcionamento"),
  item("IL02", "Iluminação", "Circulação Interna", "Verificar funcionamento"),
  item("IL03", "Iluminação", "Circulação Externa", "Verificar funcionamento"),
  item("INC01", "Dispositivos de Detecção e Combate a Incêndio", "Hidrantes", "Verificar funcionamento, lacre intacto e danos"),
  item("INC02", "Dispositivos de Detecção e Combate a Incêndio", "Extintores", "Verificar funcionamento e qualquer dano"),
  item("INC03", "Dispositivos de Detecção e Combate a Incêndio", "Dispositivo de Acionamento Manual", "Verificar funcionamento e qualquer dano"),
  item("SS01", "Saúde e Segurança", "Rota de evacuação", "Verificar se está livre de obstruções"),
  item("SS02", "Saúde e Segurança", "Sinalização de saída de emergência", "Verificar aparência e iluminação"),
  item("SS03", "Saúde e Segurança", "Portas de saída de emergência", "Verificar se não estão trancadas"),
  item("AMB01", "Ambiente Geral da Estação", "Forro de teto", "Verificar revestimento faltando, descolando, infiltração e limpeza"),
  item("AMB02", "Ambiente Geral da Estação", "Portas e portões da área pública", "Verificar conservação, funcionamento e limpeza"),
  item("AMB03", "Ambiente Geral da Estação", "Revestimentos de paredes", "Verificar revestimento faltando, descolando, infiltração e limpeza"),
  item("AMB04", "Ambiente Geral da Estação", "Lixeiras, porta-maca e bancos", "Verificar condição e limpeza"),
  item("AMB05", "Ambiente Geral da Estação", "Escadas fixas, corrimãos e guarda-corpos", "Verificar condição e limpeza"),
  item("AMB06", "Ambiente Geral da Estação", "Cerâmicas de piso interno", "Verificar revestimento faltando, descolando, infiltração e limpeza"),
  item("AMB07", "Ambiente Geral da Estação", "Pisos da área pública, piso tátil, rampas e grelhas", "Verificar revestimento faltando, descolando, infiltração e limpeza"),
  item("AMB08", "Ambiente Geral da Estação", "Comunicação visual", "Verificar conservação e limpeza"),
  item("AMB09", "Ambiente Geral da Estação", "Sistema de sonorização PAS e multimídia PIS", "Verificar funcionamento do sistema"),
  item("AMB10", "Ambiente Geral da Estação", "Pontos comerciais", "Verificar integridade, segurança e limpeza"),
  item("AMB11", "Ambiente Geral da Estação", "Sanitários públicos", "Verificar conservação, limpeza, torneiras, papel higiênico, sabonete e local"),
  item("AMB12", "Ambiente Geral da Estação", "CFTV", "Verificar funcionamento do sistema"),
  item("AMB13", "Ambiente Geral da Estação", "Bodycams", "Verificar funcionamento e integridade dos itens", false),
  item("AMB14", "Ambiente Geral da Estação", "Rádios TETRA", "Verificar funcionamento e integridade"),
  item("AMB15", "Ambiente Geral da Estação", "Temperatura da área / A/C", "Verificar ventilação, qualidade e temperatura do ar", false),
  item("QR01", "Máquinas de Autoatendimento de Vendas de QR Code", "Máquinas de autoatendimento de vendas de QR Code", "Verificar funcionamento", false),
  item("OPA01", "Operação Parcial Assistida", "Tapumes", "Verificar limpeza, dano, integridade da estrutura, fixação, ausência de frestas e riscos de queda"),
  item("OPA02", "Operação Parcial Assistida", "Sinalização provisória", "Verificar posicionamento, limpeza, integridade, visibilidade, legibilidade e coerência com os fluxos operacionais temporários"),
  item("OPA03", "Operação Parcial Assistida", "Sinal luminoso para embarque", "Verificar limpeza, dano e funcionamento"),
  item("OPA04", "Operação Parcial Assistida", "Responsável EPC", "Confirmar prontidão para a operação do lado da obra"),
  item("OPA05", "Operação Parcial Assistida", "Ventilação principal", "Verificar funcionamento do PCL e alarmes"),
  item("DF01", "Direcionadores de Fluxo", "Direcionadores de fluxos", "Verificar posicionamento correto, integridade, segregação adequada dos fluxos, visibilidade para os passageiros e ausência de obstáculos")
];

export const categorias = Array.from(new Set(checklistItensIniciais.map((checklistItem) => checklistItem.categoria)));

type StationProfile = {
  elevadores: { total: number; indisponiveisOpa: string[] };
  escadasRolantes: { total: number; indisponiveisOpa: string[] };
  bloqueios: string[];
  incluirDce?: boolean;
};

export const perfisChecklistPorEstacao: Record<string, StationProfile> = {
  "agua-branca": {
    elevadores: { total: 4, indisponiveisOpa: ["EL03", "EL04"] },
    escadasRolantes: { total: 34, indisponiveisOpa: ["ER01", "ER07", "ER09", "ER11", "ER12", "ER14", "ER21", "ER22", "ER23", "ER24", "ER25", "ER26", "ER27", "ER28", "ER29", "ER30", "ER31", "ER32", "ER33", "ER34"] },
    bloqueios: [...faixa("BL", 1, 6), "BL07 PCD", "BL08 PCD"],
    incluirDce: true
  },
  "freguesia-do-o": {
    elevadores: { total: 10, indisponiveisOpa: ["EL05", "EL06", "EL07", "EL08", "EL09", "EL10"] },
    escadasRolantes: { total: 21, indisponiveisOpa: ["ER05", "ER08", "ER11", "ER14", "ER17", "ER20", "ER21"] },
    bloqueios: [...faixa("BL", 1, 10), "BL11 PCD", "BL12 PCD"]
  },
  "joao-paulo-i": {
    elevadores: { total: 5, indisponiveisOpa: ["EL04", "EL05"] },
    escadasRolantes: { total: 19, indisponiveisOpa: [] },
    bloqueios: [...faixa("BL", 1, 10), "BL11 PCD", "BL12 PCD"]
  },
  perdizes: {
    elevadores: { total: 5, indisponiveisOpa: ["EL04", "EL05"] },
    escadasRolantes: { total: 12, indisponiveisOpa: [] },
    bloqueios: [...faixa("BL", 1, 8), "BL09 PCD", "BL10 PCD"]
  },
  "santa-marina": {
    elevadores: { total: 6, indisponiveisOpa: ["EL03", "EL04", "EL05", "EL06"] },
    escadasRolantes: { total: 15, indisponiveisOpa: ["ER05", "ER10", "ER11", "ER12", "ER13", "ER14", "ER15"] },
    bloqueios: [...faixa("BL", 1, 12), "BL13 PCD", "BL14 PCD"]
  },
  "sesc-pompeia": {
    elevadores: { total: 6, indisponiveisOpa: ["EL04", "EL05", "EL06"] },
    escadasRolantes: { total: 21, indisponiveisOpa: ["ER02", "ER04", "ER14", "ER15", "ER16", "ER17", "ER18", "ER19", "ER20", "ER21"] },
    bloqueios: [...faixa("BL", 1, 15), "BL16 PCD"]
  }
};

function itensVariaveisDaEstacao(estacaoId: string) {
  const perfil = perfisChecklistPorEstacao[estacaoId];
  if (!perfil) return checklistItensIniciais;

  const elevadores = faixa("EL", 1, perfil.elevadores.total).map((codigo) =>
    item(
      codigo,
      "Elevadores",
      "Verificar funcionamento, interfones e displays internos e externos, botões e limpeza",
      "Funcionamento, comunicação, displays, botões e limpeza",
      !perfil.elevadores.indisponiveisOpa.includes(codigo)
    )
  );

  const escadas = faixa("ER", 1, perfil.escadasRolantes.total).map((codigo) =>
    item(
      codigo,
      "Escadas Rolantes",
      "Verificar funcionamento, corrimãos, pentes, degraus, limpeza e ruídos",
      "Funcionamento, corrimãos, pentes, degraus, limpeza e ruídos",
      !perfil.escadasRolantes.indisponiveisOpa.includes(codigo)
    )
  );

  const bloqueios = perfil.bloqueios.map((codigo) =>
    item(codigo, "Bloqueios / Painéis", "Verificar funcionamento, limpeza e qualquer dano", codigo.includes("PCD") ? "Acessibilidade, funcionamento, limpeza e danos" : "Funcionamento, limpeza e danos")
  );

  const fixos = checklistItensIniciais.filter(
    (checklistItem) => !["Elevadores", "Escadas Rolantes", "Bloqueios / Painéis"].includes(checklistItem.categoria)
  );

  const dce = perfil.incluirDce
    ? [item("DCE01", "Dispositivo de Contagem Eletrônica (DCE)", "Câmeras", "Inspecionar condições gerais, limpeza, desgastes, anomalias, nitidez, foco e clareza das imagens", false)]
    : [];

  return [...elevadores, ...escadas, ...bloqueios, ...fixos, ...dce];
}

export function getChecklistItensPorEstacao(estacaoId: string) {
  return itensVariaveisDaEstacao(estacaoId);
}
