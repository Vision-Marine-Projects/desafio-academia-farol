import type { SupabaseClient } from "@supabase/supabase-js";

/** Uma chamada de tool pedida pelo modelo. */
export type ChamadaTool = { id: string; nome: string; args: Record<string, unknown> };

/** Histórico da conversa num formato neutro; cada provedor converte para o seu. */
export type Turno =
  | { papel: "usuario"; texto: string }
  | { papel: "assistente"; texto?: string; chamadas?: ChamadaTool[] }
  | { papel: "tool"; resultados: { id: string; nome: string; conteudo: string }[] };

/** Descrição de uma tool para o modelo. `parametros` é um JSON Schema de objeto. */
export type DefinicaoTool = {
  nome: string;
  descricao: string;
  parametros: { type: "object"; properties: Record<string, unknown>; required?: string[] };
};

export type RespostaModelo = { texto?: string; chamadas: ChamadaTool[] };

export interface Provedor {
  nome: string;
  gerar(entrada: { sistema: string; turnos: Turno[]; tools: DefinicaoTool[] }): Promise<RespostaModelo>;
}

/** Contexto passado para as tools a cada execução. */
export type ContextoTool = {
  usuario: { id: string; papel: "aluno" | "admin" };
  /** Cliente do Supabase com a sessão do usuário (respeita a RLS). */
  supabase: SupabaseClient;
};

export type Tool = {
  definicao: DefinicaoTool;
  executar(args: Record<string, unknown>, ctx: ContextoTool): Promise<unknown>;
};

/** Registro do que aconteceu numa resposta, para depuração e evals. */
export type Rastro = {
  chamadas: { nome: string; args: Record<string, unknown>; resultado: unknown; erro?: string }[];
};
