import type { Provedor, RespostaModelo, Turno, DefinicaoTool } from "../tipos";

/**
 * OpenAI Chat Completions (https://platform.openai.com/docs).
 * Também serve para o Ollama e outros compatíveis, trocando `baseUrl`.
 */
export function provedorOpenAI(cfg: { modelo: string; apiKey?: string; baseUrl?: string; nome?: string }): Provedor {
  const base = (cfg.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  return {
    nome: cfg.nome ?? "openai",
    async gerar({ sistema, turnos, tools }): Promise<RespostaModelo> {
      const corpo: Record<string, unknown> = {
        model: cfg.modelo,
        messages: [{ role: "system", content: sistema }, ...converter(turnos)],
      };
      if (tools.length) corpo.tools = tools.map(converterTool);

      const headers: Record<string, string> = { "content-type": "application/json" };
      if (cfg.apiKey) headers.authorization = `Bearer ${cfg.apiKey}`;
      const r = await fetch(`${base}/chat/completions`, { method: "POST", headers, body: JSON.stringify(corpo) });
      const json = await r.json();
      if (!r.ok) throw new Error(`${cfg.nome ?? "OpenAI"} ${r.status}: ${json?.error?.message ?? JSON.stringify(json)}`);

      const msg = json.choices?.[0]?.message ?? {};
      const chamadas = ((msg.tool_calls ?? []) as Array<{ id: string; function: { name: string; arguments: string } }>).map((c) => ({
        id: c.id,
        nome: c.function.name,
        args: lerJson(c.function.arguments),
      }));
      return { texto: msg.content || undefined, chamadas };
    },
  };
}

function lerJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

function converterTool(t: DefinicaoTool) {
  return { type: "function", function: { name: t.nome, description: t.descricao, parameters: t.parametros } };
}

function converter(turnos: Turno[]) {
  const out: unknown[] = [];
  for (const t of turnos) {
    if (t.papel === "usuario") out.push({ role: "user", content: t.texto });
    else if (t.papel === "assistente") {
      const m: Record<string, unknown> = { role: "assistant", content: t.texto ?? null };
      if (t.chamadas?.length) {
        m.tool_calls = t.chamadas.map((c) => ({
          id: c.id,
          type: "function",
          function: { name: c.nome, arguments: JSON.stringify(c.args) },
        }));
      }
      out.push(m);
    } else {
      for (const r of t.resultados) out.push({ role: "tool", tool_call_id: r.id, content: r.conteudo });
    }
  }
  return out;
}
