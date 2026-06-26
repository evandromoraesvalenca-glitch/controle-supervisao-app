import jsPDF from "jspdf";
import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import { formatDate, isAplicavel, summarize } from "@/lib/utils";
import type { ChecklistItem, Inspecao } from "@/types";

async function imageToDataUrl(src: string) {
  const response = await fetch(src);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function normalizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function statusColor(status: string) {
  if (status === "OK") return [16, 124, 86] as const;
  if (status === "NOK") return [185, 28, 28] as const;
  if (status === "NA") return [100, 116, 139] as const;
  return [202, 138, 4] as const;
}

function statusLabel(status?: string | null) {
  return status === "NA" ? "N/A" : status || "Pendente";
}

function addPageHeader(doc: jsPDF, logoDataUrl: string | null, page: number, station: string) {
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 26, "F");
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 26, 200, 26);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 12, 6, 35, 14);
  } else {
    doc.setTextColor(11, 35, 68);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("linhauni", 13, 14);
    doc.setDrawColor(245, 130, 32);
    doc.setLineWidth(1.5);
    doc.line(13, 7, 45, 7);
  }

  doc.setTextColor(11, 35, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Relatorio Gerencial de Pre-Abertura", 64, 10);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`${station} | Controle da Supervisao`, 64, 16);
  doc.text(`Pagina ${page}`, 184, 16);
}

function addFooter(doc: jsPDF) {
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 286, 200, 286);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Documento gerado automaticamente pelo sistema Controle-Supervisao Linha 6.", 10, 291);
}

function ensureSpace(doc: jsPDF, y: number, needed: number, logoDataUrl: string | null, station: string) {
  if (y + needed <= 282) return y;
  addFooter(doc);
  doc.addPage();
  addPageHeader(doc, logoDataUrl, doc.getNumberOfPages(), station);
  return 34;
}

function metricCard(doc: jsPDF, x: number, y: number, label: string, value: string | number, color: readonly [number, number, number]) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y, 35, 19, 3, 3, "FD");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(label, x + 4, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(String(value), x + 4, y + 15);
}

