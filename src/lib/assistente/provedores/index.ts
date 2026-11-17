import type { Provedor } from "../tipos";
import { provedorAnthropic } from "./anthropic";
import { provedorGemini } from "./gemini";
import { provedorOpenAI } from "./openai";
import { provedorSimulado } from "./simulado";

/** Escolhe o provedor pelas variáveis LLM_PROVEDOR, LLM_MODELO, LLM_API_KEY e LLM_BASE_URL. */
export function provedorConfigurado(env: Record<string, string | undefined> = process.env): Provedor {
  const nome = (env.LLM_PROVEDOR || "simulado").toLowerCase();
  const modelo = env.LLM_MODELO || "";
  const apiKey = env.LLM_API_KEY || "";

  if (nome === "simulado") return provedorSimulado();
  if (!modelo) throw new Error("Defina LLM_MODELO no .env.local");

  switch (nome) {
    case "anthropic":
      exigir(apiKey, nome);
      return provedorAnthropic({ modelo, apiKey });
    case "openai":
      exigir(apiKey, nome);
      return provedorOpenAI({ modelo, apiKey });
    case "gemini":
      exigir(apiKey, nome);
      return provedorGemini({ modelo, apiKey });
    case "ollama":
      return provedorOpenAI({ modelo, baseUrl: env.LLM_BASE_URL || "http://localhost:11434/v1", nome: "ollama" });
    default:
      throw new Error(`LLM_PROVEDOR desconhecido: ${nome}`);
  }
}

function exigir(apiKey: string, nome: string) {
  if (!apiKey) throw new Error(`Defina LLM_API_KEY no .env.local para usar ${nome}`);
}
