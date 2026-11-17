import type { Tool } from "../tipos";
import { listarCursos } from "./listar-cursos";
import { meusCertificados } from "./meus-certificados";

/** Todas as tools que o modelo pode usar. Para adicionar uma, crie o arquivo e inclua aqui. */
export const TOOLS: Tool[] = [listarCursos, meusCertificados];
