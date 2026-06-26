const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de rodar o teste.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const now = new Date().toISOString();
const today = now.slice(0, 10);
const ids = {
  ausencia: crypto.randomUUID(),
  inspecao: crypto.randomUUID(),
  efetivo: crypto.randomUUID()
};

async function assertOk(label, request) {
  const { data, error } = await request;
  if (error) {
    console.error(`ERRO ${label}`);
    console.error(JSON.stringify(error, null, 2));
    process.exitCode = 1;
    return null;
  }
  console.log(`OK ${label}`);
  return data;
}

async function main() {
  await assertOk("ler ausencias", supabase.from("ausencias").select("*").limit(1));
  await assertOk(
    "salvar ausencia",
    supabase.from("ausencias").insert({
      id: ids.ausencia,
      colaborador: "Teste Supabase",
      tipo: "falta",
      registrado_por: "Teste",
      registrado_em: now
    })
  );

  const payload = {
    id: ids.inspecao,
    estacao_id: "teste",
    usuario_id: "teste",
    data: today,
    horario_inicio: "10:00",
    turno: "Manhã",
    status: "rascunho",
    responsavel_nome: "Teste",
    responsavel_re: "000",
    respostas: {}
  };

  await assertOk("ler app_inspecoes", supabase.from("app_inspecoes").select("*").limit(1));
  await assertOk(
    "salvar checklist",
    supabase.from("app_inspecoes").upsert({
      id: ids.inspecao,
      estacao_id: "teste",
      data: today,
      status: "rascunho",
      payload,
      atualizado_em: now
    })
  );

  await assertOk("ler levantamentos_efetivo", supabase.from("levantamentos_efetivo").select("*").limit(1));
  await assertOk(
    "salvar efetivo",
    supabase.from("levantamentos_efetivo").insert({
      id: ids.efetivo,
      data_referencia: today,
      hora_preenchimento: "10:00",
      estacao: "Teste",
      supervisor: "Teste",
      lideres: 1,
      aas: 2,
      aa: 3,
      efetivo_total: 6,
      observacao: "Teste",
      usuario_id: "teste",
      criado_em: now,
      atualizado_em: now
    })
  );

  await assertOk("limpar ausencia teste", supabase.from("ausencias").delete().eq("id", ids.ausencia));
  await assertOk("limpar checklist teste", supabase.from("app_inspecoes").delete().eq("id", ids.inspecao));
  await assertOk("limpar efetivo teste", supabase.from("levantamentos_efetivo").delete().eq("id", ids.efetivo));

  if (!process.exitCode) console.log("TODOS OS TESTES PASSARAM");
}

main();
