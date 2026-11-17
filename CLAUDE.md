# CLAUDE.md — Academia Náutica Farol

Regras do time para quem trabalha neste repositório (pessoas e agentes de IA).

## Arquitetura em uma frase

Regra pura → service → tela. A regra de negócio mora em `src/lib/regras/` (sem banco, sem rede), o service em `src/lib/services/` lê o banco e chama a regra, e a tela só desenha.

## Convenções

- Português nos nomes de domínio (`estaVencido`, `buscarCertificados`). Inglês só onde a plataforma obriga.
- Comentário explica o **porquê**, não o quê.
- Server actions ficam em arquivos `"use server"`; handlers HTTP em `src/app/api/**/route.ts`.
- Mudança de banco = migration nova em `supabase/migrations/AAAAMMDDHHMMSS_descricao.sql`, idempotente. Nunca edite uma migration já aplicada.
- `criarClienteAdmin()` ignora a RLS. Use só no servidor e só quando não houver outro jeito.

## Testes

- `npm test` roda o Vitest em `tests/`.
- **Prova negativa é obrigatória:** depois de escrever o teste, quebre o conserto de propósito e confirme que o teste reprova. Teste que passa dos dois jeitos não testa nada.

## Antes de abrir a PR

```bash
npm run typecheck
npm test
npm run build
```

Descreva na PR: o que mudou, como testar e o que ficou de fora. Atualize o `docs/backlog.csv`.
