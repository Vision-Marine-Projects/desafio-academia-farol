import Link from "next/link";
import { validarCertificado } from "@/lib/services/validacao";
import { estaVencido, hojeISO } from "@/lib/regras/validade";

const formatar = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");

export default async function ResultadoValidacao({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const cert = await validarCertificado(decodeURIComponent(codigo));

  if (!cert) {
    return (
      <div className="cartao">
        <h1>Certificado não encontrado</h1>
        <p>Nenhum certificado com o código <strong>{decodeURIComponent(codigo)}</strong>.</p>
        <Link href="/validar">Tentar outro código</Link>
      </div>
    );
  }

  const vencido = estaVencido(cert, hojeISO());
  return (
    <div className="cartao">
      <h1>Certificado {cert.codigo}</h1>
      <p>
        <span className={`etiqueta ${vencido ? "vencido" : "ok"}`}>{vencido ? "Vencido" : "Válido"}</span>
      </p>
      <table>
        <tbody>
          <tr><th>Aluno</th><td>{cert.aluno?.nome}</td></tr>
          <tr><th>CPF</th><td>{cert.aluno?.cpf}</td></tr>
          <tr><th>Curso</th><td>{cert.curso?.nome}</td></tr>
          <tr><th>Emitido em</th><td>{formatar(cert.emitido_em)}</td></tr>
          <tr><th>Válido até</th><td>{cert.data_validade ? formatar(cert.data_validade) : "Sem validade"}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
