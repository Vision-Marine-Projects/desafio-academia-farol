import Link from "next/link";
import { exigirLogin } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";

const formatar = (d: string) => d.split("-").reverse().join("/");

export default async function AreaDoAluno() {
  const usuario = await exigirLogin();
  const supabase = await criarClienteServidor();
  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("id, status, turma:turmas(inicio, fim, curso:cursos(nome))")
    .eq("usuario_id", usuario.id);

  return (
    <>
      <h1>Olá, {usuario.nome.split(" ")[0]}</h1>
      <p>
        <Link href="/aluno/certificados">Meus certificados</Link> · <Link href="/aluno/assistente">Assistente do Aluno</Link>
      </p>
      <h2>Minhas matrículas</h2>
      <table>
        <thead><tr><th>Curso</th><th>Início</th><th>Fim</th><th>Status</th></tr></thead>
        <tbody>
          {(matriculas ?? []).map((m) => {
            const turma = m.turma as unknown as { inicio: string; fim: string; curso: { nome: string } };
            return (
              <tr key={m.id}>
                <td>{turma.curso.nome}</td>
                <td>{formatar(turma.inicio)}</td>
                <td>{formatar(turma.fim)}</td>
                <td>{m.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
