import type { Provedor, RespostaModelo, Turno, DefinicaoTool } from "../tipos";

/** Anthropic Messages API (https://docs.anthropic.com). Usa fetch, sem SDK. */
export function provedorAnthropic(cfg: { modelo: string; apiKey: string }): Provedor {
  return {
    nome: "anthropic",
    async gerar({ sistema, turnos, tools }): Promise<RespostaModelo> {
      const corpo: Record<string, unknown> = {
        model: cfg.modelo,
        max_tokens: 1024,
        system: sistema,
        messages: converter(turnos),
      };
      if (tools.length) corpo.tools = tools.map(converterTool);

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify(corpo),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(`Anthropic ${r.status}: ${json?.error?.message ?? JSON.stringify(json)}`);

      const blocos = (json.content ?? []) as Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>;
      return {
        texto: blocos.filter((b) => b.type === "text").map((b) => b.text).join("\n") || undefined,
        chamadas: blocos
          .filter((b) => b.type === "tool_use")
          .map((b) => ({ id: b.id!, nome: b.name!, args: b.input ?? {} })),
      };
    },
  };
}

function converterTool(t: DefinicaoTool) {
  return { name: t.nome, description: t.descricao, input_schema: t.parametros };
}

function converter(turnos: Turno[]) {
  return turnos.map((t) => {
    if (t.papel === "usuario") return { role: "user", content: t.texto };
    if (t.papel === "assistente") {
      const content: unknown[] = [];
      if (t.texto) content.push({ type: "text", text: t.texto });
      for (const c of t.chamadas ?? []) content.push({ type: "tool_use", id: c.id, name: c.nome, input: c.args });
      return { role: "assistant", content: content.length ? content : t.texto ?? "" };
    }
    return {
      role: "user",
      content: t.resultados.map((r) => ({ type: "tool_result", tool_use_id: r.id, content: r.conteudo })),
    };
  });
}
