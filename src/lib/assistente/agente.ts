import type { ContextoTool, Provedor, Rastro, Tool, Turno } from "./tipos";
import { PROMPT_SISTEMA } from "./prompt";
import { TOOLS } from "./tools";
import { provedorConfigurado } from "./provedores";

const MAX_PASSOS = 5;

/**
 * Laço do agente: manda a conversa ao modelo; se ele pedir tools, executa,
 * devolve os resultados e repete, até o modelo responder com texto.
 */
export async function responder(entrada: {
  historico: Turno[];
  ctx: ContextoTool;
  provedor?: Provedor;
  tools?: Tool[];
  sistema?: string;
}): Promise<{ texto: string; rastro: Rastro }> {
  const provedor = entrada.provedor ?? provedorConfigurado();
  const tools = entrada.tools ?? TOOLS;
  const sistema = entrada.sistema ?? PROMPT_SISTEMA;
  const turnos: Turno[] = [...entrada.historico];
  const rastro: Rastro = { chamadas: [] };

  for (let passo = 0; passo < MAX_PASSOS; passo++) {
    const resposta = await provedor.gerar({ sistema, turnos, tools: tools.map((t) => t.definicao) });

    if (resposta.chamadas.length === 0) {
      return { texto: resposta.texto ?? "", rastro };
    }

    turnos.push({ papel: "assistente", texto: resposta.texto, chamadas: resposta.chamadas });
    const resultados: { id: string; nome: string; conteudo: string }[] = [];

    for (const chamada of resposta.chamadas) {
      const tool = tools.find((t) => t.definicao.nome === chamada.nome);
      let conteudo: string;
      if (!tool) {
        conteudo = JSON.stringify({ erro: `tool desconhecida: ${chamada.nome}` });
        rastro.chamadas.push({ nome: chamada.nome, args: chamada.args, resultado: null, erro: "tool desconhecida" });
      } else {
        try {
          const resultado = await tool.executar(chamada.args ?? {}, entrada.ctx);
          conteudo = JSON.stringify(resultado);
          rastro.chamadas.push({ nome: chamada.nome, args: chamada.args, resultado });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          conteudo = JSON.stringify({ erro: msg });
          rastro.chamadas.push({ nome: chamada.nome, args: chamada.args, resultado: null, erro: msg });
        }
      }
      resultados.push({ id: chamada.id, nome: chamada.nome, conteudo });
    }
    turnos.push({ papel: "tool", resultados });
  }

  return { texto: "Desculpe, não consegui concluir. Vou te encaminhar para o atendimento.", rastro };
}
