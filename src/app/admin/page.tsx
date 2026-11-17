import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";

const formatar = (d: string | null) => (d ? d.split("-").reverse().join("/") : "Sem validade");

export default async function Admin() {
  await exigirAdmin();
  const supabase = await criarClienteServidor();
  const [{ data: alunos }, { data: certificados }] = await Promise.all([
    supabase.from("perfis").select("id, nome, email, papel").order("nome"),
    supabase.from("certificados").select("id, codigo, data_validade, aluno:perfis(nome), curso:cursos(nome)").order("codigo"),
  ]);

  return (
    <>
      <h1>Admin</h1>
      <h2>Alunos</h2>
      <table>
        <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th></th></tr></thead>
        <tbody>
          {(alunos ?? []).map((a) => (
            <tr key={a.id}>
              <td>{a.nome}</td>
              <td>{a.email}</td>
              <td>{a.papel}</td>
              <td>{a.papel === "aluno" && <Link href={`/aluno/certificados?aluno=${a.id}`}>Ver como aluno</Link>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Certificados</h2>
      <table>
        <thead><tr><th>Código</th><th>Aluno</th><th>Curso</th><th>Validade</th></tr></thead>
        <tbody>
          {(certificados ?? []).map((c) => (
            <tr key={c.id}>
              <td>{c.codigo}</td>
              <td>{(c.aluno as unknown as { nome: string } | null)?.nome}</td>
              <td>{(c.curso as unknown as { nome: string } | null)?.nome}</td>
              <td>{formatar(c.data_validade)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
