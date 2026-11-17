import { NextResponse, type NextRequest } from "next/server";
import { usuarioAtual } from "@/lib/auth";
import { criarClienteServidor } from "@/lib/supabase/server";
import { responder } from "@/lib/assistente/agente";
import type { Turno } from "@/lib/assistente/tipos";

type MensagemChat = { papel: "usuario" | "assistente"; texto: string };

export async function POST(request: NextRequest) {
  const usuario = await usuarioAtual();
  if (!usuario) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const corpo = (await request.json().catch(() => null)) as { mensagens?: MensagemChat[] } | null;
  const mensagens = (corpo?.mensagens ?? []).slice(-20);
  if (!mensagens.length || mensagens[mensagens.length - 1].papel !== "usuario") {
    return NextResponse.json({ erro: "mensagem inválida" }, { status: 400 });
  }

  const historico: Turno[] = mensagens.map((m) =>
    m.papel === "usuario" ? { papel: "usuario", texto: String(m.texto) } : { papel: "assistente", texto: String(m.texto) },
  );

  try {
    const supabase = await criarClienteServidor();
    const { texto, rastro } = await responder({
      historico,
      ctx: { usuario: { id: usuario.id, papel: usuario.papel }, supabase },
    });
    return NextResponse.json({ texto, rastro: process.env.NODE_ENV === "development" ? rastro : undefined });
  } catch (e) {
    console.error("[assistente]", e);
    return NextResponse.json({ erro: "O assistente está indisponível agora." }, { status: 500 });
  }
}
