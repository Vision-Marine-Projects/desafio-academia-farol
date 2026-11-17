import { redirect } from "next/navigation";

export default function Validar() {
  async function buscar(form: FormData) {
    "use server";
    const codigo = String(form.get("codigo") ?? "").trim();
    if (codigo) redirect(`/validar/${encodeURIComponent(codigo)}`);
  }
  return (
    <>
      <h1>Validar certificado</h1>
      <p className="muted">Digite o código impresso no certificado (ex.: FAR-0001).</p>
      <form className="pilha" action={buscar}>
        <input name="codigo" placeholder="FAR-0001" required />
        <button>Validar</button>
      </form>
    </>
  );
}
