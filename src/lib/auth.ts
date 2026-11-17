import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export type Papel = "aluno" | "admin";
export type UsuarioLogado = { id: string; email: string; nome: string; papel: Papel };

/** Usuário da sessão atual, com o perfil. null se ninguém estiver logado. */
export async function usuarioAtual(): Promise<UsuarioLogado | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel")
    .eq("id", data.user.id)
    .single();
  if (!perfil) return null;
  return { id: data.user.id, email: data.user.email ?? "", nome: perfil.nome, papel: perfil.papel as Papel };
}

export async function exigirLogin(): Promise<UsuarioLogado> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  return u;
}

export async function exigirAdmin(): Promise<UsuarioLogado> {
  const u = await exigirLogin();
  if (u.papel !== "admin") redirect("/aluno");
  return u;
}
