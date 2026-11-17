import type { Tool } from "../tipos";

/**
 * Tool de EXEMPLO: mostra o formato que as tools seguem.
 * Lê só o catálogo público (cursos e próximas turmas), então não depende de quem pergunta.
 */
export const listarCursos: Tool = {
  definicao: {
    nome: "listar_cursos",
    descricao: "Lista os cursos da Academia Náutica Farol com carga horária, validade, preço e próximas turmas.",
    parametros: { type: "object", properties: {} },
  },
  async executar(_args, ctx) {
    const { data, error } = await ctx.supabase
      .from("cursos")
      .select("nome, slug, carga_horaria, validade_meses, preco, turmas(inicio, fim, vagas)")
      .order("nome");
    if (error) throw new Error(error.message);
    return (data ?? []).map((c) => ({
      nome: c.nome,
      slug: c.slug,
      carga_horaria: c.carga_horaria,
      validade_meses: c.validade_meses,
      preco: c.preco,
      proximas_turmas: (c.turmas ?? []).map((t: { inicio: string; fim: string }) => ({ inicio: t.inicio, fim: t.fim })),
    }));
  },
};