function itemRow(doc: jsPDF, item: ChecklistItem, status: string, obs: string, fotos: string, y: number, index: number) {
  const alternate = index % 2 === 1;
  doc.setFillColor(alternate ? 248 : 255, alternate ? 250 : 255, alternate ? 252 : 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, y, 190, 22, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(11, 35, 68);
  doc.text(item.codigo, 14, y + 6);

  const [r, g, b] = statusColor(status);
  doc.setFillColor(r, g, b);
  doc.roundedRect(169, y + 3, 24, 7, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text(statusLabel(status), 181, y + 8, { align: "center" });

  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const title = `${item.categoria} | ${item.descricao}`;
  doc.text(doc.splitTextToSize(title, 146).slice(0, 2), 36, y + 6);

  const detail = obs ? `Obs.: ${obs}` : "Obs.: sem observacao registrada";
  doc.setTextColor(100, 116, 139);
  doc.text(doc.splitTextToSize(detail, 150).slice(0, 1), 36, y + 16);
  if (fotos) doc.text(doc.splitTextToSize(`Fotos: ${fotos}`, 45).slice(0, 1), 148, y + 16);
}

export async function downloadInspectionPdf(inspecao: Inspecao) {
  const station = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
  const itens = getChecklistItensPorEstacao(inspecao.estacao_id);
  const stats = summarize(inspecao, itens);
  const doc = new jsPDF();
  const logoDataUrl = await imageToDataUrl("/logo-linha6uni.png").catch(() => null);

  addPageHeader(doc, logoDataUrl, 1, station);

  doc.setFillColor(11, 35, 68);
  doc.roundedRect(10, 34, 190, 34, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Checklist Digital Operacional", 16, 46);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Relatorio gerencial de pre-abertura de estacao", 16, 54);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 16, 61);

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(126, 40, 66, 20, 3, 3, "F");
  doc.setTextColor(11, 35, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(station, 130, 49);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`${formatDate(inspecao.data)} | ${inspecao.turno}`, 130, 56);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, 75, 190, 32, 4, 4, "F");
  doc.setTextColor(11, 35, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Dados da inspecao", 16, 84);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Responsavel: ${inspecao.responsavel_nome}`, 16, 92);
  doc.text(`RE: ${inspecao.responsavel_re}`, 16, 99);
  doc.text(`Inicio: ${inspecao.horario_inicio}`, 72, 92);
  doc.text(`Fim: ${inspecao.horario_fim || "-"}`, 72, 99);
  doc.text(`Status: ${inspecao.status}`, 126, 92);
  doc.text(`ID: ${inspecao.id.slice(0, 8)}`, 126, 99);

  metricCard(doc, 10, 116, "Total", stats.total, [11, 35, 68]);
  metricCard(doc, 49, 116, "OK", stats.ok, [16, 124, 86]);
  metricCard(doc, 88, 116, "NOK", stats.nok, [185, 28, 28]);
  metricCard(doc, 127, 116, "N/A", stats.na, [100, 116, 139]);
  metricCard(doc, 166, 116, "Pend.", stats.pendentes.length + stats.invalidos.length, [202, 138, 4]);

  const nokItems = itens.filter((item) => inspecao.respostas[item.id]?.status === "NOK");
  doc.setTextColor(11, 35, 68);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Resumo Gerencial", 10, 150);
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const insights = [
    stats.podeFinalizar ? "Inspecao sem pendencias impeditivas para finalizacao." : "Existem itens pendentes ou NOK sem observacao.",
    nokItems.length ? `${nokItems.length} item(ns) em NOK exigem acompanhamento operacional.` : "Nenhum item NOK registrado.",
    "Fotos permanecem como evidencia opcional, quando houver necessidade de registro visual."
  ];
  let y = 158;
  insights.forEach((line) => {
    doc.text(`- ${line}`, 14, y);
    y += 6;
  });

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(11, 35, 68);
  doc.text("Itens do checklist", 10, y);
  y += 7;

  itens.forEach((item, index) => {
    y = ensureSpace(doc, y, 25, logoDataUrl, station);
    const resposta = inspecao.respostas[item.id];
    const status = !isAplicavel(item, inspecao) && !resposta?.status ? "NA" : statusLabel(resposta?.status);
    itemRow(doc, item, status, resposta?.observacao || "", resposta?.fotos.join(", ") || "", y, index);
    y += 25;
  });

  addFooter(doc);
  doc.save(`relatorio-gerencial-${normalizeFileName(station)}-${inspecao.data}.pdf`);
}

export function downloadInspectionsExcel(inspecoes: Inspecao[]) {
  const rows = inspecoes.flatMap((inspecao) => {
    const station = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
    return getChecklistItensPorEstacao(inspecao.estacao_id).map((item) => {
      const resposta = inspecao.respostas[item.id];
      return {
        inspecao_id: inspecao.id,
        estacao: station,
        data: inspecao.data,
        turno: inspecao.turno,
        status_inspecao: inspecao.status,
        responsavel: inspecao.responsavel_nome,
        re: inspecao.responsavel_re,
        categoria: item.categoria,
        codigo: item.codigo,
        descricao: item.descricao,
        status_item: resposta?.status || "Pendente",
        observacao: resposta?.observacao || "",
        fotos: resposta?.fotos.join(", ") || "",
        respondido_em: resposta?.respondido_em || ""
      };
    });
  });
  const headers = Object.keys(rows[0] || { inspecao_id: "" });
  const csv = [
    headers.join(";"),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header as keyof typeof row] ?? "").replace(/"/g, '""')}"`)
        .join(";")
    )
  ].join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "inspecoes-linha6.csv";
  link.click();
  URL.revokeObjectURL(url);
}
