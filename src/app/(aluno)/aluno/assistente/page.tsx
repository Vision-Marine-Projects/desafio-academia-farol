import { exigirLogin } from "@/lib/auth";
import { Chat } from "@/components/Chat";

export default async function Assistente() {
  await exigirLogin();
  return (
    <>
      <h1>Assistente do Aluno</h1>
      <p className="muted">Pergunte sobre os cursos da Academia Farol e sobre os seus certificados.</p>
      <Chat />
    </>
  );
}
