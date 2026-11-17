import { exigirLogin } from "@/lib/auth";
import { buscarCertificados } from "@/lib/services/certificados";
import { estaVencido, venceEmBreve, hojeISO } from "@/lib/regras/validade";

const formatar = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");

export default async function MeusCertificados({ searchParams }: { searchParams: Promise<{ aluno?: string }> }) {
  const usuario = await exigirLogin();
  const { aluno } = await searchParams;

  // `?aluno=<id>` é o "ver como aluno" do admin (link na tela de alunos do admin).
  const certificados = await buscarCertificados(aluno ?? usuario.id);
  const hoje = hojeISO();

  return (
    <>
      <h1>Meus certificados</h1>
      <table>
        <thead><tr><th>Código</th><th>Curso</th><th>Emitido em</th><th>Validade</th><th>Situação</th></tr></thead>
        <tbody>
          {certificados.map((c) => {
            const situacao = estaVencido(c, hoje)
              ? <span className="etiqueta vencido">Vencido</span>
              : venceEmBreve(c, hoje)
                ? <span className="etiqueta alerta">Vence em breve</span>
                : <span className="etiqueta ok">Válido</span>;
            return (
              <tr key={c.id}>
                <td>{c.codigo}</td>
                <td>{c.curso?.nome}</td>
                <td>{formatar(c.emitido_em)}</td>
                <td>{c.data_validade ? formatar(c.data_validade) : "Sem validade"}</td>
                <td>{situacao}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
