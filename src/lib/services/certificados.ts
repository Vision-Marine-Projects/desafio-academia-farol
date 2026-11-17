"use server";

import { criarClienteAdmin } from "@/lib/supabase/admin";

export type CertificadoDoAluno = {
  id: string;
  codigo: string;
  emitido_em: string;
  data_validade: string | null;
  curso: { nome: string; slug: string } | null;
};

/**
 * Busca os certificados de um aluno, com o nome do curso.
 * Usado na área do aluno (e pelo admin, no "ver como aluno").
 */
export async function buscarCertificados(alunoId: string): Promise<CertificadoDoAluno[]> {
  const db = criarClienteAdmin();
  const { data, error } = await db
    .from("certificados")
    .select("id, codigo, emitido_em, data_validade, curso:cursos(nome, slug)")
    .eq("usuario_id", alunoId)
    .order("data_validade", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CertificadoDoAluno[];
}
