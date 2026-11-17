import type { Tool } from "../tipos";

/**
 * TODO (Tarefa 2): implemente esta tool.
 *
 * Ela devolve os certificados do aluno que está conversando, para o modelo
 * responder perguntas como "quais certificados meus vencem este ano?".
 * Você decide a definição (descrição e parâmetros) e o formato do resultado.
 */
export const meusCertificados: Tool = {
  definicao: {
    nome: "meus_certificados",
    descricao: "TODO",
    parametros: { type: "object", properties: {} },
  },
  async executar() {
    throw new Error("meus_certificados ainda não foi implementada");
  },
};
