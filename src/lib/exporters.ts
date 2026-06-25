import jsPDF from "jspdf";
import { estacoesIniciais, getChecklistItensPorEstacao } from "@/lib/checklist-data";
import type { Inspecao } from "@/types";

export function downloadInspectionPdf(inspecao: Inspecao) {
  const station = estacoesIniciais.find((item) => item.id === inspecao.estacao_id)?.nome || inspecao.estacao_id;
  const itens = getChecklistItensPorEstacao(inspecao.estacao_id);
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Relatório de Inspeção - Linha 6", 14, 18);
  doc.setFontSize(10);
  doc.text(`Estação: ${station}`, 14, 28);
  doc.text(`Data: ${inspecao.data}  Início: ${inspecao.horario_inicio}  Fim: ${inspecao.horario_fim || "-"}`, 14, 35);
  doc.text(`Responsável: ${inspecao.responsavel_nome}  RE: ${inspecao.responsavel_re}`, 14, 42);

  let y = 55;
  itens.forEach((item) => {
    const resposta = inspecao.respostas[item.id];
    const line = `${item.codigo} | ${item.categoria} | ${resposta?.status || "Pendente"} | ${resposta?.observacao || ""}`;
    const wrapped = doc.splitTextToSize(line, 180);
    if (y > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(wrapped, 14, y);
    y += wrapped.length * 5 + 2;
  });

  doc.save(`inspecao-${station}-${inspecao.data}.pdf`);
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
