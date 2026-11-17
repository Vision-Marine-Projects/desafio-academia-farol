/**
 * Roda os casos de evals/casos.json contra o agente, com o provedor do .env.local.
 *
 *   npm run evals                 → todos os casos
 *   npm run evals -- ana-meus     → só os casos cujo id contém "ana-meus"
 *
 * Cada caso entra logado como o usuário indicado (senha SEED_SENHA), então as
 * tools rodam com a mesma sessão e a mesma RLS que rodariam no app.
 *
 * Verificações disponíveis em "esperado" (todas opcionais):
 *   tools_chamadas      lista de tools que precisam ter sido chamadas
 *   tools_nao_chamadas  lista de tools que NÃO podem ter sido chamadas
 *   contem              textos que precisam aparecer na resposta final (sem diferenciar maiúsculas)
 *   nao_contem          textos que NÃO podem aparecer na resposta final nem nos resultados das tools
 *
 * Na mensagem, {{id:email}} é trocado pelo id (UUID) desse usuário. Útil para
 * simular alguém tentando pedir os dados de outro aluno pelo id.
 *
 * TODO (Tarefa 2): adicione os seus casos em evals/casos.json (pelo menos 6).
 * Se precisar de outro tipo de verificação, pode estender este arquivo.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { responder } from "../src/lib/assistente/agente";
import { provedorConfigurado } from "../src/lib/assistente/provedores";

type Caso = {
  id: string;
  descricao?: string;
  usuario: string;
  mensagem: string;
  esperado: { tools_chamadas?: string[]; tools_nao_chamadas?: string[]; contem?: string[]; nao_contem?: string[] };
};

carregarEnv(".env.local");

async function main() {
  const filtro = process.argv[2] ?? "";
  const casos = (JSON.parse(readFileSync("evals/casos.json", "utf8")) as Caso[]).filter((c) => c.id.includes(filtro));
  const provedor = provedorConfigurado();
  console.log(`Provedor: ${provedor.nome} · ${casos.length} caso(s)\n`);

  let aprovados = 0;
  for (const caso of casos) {
    const falhas: string[] = [];
    let texto = "";
    let chamadas: { nome: string; resultado: unknown; erro?: string }[] = [];
    try {
      const sessao = await entrar(caso.usuario);
      const mensagem = await trocarIds(caso.mensagem);
      const r = await responder({
        historico: [{ papel: "usuario", texto: mensagem }],
        ctx: { usuario: { id: sessao.id, papel: sessao.papel }, supabase: sessao.supabase },
        provedor,
      });
      texto = r.texto;
      chamadas = r.rastro.chamadas;
    } catch (e) {
      falhas.push(`erro: ${e instanceof Error ? e.message : String(e)}`);
    }

    const nomes = chamadas.map((c) => c.nome);
    const textoMin = texto.toLowerCase();
    const tudo = (texto + " " + JSON.stringify(chamadas.map((c) => c.resultado))).toLowerCase();
    const e = caso.esperado;
    for (const t of e.tools_chamadas ?? []) if (!nomes.includes(t)) falhas.push(`não chamou a tool ${t}`);
    for (const t of e.tools_nao_chamadas ?? []) if (nomes.includes(t)) falhas.push(`chamou a tool ${t}, que não devia`);
    for (const s of e.contem ?? []) if (!textoMin.includes(s.toLowerCase())) falhas.push(`resposta não contém "${s}"`);
    for (const s of e.nao_contem ?? []) if (tudo.includes(s.toLowerCase())) falhas.push(`vazou "${s}"`);
    for (const c of chamadas) if (c.erro) falhas.push(`tool ${c.nome} deu erro: ${c.erro}`);

    const ok = falhas.length === 0;
    if (ok) aprovados++;
    console.log(`${ok ? "✓" : "✗"} ${caso.id}${caso.descricao ? ` — ${caso.descricao}` : ""}`);
    for (const f of falhas) console.log(`    · ${f}`);
  }

  console.log(`\n${aprovados}/${casos.length} aprovados`);
  process.exit(aprovados === casos.length ? 0 : 1);
}

async function entrar(email: string) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: process.env.SEED_SENHA || "Farol@2026" });
  if (error || !data.user) throw new Error(`não consegui entrar como ${email}: ${error?.message}`);
  const { data: perfil } = await supabase.from("perfis").select("papel").eq("id", data.user.id).single();
  return { id: data.user.id, papel: (perfil?.papel ?? "aluno") as "aluno" | "admin", supabase };
}

async function trocarIds(texto: string): Promise<string> {
  const pedidos = [...texto.matchAll(/\{\{id:([^}]+)\}\}/g)];
  if (!pedidos.length) return texto;
  // Só o runner usa a service role, para descobrir ids. O agente nunca a recebe.
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  let saida = texto;
  for (const [marca, email] of pedidos) {
    const { data } = await admin.from("perfis").select("id").eq("email", email.trim()).single();
    if (!data) throw new Error(`usuário ${email} não encontrado`);
    saida = saida.replace(marca, data.id);
  }
  return saida;
}

function carregarEnv(arquivo: string) {
  if (!existsSync(arquivo)) return;
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

main();
