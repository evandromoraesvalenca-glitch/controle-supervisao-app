import type { ChecklistItem, Inspecao } from "@/types";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function nowDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function nowTime() {
  return new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

export function isAplicavel(item: ChecklistItem, inspecao: Pick<Inspecao, "turno">) {
  return inspecao.turno !== "Operação Parcial" || item.aplicavel_operacao_parcial;
}

export function summarize(inspecao: Inspecao, itens: ChecklistItem[]) {
  const aplicaveis = itens.filter((item) => isAplicavel(item, inspecao));
  const respostas = aplicaveis.map((item) => inspecao.respostas[item.id]);
  const ok = respostas.filter((resposta) => resposta?.status === "OK").length;
  const nok = respostas.filter((resposta) => resposta?.status === "NOK").length;
  const na = itens.length - aplicaveis.length + respostas.filter((resposta) => resposta?.status === "NA").length;
  const pendentes = aplicaveis.filter((item) => !inspecao.respostas[item.id]?.status);
  const invalidos = aplicaveis.filter((item) => {
    const resposta = inspecao.respostas[item.id];
    return resposta?.status === "NOK" && !resposta.observacao.trim();
  });

  return {
    total: itens.length,
    ok,
    nok,
    na,
    pendentes,
    invalidos,
    podeFinalizar: pendentes.length === 0 && invalidos.length === 0
  };
}
