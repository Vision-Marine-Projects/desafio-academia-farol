import { describe, expect, it } from "vitest";
import { responder } from "@/lib/assistente/agente";
import { provedorSimulado } from "@/lib/assistente/provedores/simulado";
import { listarCursos } from "@/lib/assistente/tools/listar-cursos";
import type { ContextoTool } from "@/lib/assistente/tipos";

/**
 * Exemplo de como testar o agente sem LLM e sem banco: provedor simulado
 * + um Supabase falso que devolve dados fixos.
 */
function supabaseFalso(tabelas: Record<string, unknown[]>) {
  return {
    from(tabela: string) {
      const consulta = {
        select: () => consulta,
        order: () => consulta,
        eq: () => consulta,
        then: (ok: (r: { data: unknown[]; error: null }) => unknown) => ok({ data: tabelas[tabela] ?? [], error: null }),
      };
      return consulta;
    },
  } as unknown as ContextoTool["supabase"];
}

describe("agente com provedor simulado", () => {
  it("usa listar_cursos para perguntas sobre cursos", async () => {
    const ctx: ContextoTool = {
      usuario: { id: "id-da-ana", papel: "aluno" },
      supabase: supabaseFalso({
        cursos: [{ nome: "NR-35 Trabalho em Altura", slug: "nr-35", carga_horaria: 8, validade_meses: 24, preco: 450, turmas: [] }],
      }),
    };
    const { texto, rastro } = await responder({
      historico: [{ papel: "usuario", texto: "Que cursos vocês têm?" }],
      ctx,
      provedor: provedorSimulado(),
      tools: [listarCursos],
    });
    expect(rastro.chamadas.map((c) => c.nome)).toEqual(["listar_cursos"]);
    expect(texto).toContain("NR-35");
  });
});
