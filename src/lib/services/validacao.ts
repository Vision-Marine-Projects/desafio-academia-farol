import { criarClienteAdmin } from "@/lib/supabase/admin";

export type ResultadoValidacao = {
  codigo: string;
  emitido_em: string;
  data_validade: string | null;
  curso: { nome: string } | null;
  aluno: { nome: string; cpf: string | null } | null;
};

/**
 * Valida um certificado pelo código (página pública /validar/[codigo]).
 * Usa o cliente admin porque quem valida não está logado.
 */
export async function validarCertificado(codigo: string): Promise<ResultadoValidacao | null> {
  const db = criarClienteAdmin();
  const { data } = await db
    .from("certificados")
    .select("*, curso:cursos(*), aluno:perfis(*)")
    .eq("codigo", codigo.trim().toUpperCase())
    .maybeSingle();
  return (data as unknown as ResultadoValidacao) ?? null;
}
