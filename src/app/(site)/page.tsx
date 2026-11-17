import { criarClienteServidor } from "@/lib/supabase/server";
import { FormularioAvaliacao } from "@/components/FormularioAvaliacao";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await criarClienteServidor();
  const [{ data: cursos }, { data: avaliacoes }] = await Promise.all([
    supabase.from("cursos").select("id, slug, nome, descricao, carga_horaria, validade_meses, preco, turmas(inicio)").order("nome"),
    supabase.from("avaliacoes_curso").select("id, nome, nota, comentario, curso:cursos(nome)").order("criado_em", { ascending: false }).limit(6),
  ]);

  return (
    <>
      <h1>Cursos</h1>
      <div className="grade">
        {(cursos ?? []).map((c) => {
          const proxima = (c.turmas ?? []).map((t: { inicio: string }) => t.inicio).sort()[0];
          return (
            <div key={c.id} className="cartao">
              <strong>{c.nome}</strong>
              <p className="muted">{c.descricao}</p>
              <p className="muted">
                {c.carga_horaria}h · {c.validade_meses ? `validade de ${c.validade_meses} meses` : "sem validade"} · R$ {Number(c.preco).toFixed(2)}
              </p>
              {proxima && <p className="muted">Próxima turma: {proxima.split("-").reverse().join("/")}</p>}
            </div>
          );
        })}
      </div>

      <h2>O que os alunos dizem</h2>
      <div className="grade">
        {(avaliacoes ?? []).map((a) => (
          <div key={a.id} className="cartao">
            <strong>{"★".repeat(a.nota)}</strong>
            <p>{a.comentario}</p>
            <p className="muted">
              {a.nome} · {(a.curso as unknown as { nome: string } | null)?.nome}
            </p>
          </div>
        ))}
      </div>

      <h2>Avalie um curso</h2>
      <FormularioAvaliacao cursos={(cursos ?? []).map((c) => ({ id: c.id, nome: c.nome }))} />
    </>
  );
}
