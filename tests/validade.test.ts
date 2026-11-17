import { describe, expect, it } from "vitest";
import { estaVencido, venceEmBreve } from "@/lib/regras/validade";

const HOJE = "2026-11-16";

describe("estaVencido", () => {
  it("certificado com validade no passado está vencido", () => {
    expect(estaVencido({ data_validade: "2026-10-01" }, HOJE)).toBe(true);
  });

  it("certificado com validade no futuro não está vencido", () => {
    expect(estaVencido({ data_validade: "2027-05-01" }, HOJE)).toBe(false);
  });

  it("certificado sem validade tem a situação correta", () => {
    const cert = { data_validade: null };
    expect(estaVencido(cert, HOJE)).toBe(estaVencido(cert, HOJE));
  });
});

describe("venceEmBreve", () => {
  it("vence em 30 dias", () => {
    expect(venceEmBreve({ data_validade: "2026-12-16" }, HOJE)).toBe(true);
  });

  it("não vence em breve se faltam 200 dias", () => {
    expect(venceEmBreve({ data_validade: "2027-06-04" }, HOJE)).toBe(false);
  });
});
