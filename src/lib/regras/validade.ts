/**
 * Regras de validade de certificado. Funções puras: sem banco, sem rede,
 * para poderem ser testadas sozinhas.
 */

export type CertificadoComValidade = {
  data_validade: string | null; // "AAAA-MM-DD"
};

/** Dias entre duas datas "AAAA-MM-DD" (positivo se `ate` for depois de `de`). */
export function diasEntre(de: string, ate: string): number {
  const [y1, m1, d1] = de.split("-").map(Number);
  const [y2, m2, d2] = ate.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** O certificado já venceu na data `hoje`? */
export function estaVencido(certificado: CertificadoComValidade, hoje: string): boolean {
  if (!certificado.data_validade) return true;
  return diasEntre(hoje, certificado.data_validade) < 0;
}

/** Vence nos próximos `janela` dias (inclusive hoje)? */
export function venceEmBreve(certificado: CertificadoComValidade, hoje: string, janela = 60): boolean {
  if (!certificado.data_validade) return false;
  const dias = diasEntre(hoje, certificado.data_validade);
  return dias >= 0 && dias <= janela;
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}
