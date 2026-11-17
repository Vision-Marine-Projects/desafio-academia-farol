// Popula o banco com dados 100% fictícios.
// Uso: npm run seed   (precisa de NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local)
//
// Pode rodar quantas vezes quiser: apaga os dados de exemplo e recria.
// As datas são calculadas a partir de hoje, para sempre existir certificado
// vencido, vencendo em breve, válido e sem validade.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

carregarEnv(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENHA = process.env.SEED_SENHA || "Farol@2026";

if (!url || !serviceKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const USUARIOS = [
  { email: "carla.admin@farol.test", nome: "Carla Mendes", papel: "admin", cpf: "529.982.247-25" },
  { email: "ana@farol.test", nome: "Ana Souza", papel: "aluno", cpf: "123.456.789-09" },
  { email: "bruno@farol.test", nome: "Bruno Lima", papel: "aluno", cpf: "987.654.321-00" },
  { email: "diego@farol.test", nome: "Diego Rocha", papel: "aluno", cpf: "111.444.777-35" },
  { email: "elisa@farol.test", nome: "Elisa Martins", papel: "aluno", cpf: "390.533.447-05" },
  { email: "fabio@farol.test", nome: "Fábio Teixeira", papel: "aluno", cpf: "071.153.297-04" },
];

const CURSOS = [
  { slug: "nr-35", nome: "NR-35 Trabalho em Altura", descricao: "Capacitação para trabalho acima de 2 metros.", carga_horaria: 8, validade_meses: 24, preco: 450 },
  { slug: "nr-33", nome: "NR-33 Espaço Confinado", descricao: "Entrada e vigia em espaços confinados.", carga_horaria: 16, validade_meses: 12, preco: 690 },
  { slug: "dp-basico", nome: "DP Básico", descricao: "Fundamentos de posicionamento dinâmico.", carga_horaria: 40, validade_meses: 60, preco: 5200 },
  { slug: "huet", nome: "HUET — Escape de Aeronave Submersa", descricao: "Treinamento de escape para voos offshore.", carga_horaria: 12, validade_meses: 48, preco: 1800 },
  { slug: "ingles-maritimo", nome: "Inglês Técnico Marítimo", descricao: "Vocabulário e comunicação a bordo.", carga_horaria: 30, validade_meses: null, preco: 900 },
];

// [email, slug do curso, dias desde a emissão, dias até vencer (null = sem validade)]
const CERTIFICADOS = [
  ["ana@farol.test", "nr-35", 400, 330],
  ["ana@farol.test", "nr-33", 340, 25],
  ["ana@farol.test", "huet", 1500, -40],
  ["ana@farol.test", "ingles-maritimo", 200, null],
  ["bruno@farol.test", "dp-basico", 100, 1700],
  ["bruno@farol.test", "nr-35", 700, 30],
  ["bruno@farol.test", "huet", 300, 1160],
  ["diego@farol.test", "nr-33", 380, -15],
  ["diego@farol.test", "nr-35", 50, 680],
  ["elisa@farol.test", "dp-basico", 900, 900],
  ["elisa@farol.test", "ingles-maritimo", 60, null],
  ["fabio@farol.test", "huet", 20, 1440],
];

const AVALIACOES = [
  ["nr-35", "Marcos P.", 5, "Instrutor excelente, muito prático."],
  ["dp-basico", "Juliana R.", 4, "Simulador muito bom. Faltou café."],
  ["huet", "Rafael T.", 5, "Assustador e necessário."],
];

async function main() {
  console.log("→ Usuários");
  const ids = {};
  const { data: lista, error: eLista } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (eLista) throw eLista;
  for (const u of USUARIOS) {
    let existente = lista.users.find((x) => x.email === u.email);
    if (!existente) {
      const { data, error } = await db.auth.admin.createUser({
        email: u.email,
        password: SENHA,
        email_confirm: true,
      });
      if (error) throw error;
      existente = data.user;
    } else {
      await db.auth.admin.updateUserById(existente.id, { password: SENHA });
    }
    ids[u.email] = existente.id;
  }

  console.log("→ Limpando dados de exemplo");
  for (const t of ["avaliacoes_curso", "certificados", "matriculas", "turmas", "cursos"]) {
    const { error } = await db.from(t).delete().not("id", "is", null);
    if (error) throw error;
  }

  console.log("→ Perfis");
  const { error: ePerfis } = await db.from("perfis").upsert(
    USUARIOS.map((u) => ({ id: ids[u.email], nome: u.nome, email: u.email, cpf: u.cpf, papel: u.papel })),
  );
  if (ePerfis) throw ePerfis;

  console.log("→ Cursos e turmas");
  const { data: cursos, error: eCursos } = await db.from("cursos").insert(CURSOS).select();
  if (eCursos) throw eCursos;
  const cursoPorSlug = Object.fromEntries(cursos.map((c) => [c.slug, c]));

  const turmas = [];
  cursos.forEach((c, i) => {
    turmas.push({ curso_id: c.id, inicio: dia(10 + i * 3), fim: dia(12 + i * 3), vagas: 12 });
    turmas.push({ curso_id: c.id, inicio: dia(45 + i * 3), fim: dia(47 + i * 3), vagas: 12 });
  });
  const { data: turmasCriadas, error: eTurmas } = await db.from("turmas").insert(turmas).select();
  if (eTurmas) throw eTurmas;

  console.log("→ Matrículas");
  const matriculas = [
    ["ana@farol.test", 1], ["ana@farol.test", 6],
    ["bruno@farol.test", 4], ["diego@farol.test", 2],
    ["elisa@farol.test", 9], ["fabio@farol.test", 7],
  ].map(([email, i]) => ({ usuario_id: ids[email], turma_id: turmasCriadas[i].id }));
  const { error: eMat } = await db.from("matriculas").insert(matriculas);
  if (eMat) throw eMat;

  console.log("→ Certificados");
  const certs = CERTIFICADOS.map(([email, slug, desde, ate], i) => ({
    codigo: `FAR-${String(i + 1).padStart(4, "0")}`,
    usuario_id: ids[email],
    curso_id: cursoPorSlug[slug].id,
    emitido_em: dia(-desde),
    data_validade: ate === null ? null : dia(ate),
  }));
  const { error: eCert } = await db.from("certificados").insert(certs);
  if (eCert) throw eCert;

  console.log("→ Avaliações");
  const { error: eAv } = await db.from("avaliacoes_curso").insert(
    AVALIACOES.map(([slug, nome, nota, comentario]) => ({ curso_id: cursoPorSlug[slug].id, nome, nota, comentario })),
  );
  if (eAv) throw eAv;

  console.log(`\nPronto. Senha de todos os usuários: ${SENHA}`);
  for (const u of USUARIOS) console.log(`  ${u.papel.padEnd(5)}  ${u.email}`);
}

function dia(deslocamento) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + deslocamento);
  return d.toISOString().slice(0, 10);
}

function carregarEnv(arquivo) {
  if (!existsSync(arquivo)) return;
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

main().catch((e) => {
  console.error("Falhou:", e.message || e);
  process.exit(1);
});
