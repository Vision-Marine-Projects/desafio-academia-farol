import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function Login({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;

  async function entrar(form: FormData) {
    "use server";
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("senha")),
    });
    if (error) redirect("/login?erro=1");
    redirect("/aluno");
  }

  return (
    <>
      <h1>Entrar</h1>
      <form className="pilha" action={entrar}>
        <input name="email" type="email" placeholder="E-mail" required />
        <input name="senha" type="password" placeholder="Senha" required />
        <button>Entrar</button>
        {erro && <p className="erro">E-mail ou senha incorretos.</p>}
      </form>
      <p className="muted">Usuários de teste: veja o README.</p>
    </>
  );
}
