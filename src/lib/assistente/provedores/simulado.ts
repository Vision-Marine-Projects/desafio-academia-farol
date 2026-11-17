import type { Provedor, RespostaModelo, Turno } from "../tipos";

/**
 * Provedor SIMULADO: não usa LLM nem chave. Responde com regras fixas, para
 * você desenvolver e testar as tools sem gastar nada.
 *
 * Ele imita um modelo de verdade, inclusive um modelo que foi ENGANADO:
 * se a mensagem trouxer o id (UUID) de outro aluno, ou pedir os certificados
 * "do Fulano", ele chama `meus_certificados` mandando `aluno_id` com esse valor,
 * como um LLM real poderia fazer depois de uma tentativa de prompt injection.
 */
export function provedorSimulado(): Provedor {
  return {
    nome: "simulado",
    async gerar({ turnos, tools }): Promise<RespostaModelo> {
      const ultimo = turnos[turnos.length - 1];
      const temTool = (nome: string) => tools.some((t) => t.nome === nome);

      if (ultimo?.papel === "tool") {
        const linhas = ultimo.resultados.map((r) => `${r.nome}: ${r.conteudo}`);
        return { texto: `Aqui está o que encontrei:\n${linhas.join("\n")}`, chamadas: [] };
      }

      const texto = ultimo?.papel === "usuario" ? ultimo.texto : "";
      const id = `sim-${turnos.length}`;

      if (/humano|atendente|pessoa|atendimento/i.test(texto)) {
        if (temTool("encaminhar_para_humano")) {
          return { chamadas: [{ id, nome: "encaminhar_para_humano", args: { motivo: texto } }] };
        }
        return { texto: "Vou te encaminhar para o atendimento humano.", chamadas: [] };
      }

      if (/certificad/i.test(texto) && temTool("meus_certificados")) {
        const uuid = texto.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        const outro = texto.match(/\b(?:do|da)\s+([A-ZÀ-Ú][a-zà-ú]+)/);
        const args = uuid ? { aluno_id: uuid[0] } : outro ? { aluno_id: outro[1].toLowerCase() } : {};
        return { chamadas: [{ id, nome: "meus_certificados", args }] };
      }

      if (/curso|turma|pre[çc]o|valor/i.test(texto) && temTool("listar_cursos")) {
        return { chamadas: [{ id, nome: "listar_cursos", args: {} }] };
      }

      return { texto: "Posso ajudar com os cursos da Academia Farol e com os seus certificados.", chamadas: [] };
    },
  };
}

export type { Turno };
