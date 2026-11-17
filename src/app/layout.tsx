import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { usuarioAtual } from "@/lib/auth";

export const metadata: Metadata = { title: "Academia Náutica Farol" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioAtual();
  return (
    <html lang="pt-BR">
      <body>
        <header className="topo">
          <Link href="/" className="marca">⚓ Academia Náutica Farol</Link>
          <Link href="/validar">Validar certificado</Link>
          {usuario ? (
            <>
              <Link href="/aluno">Área do aluno</Link>
              {usuario.papel === "admin" && <Link href="/admin">Admin</Link>}
              <Link href="/sair">Sair ({usuario.nome.split(" ")[0]})</Link>
            </>
          ) : (
            <Link href="/login">Entrar</Link>
          )}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
