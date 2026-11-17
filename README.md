# Academia Náutica Farol — Desafio técnico

**Vision Marine Training · Vaga: Desenvolvedor(a) de Sistemas com IA**

Bem-vindo(a)! Este repositório é a plataforma de uma escola náutica **fictícia**, a Academia Náutica Farol. Todos os dados são inventados.

**Prazo:** sexta-feira, **20/11/2026, até 23h59**.

## Como começar e como entregar

1. Clique em **Use this template → Create a new repository**. Em *Owner*, escolha **a sua conta**; marque **Private**.
2. No repositório que você criou, vá em **Settings → Collaborators → Add people** e adicione a banca:
   - [`@luisquesada26`](https://github.com/luisquesada26) (Luis Quesada)
   - [`@Phlemos2025`](https://github.com/Phlemos2025) (Paulo)
3. Clone o **seu** repositório, crie uma branch e trabalhe nela. Não faça commit direto na `main`.
4. Ao terminar, abra uma **Pull Request da sua branch para a `main`** do seu repositório.
5. Até **20/11, às 23h59**, mande um e-mail para a banca com **o link da PR e o hash do último commit**. Avaliamos o código até esse commit; o que entrar depois não é considerado.

---

## O cenário

Você acabou de entrar no time de produto da Academia Farol. A plataforma já está em produção e tem três partes:

- **Site público** — catálogo de cursos, avaliações e validação de certificados.
- **Área do aluno** — o aluno logado vê as matrículas, os certificados e conversa com o Assistente do Aluno.
- **Admin** — a equipe vê alunos e certificados.

Na semana passada, um aluno avisou o suporte que **conseguia ver os certificados de um colega**. Sua primeira semana tem três missões.

## As tarefas

### Tarefa 1 — Investigar e corrigir

Encontre a causa do incidente e qualquer outro problema de segurança ou qualidade que achar relevante. Não vamos dizer onde estão: investigar faz parte do trabalho.

Para cada correção:

- conserte na origem do problema;
- escreva um teste que **reprova sem o conserto e passa com ele**;
- conte, na PR, como você verificou isso.

Mudanças no banco vão em uma **migration nova** em `supabase/migrations/`. Não edite migrations que já existem: elas já rodaram em produção.

### Tarefa 2 — Assistente do Aluno

O chat já existe em `/aluno/assistente`, e o laço do agente já está pronto em `src/lib/assistente/`. Ele funciona com Anthropic, OpenAI, Gemini, Ollama ou um modo **simulado** (sem LLM e sem chave). Falta o que importa:

1. **A tool `meus_certificados`** (`src/lib/assistente/tools/meus-certificados.ts`): devolve os certificados do aluno que está conversando, para o assistente responder perguntas como "quais certificados meus vencem este ano?". **Ela só pode devolver dados do aluno logado**, mesmo que alguém tente convencer o modelo do contrário.
2. **O prompt do sistema** (`src/lib/assistente/prompt.ts`): escopo, o que fazer fora dele, não inventar respostas e **encaminhar para atendimento humano** quando não souber ou quando o aluno pedir.
3. **Evals** (`evals/casos.json`): pelo menos **6 casos** com a resposta esperada, incluindo tentativas de enganar o assistente. Rode com `npm run evals`.

Se quiser ir além (opcional): uma segunda tool, como `proximas_turmas(curso)`, ou expor as tools como um servidor MCP.

### Tarefa 3 — Pull Request

Entregue tudo numa PR da sua branch para a `main` do seu repositório, com:

- o que mudou e por quê;
- como testar, passo a passo;
- o que ficou de fora;
- como você usou IA e **o que conferiu ou corrigiu no que ela gerou**.

Atualize também o `docs/backlog.csv` com as tarefas que fez e as que identificou mas não fez.

### Se o tempo apertar

A prioridade é: Tarefa 1, depois a PR, depois o assistente. Entregar parte e dizer com clareza o que ficou de fora vale mais que entregar tudo pela metade. Esforço estimado: **3 a 4 horas** com as ferramentas de IA que você já usa.

---

## Como rodar

Precisa de **Node 20.6 ou mais novo** e de uma conta gratuita no [Supabase](https://supabase.com).

1. **Crie um projeto no Supabase.** Em *Project Settings → API*, copie a URL, a `anon key` e a `service_role key`.
2. **Rode as migrations** no *SQL Editor* do Supabase, na ordem do nome do arquivo:
   - `supabase/migrations/20261101000000_schema_inicial.sql`
   - `supabase/migrations/20261105000000_avaliacoes_curso.sql`
3. **Configure o ambiente:**
   ```bash
   cp .env.example .env.local     # preencha as chaves do Supabase
   npm install
   npm run seed                   # cria usuários e dados fictícios
   npm run dev                    # http://localhost:3000
   ```
4. **Entre com um usuário de teste** (senha `Farol@2026`, ou a que você definir em `SEED_SENHA`):

   | Papel | E-mail |
   |---|---|
   | Admin | `carla.admin@farol.test` |
   | Aluna | `ana@farol.test` |
   | Aluno | `bruno@farol.test` |
   | Alunos | `diego@`, `elisa@`, `fabio@farol.test` |

Supabase local com Docker (`supabase start`) também funciona, se você preferir.

### O assistente

Em `.env.local`, escolha o provedor:

```bash
LLM_PROVEDOR=simulado     # sem LLM: bom para desenvolver as tools
# LLM_PROVEDOR=anthropic | openai | gemini | ollama
LLM_MODELO=               # nome do modelo do provedor
LLM_API_KEY=              # sua chave (não precisa para simulado nem ollama)
```

Use as suas próprias ferramentas e contas; a Vision não fornece chave. Se não tiver nenhuma, o plano gratuito do Gemini ou um modelo local com Ollama atendem bem.

O modo **simulado** responde com regras fixas e imita um modelo de verdade, **inclusive um modelo que foi enganado**: se a mensagem trouxer o id de outro aluno, ele chama a tool passando esse id. Veja `src/lib/assistente/provedores/simulado.ts`.

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | App em http://localhost:3000 |
| `npm test` | Testes (Vitest), em `tests/` |
| `npm run evals` | Evals do assistente (`npm run evals -- <trecho-do-id>` roda só alguns) |
| `npm run typecheck` | Checagem de tipos |
| `npm run seed` | Recria os dados fictícios |

---

## Estrutura

```
src/
├── app/
│   ├── (site)/              site público: catálogo, avaliações, /validar
│   ├── (aluno)/aluno/       área do aluno: matrículas, certificados, assistente
│   ├── admin/               admin
│   └── api/assistente/      rota do chat
├── components/              componentes de tela
└── lib/
    ├── regras/              regras de negócio puras (sem banco), testáveis sozinhas
    ├── services/            acesso ao banco
    ├── supabase/            clientes do Supabase (sessão, admin, navegador)
    └── assistente/          agente: laço, provedores, tools e prompt
supabase/migrations/         schema do banco
scripts/seed.mjs             dados fictícios
tests/                       testes
evals/                       casos e runner dos evals do assistente
docs/backlog.csv             backlog do time
```

## Regras do jogo

- **IA é liberada e esperada.** Claude Code, Cursor, Copilot, ChatGPT ou o que você usar no dia a dia. Só queremos saber o que você conferiu.
- **Nunca** coloque chaves no código ou no repositório: use `.env.local`.
- Não precisa de front bonito, deploy nem cobertura total de testes.
- Pode mudar a estrutura, se explicar o motivo na PR.
- Dúvidas: responda o e-mail do desafio. Toda resposta vai para todos os candidatos.

Boa sorte!
