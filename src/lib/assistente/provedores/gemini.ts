import type { Provedor, RespostaModelo, Turno, DefinicaoTool } from "../tipos";

/** Google Gemini API (https://ai.google.dev). Usa fetch, sem SDK. Tem plano gratuito. */
export function provedorGemini(cfg: { modelo: string; apiKey: string }): Provedor {
  return {
    nome: "gemini",
    async gerar({ sistema, turnos, tools }): Promise<RespostaModelo> {
      const corpo: Record<string, unknown> = {
        systemInstruction: { parts: [{ text: sistema }] },
        contents: converter(turnos),
      };
      if (tools.length) corpo.tools = [{ functionDeclarations: tools.map(converterTool) }];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.modelo)}:generateContent`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": cfg.apiKey },
        body: JSON.stringify(corpo),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(`Gemini ${r.status}: ${json?.error?.message ?? JSON.stringify(json)}`);

      const partes = (json.candidates?.[0]?.content?.parts ?? []) as Array<{
        text?: string;
        functionCall?: { name: string; args?: Record<string, unknown> };
      }>;
      return {
        texto: partes.filter((p) => p.text).map((p) => p.text).join("\n") || undefined,
        chamadas: partes
          .filter((p) => p.functionCall)
          .map((p, i) => ({ id: `${p.functionCall!.name}-${i}`, nome: p.functionCall!.name, args: p.functionCall!.args ?? {} })),
      };
    },
  };
}

function converterTool(t: DefinicaoTool) {
  // O Gemini recusa um objeto de parâmetros vazio: sem propriedades, omitimos.
  const temParametros = Object.keys(t.parametros.properties ?? {}).length > 0;
  return temParametros
    ? { name: t.nome, description: t.descricao, parameters: t.parametros }
    : { name: t.nome, description: t.descricao };
}

function converter(turnos: Turno[]) {
  return turnos.map((t) => {
    if (t.papel === "usuario") return { role: "user", parts: [{ text: t.texto }] };
    if (t.papel === "assistente") {
      const parts: unknown[] = [];
      if (t.texto) parts.push({ text: t.texto });
      for (const c of t.chamadas ?? []) parts.push({ functionCall: { name: c.nome, args: c.args } });
      return { role: "model", parts };
    }
    return {
      role: "user",
      parts: t.resultados.map((r) => ({ functionResponse: { name: r.nome, response: { resultado: lerJson(r.conteudo) } } })),
    };
  });
}

function lerJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
