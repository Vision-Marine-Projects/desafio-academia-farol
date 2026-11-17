"use client";

import { useState } from "react";

type Mensagem = { papel: "usuario" | "assistente"; texto: string };
type Rastro = { chamadas: { nome: string; args: unknown; resultado: unknown; erro?: string }[] };

export function Chat() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [rastro, setRastro] = useState<Rastro | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta || enviando) return;
    const novas: Mensagem[] = [...mensagens, { papel: "usuario", texto: pergunta }];
    setMensagens(novas);
    setTexto("");
    setEnviando(true);
    try {
      const r = await fetch("/api/assistente", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mensagens: novas }),
      });
      const json = await r.json();
      setMensagens([...novas, { papel: "assistente", texto: json.texto ?? json.erro ?? "Erro." }]);
      setRastro(json.rastro ?? null);
    } catch {
      setMensagens([...novas, { papel: "assistente", texto: "Não consegui falar com o servidor." }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="cartao">
      <div className="chat">
        {mensagens.length === 0 && <p className="muted">Ex.: "Quais certificados meus vencem este ano?"</p>}
        {mensagens.map((m, i) => (
          <div key={i} className={`balao ${m.papel}`}>{m.texto}</div>
        ))}
        {enviando && <div className="balao assistente muted">Pensando…</div>}
      </div>
      <form onSubmit={enviar} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua pergunta" />
        <button disabled={enviando}>Enviar</button>
      </form>
      {rastro && rastro.chamadas.length > 0 && (
        <details style={{ marginTop: 12 }}>
          <summary className="muted">Tools chamadas (só em desenvolvimento)</summary>
          <pre style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>{JSON.stringify(rastro, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
