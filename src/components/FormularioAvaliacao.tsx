"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/navegador";

export function FormularioAvaliacao({ cursos }: { cursos: { id: string; nome: string }[] }) {
  const router = useRouter();
  const [estado, setEstado] = useState<"livre" | "enviando" | "ok" | "erro">("livre");

  async function enviar(form: FormData) {
    setEstado("enviando");
    const supabase = criarClienteNavegador();
    const { error } = await supabase.from("avaliacoes_curso").insert({
      curso_id: String(form.get("curso_id")),
      nome: String(form.get("nome")),
      nota: Number(form.get("nota")),
      comentario: String(form.get("comentario") ?? ""),
    });
    setEstado(error ? "erro" : "ok");
    if (!error) router.refresh();
  }

  return (
    <form className="pilha cartao" action={enviar}>
      <select name="curso_id" required>
        {cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <input name="nome" placeholder="Seu nome" required />
      <select name="nota" defaultValue="5">
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrela(s)</option>)}
      </select>
      <textarea name="comentario" placeholder="Comentário" rows={3} />
      <button disabled={estado === "enviando"}>Enviar avaliação</button>
      {estado === "ok" && <p className="muted">Obrigado pela avaliação!</p>}
      {estado === "erro" && <p className="erro">Não foi possível enviar.</p>}
    </form>
  );
}
